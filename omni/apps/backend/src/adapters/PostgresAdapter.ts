import pg from "pg";
import { DatabasePort } from "../ports/DatabasePort.js";
import { ParentProfile, PlayerProfile } from "@omni/shared";
import crypto from "crypto";

export class PostgresAdapter implements DatabasePort {
  private pool: pg.Pool | null = null;
  
  // In-memory fallback database simulating Row-Level Security
  private mockParents: Map<string, ParentProfile> = new Map();
  private mockPlayers: Map<string, PlayerProfile> = new Map();

  constructor(connectionString: string) {
    try {
      this.pool = new pg.Pool({
        connectionString,
        connectionTimeoutMillis: 2000,
      });
      // Test the pool lazily
    } catch (e) {
      console.warn("PostgreSQL Pool initialization failed, running in secure In-Memory Mock mode:", e);
      this.pool = null;
    }

    // Pre-populate rich mock data for local testing
    const seedParentId = "3c9b1392-8083-4a62-9759-b1d624a9c680";
    this.mockParents.set(seedParentId, {
      id: seedParentId,
      email: "dave@getonsides.com",
      phone: "(555) 304-9821",
      createdAt: new Date(),
    });

    this.mockPlayers.set("maya-player-uuid-1", {
      id: "maya-player-uuid-1",
      parentId: seedParentId,
      name: "Maya Mills",
      dateOfBirth: new Date("2015-05-10"),
      createdAt: new Date(),
    });

    this.mockPlayers.set("leo-player-uuid-2", {
      id: "leo-player-uuid-2",
      parentId: seedParentId,
      name: "Leo Mills",
      dateOfBirth: new Date("2018-10-22"),
      createdAt: new Date(),
    });
  }

  private async isDbConnected(): Promise<boolean> {
    if (!this.pool) return false;
    try {
      const client = await this.pool.connect();
      client.release();
      return true;
    } catch (e) {
      console.warn("PostgreSQL connection failed. Falling back to secure In-Memory Mock database.");
      this.pool = null; // Mark as null to use mock database henceforth
      return false;
    }
  }

  // Helper to run query with tenant context inside local transaction block
  private async runWithTenantContext<T>(
    activeParentId: string,
    queryFn: (client: pg.PoolClient) => Promise<T>
  ): Promise<T> {
    if (!this.pool) {
      throw new Error("No database connection pool active.");
    }
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('app.current_parent_id', $1, true)", [
        activeParentId,
      ]);
      const result = await queryFn(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async createParent(email: string, phone: string): Promise<ParentProfile> {
    const parentId = crypto.randomUUID();
    const newParent: ParentProfile = {
      id: parentId,
      email,
      phone,
      createdAt: new Date(),
    };

    if (await this.isDbConnected() && this.pool) {
      const client = await this.pool.connect();
      try {
        const res = await client.query(
          `INSERT INTO parent_profiles (id, email, phone, created_at)
           VALUES ($1, $2, $3, NOW())
           RETURNING id, email, phone, created_at as "createdAt"`,
          [parentId, email, phone]
        );
        return res.rows[0];
      } finally {
        client.release();
      }
    } else {
      this.mockParents.set(parentId, newParent);
      return newParent;
    }
  }

  async createPlayer(parentId: string, name: string, dateOfBirth: Date): Promise<PlayerProfile> {
    const playerId = crypto.randomUUID();
    const newPlayer: PlayerProfile = {
      id: playerId,
      parentId,
      name,
      dateOfBirth,
      createdAt: new Date(),
    };

    if (await this.isDbConnected() && this.pool) {
      return this.runWithTenantContext(parentId, async (client) => {
        const res = await client.query(
          `INSERT INTO player_profiles (id, parent_id, name, date_of_birth, created_at)
           VALUES ($1, $2, $3, $4, NOW())
           RETURNING id, parent_id as "parentId", name, date_of_birth as "dateOfBirth", created_at as "createdAt"`,
          [playerId, parentId, name, dateOfBirth]
        );
        return res.rows[0];
      });
    } else {
      // Simulate Database check: parent must exist
      if (!this.mockParents.has(parentId)) {
        throw new Error("Foreign key violation: Parent does not exist.");
      }
      this.mockPlayers.set(playerId, newPlayer);
      return newPlayer;
    }
  }

  async getParentById(parentId: string, activeParentId: string): Promise<ParentProfile | null> {
    if (await this.isDbConnected() && this.pool) {
      return this.runWithTenantContext(activeParentId, async (client) => {
        const res = await client.query(
          `SELECT id, email, phone, created_at as "createdAt"
           FROM parent_profiles
           WHERE id = $1`,
          [parentId]
        );
        return res.rows.length ? res.rows[0] : null;
      });
    } else {
      // Simulate Postgres RLS: query filters by app.current_parent_id context
      if (parentId !== activeParentId) {
        return null; // RLS blocks read across tenants
      }
      return this.mockParents.get(parentId) || null;
    }
  }

  async getPlayersForParent(parentId: string, activeParentId: string): Promise<PlayerProfile[]> {
    if (await this.isDbConnected() && this.pool) {
      return this.runWithTenantContext(activeParentId, async (client) => {
        const res = await client.query(
          `SELECT id, parent_id as "parentId", name, date_of_birth as "dateOfBirth", created_at as "createdAt"
           FROM player_profiles
           WHERE parent_id = $1`,
          [parentId]
        );
        return res.rows;
      });
    } else {
      // Simulate Postgres RLS: parent_id must match activeParentId context
      if (parentId !== activeParentId) {
        return []; // RLS blocks access
      }
      return Array.from(this.mockPlayers.values()).filter(p => p.parentId === parentId);
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }
  }
}
