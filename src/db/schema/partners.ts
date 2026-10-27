import { sql } from "drizzle-orm";
import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { documentOwnerTypeEnum, documentStatusEnum, partnerStatusEnum } from "./enums";
import { users } from "./auth";

export const partners = pgTable("partners", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerUserId: uuid("owner_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  businessName: text("business_name").notNull(),
  legalEntityName: text("legal_entity_name"),
  contactPhone: text("contact_phone").notNull(),
  contactEmail: text("contact_email").notNull(),
  addressLine1: text("address_line1").notNull(),
  addressLine2: text("address_line2"),
  city: text("city").notNull().default("Manali"),
  state: text("state").notNull().default("Himachal Pradesh"),
  postalCode: text("postal_code"),
  gstin: text("gstin"),
  panNumber: text("pan_number"),
  rentalSchemeLicenceNumber: text("rental_scheme_licence_number"),
  settlementAccountRef: text("settlement_account_ref"),
  commissionBps: integer("commission_bps").notNull().default(1500),
  status: partnerStatusEnum("status").notNull().default("draft"),
  rejectionReason: text("rejection_reason"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  approvedByUserId: uuid("approved_by_user_id").references(() => users.id),
  suspendedAt: timestamp("suspended_at", { withTimezone: true }),
  suspensionReason: text("suspension_reason"),
  policyAgreedAt: timestamp("policy_agreed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Partner = typeof partners.$inferSelect;
export type NewPartner = typeof partners.$inferInsert;

export const partnerMembers = pgTable("partner_members", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: uuid("partner_id")
    .notNull()
    .references(() => partners.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const partnerDocuments = pgTable("partner_documents", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerType: documentOwnerTypeEnum("owner_type").notNull().default("partner"),
  partnerId: uuid("partner_id")
    .notNull()
    .references(() => partners.id, { onDelete: "cascade" }),
  vehicleId: uuid("vehicle_id"),
  documentType: text("document_type").notNull(),
  fileKey: text("file_key").notNull(),
  fileName: text("file_name").notNull(),
  status: documentStatusEnum("status").notNull().default("pending"),
  reviewedByUserId: uuid("reviewed_by_user_id").references(() => users.id),
  reviewNotes: text("review_notes"),
  expiresOn: timestamp("expires_on", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pickupLocations = pgTable("pickup_locations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: uuid("partner_id")
    .notNull()
    .references(() => partners.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  addressLine: text("address_line").notNull(),
  area: text("area").notNull(),
  latitude: text("latitude"),
  longitude: text("longitude"),
  openingTime: text("opening_time").notNull().default("08:00"),
  closingTime: text("closing_time").notNull().default("20:00"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
