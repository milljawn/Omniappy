import fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { PostgresAdapter } from "./adapters/PostgresAdapter.js";
import { CreateParentProfileInputSchema, CreatePlayerProfileInputSchema } from "@omni/shared";
import { LogisticsService } from "./services/logisticsService.js";
import { CalendarService } from "./services/calendarService.js";
import { ChatService } from "./services/chatService.js";
import { PaymentService } from "./services/paymentService.js";
import { EncryptionService } from "./services/encryptionService.js";
import { ParentVueService } from "./services/parentvueService.js";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/omni";

const server = fastify({ logger: true });

// Initialize database adapter
const dbAdapter = new PostgresAdapter(connectionString);

server.register(cors, {
  origin: "*",
});

server.register(helmet);

server.register(rateLimit, {
  max: 100,
  timeWindow: "1 minute",
});

// Health check endpoint
server.get("/health", async () => {
  return { status: "OK", timestamp: new Date().toISOString() };
});

// Route: Register Parent Profile
server.post("/parents", async (request, reply) => {
  try {
    const input = CreateParentProfileInputSchema.parse(request.body);
    const parent = await dbAdapter.createParent(input.email, input.phone);
    return reply.status(210).send(parent);
  } catch (error: any) {
    server.log.error(error);
    return reply.status(400).send({ error: error.message || "Invalid parent registration request" });
  }
});

// Route: Register Child Player Profile under Parent (RLS Enforced)
server.post("/players", async (request, reply) => {
  try {
    const activeParentId = request.headers["x-active-parent-id"] as string;
    if (!activeParentId) {
      return reply.status(401).send({ error: "Missing x-active-parent-id header context for tenant boundaries" });
    }

    const input = CreatePlayerProfileInputSchema.parse(request.body);
    
    // Safety check: Make sure parent context matches request body parentId
    if (input.parentId !== activeParentId) {
      return reply.status(403).send({ error: "Context boundary violation: Cannot create players under another parent account" });
    }

    const player = await dbAdapter.createPlayer(input.parentId, input.name, input.dateOfBirth);
    return reply.status(210).send(player);
  } catch (error: any) {
    server.log.error(error);
    return reply.status(400).send({ error: error.message || "Invalid player creation request" });
  }
});

// Route: Get Child Player Profiles for Parent (RLS Enforced)
server.get("/players", async (request, reply) => {
  try {
    const activeParentId = request.headers["x-active-parent-id"] as string;
    if (!activeParentId) {
      return reply.status(401).send({ error: "Missing x-active-parent-id header" });
    }
    const players = await dbAdapter.getPlayersForParent(activeParentId, activeParentId);
    return reply.status(200).send(players);
  } catch (error: any) {
    server.log.error(error);
    return reply.status(400).send({ error: error.message || "Query execution failed" });
  }
});

// --- NEW FEATURES WIRE-IN ---

// Route: Get Activity Groups (Seed Data - Story 1.4)
server.get("/activity-groups", async (request, reply) => {
  const activeParentId = request.headers["x-active-parent-id"] as string;
  if (!activeParentId) {
    return reply.status(401).send({ error: "Missing x-active-parent-id header context" });
  }

  const groups = [
    { id: "g1", name: "Barca Academy U12 Soccer", category: "soccer", orgName: "Atlanta Youth Soccer association" },
    { id: "g2", name: "Downtown Dance Studio Ballet Prep", category: "dance", orgName: "Metropolitan Dance Alliance" },
    { id: "g3", name: "Atlanta Swim Club Red team", category: "swim", orgName: "Georgia Swim Division" },
    { id: "g4", name: "Downtown Piano Lessons", category: "music", orgName: "Downtown Conservatoire" },
    { id: "g5", name: "Scout Troop 45 Patrol", category: "scouts", orgName: "BSA Atlanta Council" }
  ];

  return reply.status(200).send(groups);
});

// Route: Get Unified Master Calendar Events Timeline (Seed Data - Story 3.1)
server.get("/events", async (request, reply) => {
  const activeParentId = request.headers["x-active-parent-id"] as string;
  if (!activeParentId) {
    return reply.status(401).send({ error: "Missing x-active-parent-id header context" });
  }

  const events = [
    {
      id: "e1",
      groupId: "g1",
      kid: "Maya Mills",
      kidColor: "#3B82F6",
      title: "Travel Soccer Match vs Concorde",
      groupName: "Barca Academy U12 Soccer",
      time: "4:00 PM - 5:30 PM",
      startTime: "2026-07-15T16:00:00Z",
      endTime: "2026-07-15T17:30:00Z",
      attireGear: "Blue Training Kit, shin guards, cleats, water",
      locationName: "Oak Park Field #4",
      lat: 33.7890,
      lng: -84.3879,
    },
    {
      id: "e2",
      groupId: "g2",
      kid: "Leo Mills",
      kidColor: "#EC4899",
      title: "Ballet Recital Dress Rehearsal",
      groupName: "Downtown Dance Studio Ballet Prep",
      time: "5:45 PM - 7:00 PM",
      startTime: "2026-07-15T17:45:00Z",
      endTime: "2026-07-15T19:00:00Z",
      attireGear: "Black leotard, pink tights, ballet shoes",
      locationName: "Symphony Hall entrance B",
      lat: 33.7899,
      lng: -84.3820,
      isConflict: true,
      conflictMsg: "Conflict: Tight Travel (Est. transit buffer is under 10 minutes)",
    },
    {
      id: "e3",
      groupId: "g3",
      kid: "Maya & Leo Mills",
      kidColor: "#06B6D4",
      title: "Swim Meet Invitational Finals",
      groupName: "Atlanta Swim Club Red team",
      time: "8:00 AM - 12:00 PM",
      startTime: "2026-07-18T08:00:00Z",
      endTime: "2026-07-18T12:00:00Z",
      attireGear: "Swimsuit, goggles, team cap, two towels",
      locationName: "Atlanta Swim Center Pool",
      lat: 33.7490,
      lng: -84.3880,
    },
    {
      id: "e4",
      groupId: "g4",
      kid: "Leo Mills",
      kidColor: "#F59E0B",
      title: "Private Piano Solo Lesson",
      groupName: "Downtown Piano Lessons",
      time: "2:00 PM - 3:00 PM",
      startTime: "2026-07-19T14:00:00Z",
      endTime: "2026-07-19T15:00:00Z",
      attireGear: "Lesson Book 2, notebook",
      locationName: "Piano Studio Room A",
      lat: 33.7540,
      lng: -84.3720,
    },
    {
      id: "e5",
      groupId: "g5",
      kid: "Maya Mills",
      kidColor: "#10B981",
      title: "Scout Patrol Camp Preparation",
      groupName: "Scout Troop 45 Patrol",
      time: "6:30 PM - 8:00 PM",
      startTime: "2026-07-20T18:30:00Z",
      endTime: "2026-07-20T20:00:00Z",
      attireGear: "Scout Class A uniform, scout handbook",
      locationName: "Community Church Hall",
      lat: 33.7620,
      lng: -84.3680,
    }
  ];

  return reply.status(200).send(events);
});

// Route: Drive Time Conflict & Logistics Check (Story 3.2)
server.post("/logistics/check-conflict", async (request, reply) => {
  try {
    const { locA, timeAEnd, locB, timeBStart } = request.body as any;
    if (!locA || !timeAEnd || !locB || !timeBStart) {
      return reply.status(400).send({ error: "Missing required logistics parameters" });
    }

    const conflictReport = LogisticsService.checkTravelConflict(
      locA,
      new Date(timeAEnd),
      locB,
      new Date(timeBStart)
    );
    return reply.status(200).send(conflictReport);
  } catch (error: any) {
    return reply.status(400).send({ error: error.message });
  }
});

// Route: Ingest and Parse iCal feeds (Story 2.2)
server.post("/calendars/sync", async (request, reply) => {
  try {
    const { icsContent, groupId } = request.body as any;
    if (!icsContent || !groupId) {
      return reply.status(400).send({ error: "Missing icsContent or groupId" });
    }

    const parsedEvents = CalendarService.parseIcs(icsContent, groupId);
    return reply.status(210).send({ syncedCount: parsedEvents.length, events: parsedEvents });
  } catch (error: any) {
    return reply.status(400).send({ error: error.message });
  }
});

// Route: Send isolated messages & Broadcast Emergency Alerts (Story 4.1, 4.2)
server.post("/chat/messages", async (request, reply) => {
  try {
    const activeParentId = request.headers["x-active-parent-id"] as string;
    if (!activeParentId) {
      return reply.status(401).send({ error: "Missing active parent header context" });
    }

    const { groupId, senderName, text, isEmergency, rosterParents } = request.body as any;
    if (!groupId || !senderName || !text) {
      return reply.status(400).send({ error: "Missing required chat parameters" });
    }

    // In a live environment, rosterParents is fetched from PostgresAdapter using RLS.
    // For local checks, we pass it or simulate it:
    const targets = rosterParents || [{ id: activeParentId, name: senderName }];

    const result = await ChatService.broadcastMessage(
      groupId,
      activeParentId,
      senderName,
      text,
      !!isEmergency,
      targets
    );

    return reply.status(210).send(result);
  } catch (error: any) {
    return reply.status(400).send({ error: error.message });
  }
});

// Route: Get Emergency read-receipt log (Story 4.3)
server.get("/chat/receipts/:messageId", async (request, reply) => {
  try {
    const { messageId } = request.params as any;
    const receipts = ChatService.getReadReceipts(messageId);
    return reply.status(200).send(receipts);
  } catch (error: any) {
    return reply.status(400).send({ error: error.message });
  }
});

// Route: Stripe checkout simulation (Story 5.2)
server.post("/offers/checkout", async (request, reply) => {
  try {
    const { offer, paymentMethodType } = request.body as any;
    if (!offer) {
      return reply.status(400).send({ error: "Missing offer details" });
    }

    const stripeIntent = await PaymentService.createPlacementPaymentIntent(offer, paymentMethodType || "card");
    
    // Simulate instantaneous Stripe webhook response
    const finalizedOffer = PaymentService.simulateWebhookPaymentSuccess(offer, `in_stripe_${crypto.randomBytes(4).toString("hex")}`);

    return reply.status(200).send({ stripeIntent, finalizedOffer });
  } catch (error: any) {
    return reply.status(400).send({ error: error.message });
  }
});

// Route: Sync school calendar via ParentVUE connector (Story 7.1, 7.2)
server.post("/school/sync", async (request, reply) => {
  try {
    const activeParentId = request.headers["x-active-parent-id"] as string;
    if (!activeParentId) {
      return reply.status(401).send({ error: "Missing active parent header context" });
    }

    const { provider, username, password, districtUrl, groupId } = request.body as any;
    if (!provider || !username || !password || !districtUrl || !groupId) {
      return reply.status(400).send({ error: "Missing required school sync parameters" });
    }

    // Encrypt password before storage simulation (Story 7.1)
    const encrypted = EncryptionService.encrypt(password);
    console.log(`[Database Invariant] Encrypted credentials stored securely:`, encrypted.encryptedData);

    // Decrypt credentials to execute sync check (Story 7.2)
    const decryptedPassword = EncryptionService.decrypt(encrypted.encryptedData, encrypted.iv, encrypted.tag);

    const events = await ParentVueService.syncDistrictCalendar(
      districtUrl,
      username,
      decryptedPassword,
      groupId
    );

    return reply.status(210).send({ syncProvider: provider, status: "Success", syncedEventsCount: events.length, events });
  } catch (error: any) {
    return reply.status(400).send({ error: error.message });
  }
});

// Start fastify server
const start = async () => {
  try {
    await server.listen({ port, host: "0.0.0.0" });
    server.log.info(`Omni backend server listening on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
