import { z } from "zod";

// Base schema for UUIDs
export const UUID = z.string().uuid();

// Parent Profile Schema
export const ParentProfileSchema = z.object({
  id: UUID,
  email: z.string().email(),
  phone: z.string().min(10),
  createdAt: z.coerce.date()
});

export type ParentProfile = z.infer<typeof ParentProfileSchema>;

// Player Profile Schema (COPPA compliant)
export const PlayerProfileSchema = z.object({
  id: UUID,
  parentId: UUID,
  name: z.string().min(1),
  dateOfBirth: z.coerce.date(),
  createdAt: z.coerce.date()
});

export type PlayerProfile = z.infer<typeof PlayerProfileSchema>;

// Organization Schema
export const OrganizationSchema = z.object({
  id: UUID,
  ceoParentId: UUID,
  name: z.string().min(1),
  createdAt: z.coerce.date()
});

export type Organization = z.infer<typeof OrganizationSchema>;

// Activity Group Schema
export const ActivityGroupSchema = z.object({
  id: UUID,
  orgId: UUID.nullable(),
  name: z.string().min(1),
  category: z.enum(["soccer", "dance", "swim", "scouts", "music", "other"]),
  createdAt: z.coerce.date()
});

export type ActivityGroup = z.infer<typeof ActivityGroupSchema>;

// Event Schema (incorporating custom coordinates and attire gear)
export const EventSchema = z.object({
  id: UUID,
  groupId: UUID,
  title: z.string().min(1),
  locationName: z.string().min(1),
  locationLat: z.number().min(-90).max(90),
  locationLng: z.number().min(-180).max(180),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  attireGear: z.string().default("General clothes"),
  createdAt: z.coerce.date()
});

export type Event = z.infer<typeof EventSchema>;

// RSVP Schema (with HIPAA injury privacy status option)
export const RsvpSchema = z.object({
  id: UUID,
  eventId: UUID,
  playerId: UUID,
  status: z.enum(["attending", "declined", "injured"]),
  createdAt: z.coerce.date()
});

export type Rsvp = z.infer<typeof RsvpSchema>;

// Volunteer Shift Schema
export const VolunteerShiftSchema = z.object({
  id: UUID,
  eventId: UUID,
  parentProfileId: UUID.nullable(),
  roleName: z.string().min(1),
  startTime: z.coerce.date(),
  endTime: z.coerce.date()
});

export type VolunteerShift = z.infer<typeof VolunteerShiftSchema>;

// Placement Offer Schema
export const OfferSchema = z.object({
  id: UUID,
  playerProfileId: UUID,
  docUrl: z.string().url(),
  status: z.enum(["sent", "opened", "paid", "declined"]),
  priceCents: z.number().nonnegative(),
  stripeInvoiceId: z.string().nullable(),
  createdAt: z.coerce.date()
});

export type Offer = z.infer<typeof OfferSchema>;

// Chat Message Schema
export const ChatMessageSchema = z.object({
  id: UUID,
  groupId: UUID,
  senderId: UUID,
  senderName: z.string().min(1),
  text: z.string().min(1),
  isEmergency: z.boolean().default(false),
  createdAt: z.coerce.date()
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// School Portal Credential Schema (ParentVUE, PowerSchool)
export const SchoolSyncCredentialSchema = z.object({
  provider: z.enum(["parentvue", "powerschool", "infinitecampus"]),
  username: z.string().min(1),
  password: z.string().min(1),
  districtUrl: z.string().url()
});

export type SchoolSyncCredential = z.infer<typeof SchoolSyncCredentialSchema>;

// Shared validation schemas for API inputs
export const CreateParentProfileInputSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(10)
});

export type CreateParentProfileInput = z.infer<typeof CreateParentProfileInputSchema>;

export const CreatePlayerProfileInputSchema = z.object({
  parentId: UUID,
  name: z.string().min(1),
  dateOfBirth: z.coerce.date()
});

export type CreatePlayerProfileInput = z.infer<typeof CreatePlayerProfileInputSchema>;
