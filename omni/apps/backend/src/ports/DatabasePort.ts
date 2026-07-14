import { ParentProfile, PlayerProfile } from "@omni/shared";

export interface DatabasePort {
  createParent(email: string, phone: string): Promise<ParentProfile>;
  createPlayer(parentId: string, name: string, dateOfBirth: Date): Promise<PlayerProfile>;
  getParentById(parentId: string, activeParentId: string): Promise<ParentProfile | null>;
  getPlayersForParent(parentId: string, activeParentId: string): Promise<PlayerProfile[]>;
}
