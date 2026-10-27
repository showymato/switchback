import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import {
  documentStatusEnum,
  fuelTypeEnum,
  pickupMethodEnum,
  transmissionEnum,
  vehicleCategoryEnum,
  vehicleStatusEnum,
} from "./enums";
import { partners, pickupLocations } from "./partners";
import { users } from "./auth";

export const vehicles = pgTable("vehicles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: uuid("partner_id")
    .notNull()
    .references(() => partners.id, { onDelete: "cascade" }),
  pickupLocationId: uuid("pickup_location_id").references(() => pickupLocations.id, {
    onDelete: "set null",
  }),
  slug: text("slug").notNull().unique(),
  category: vehicleCategoryEnum("category").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year"),
  transmission: transmissionEnum("transmission"),
  fuelType: fuelTypeEnum("fuel_type"),
  seatingCapacity: integer("seating_capacity"),
  engineCc: integer("engine_cc"),
  registrationNumber: text("registration_number").notNull(),
  pickupMethods: pickupMethodEnum("pickup_methods").array().notNull().default(sql`'{partner_counter}'::pickup_method[]`),

  // Pricing — stored in minor units (paise). Authoritative pricing lives in src/server/pricing.ts.
  dailyRatePaise: integer("daily_rate_paise").notNull(),
  hourlyRatePaise: integer("hourly_rate_paise"),
  weekendRatePaise: integer("weekend_rate_paise"),
  securityDepositPaise: integer("security_deposit_paise").notNull().default(0),
  includedKmPerDay: integer("included_km_per_day"),
  extraKmRatePaise: integer("extra_km_rate_paise"),
  deliveryChargePaise: integer("delivery_charge_paise").notNull().default(0),

  minRentalHours: integer("min_rental_hours").notNull().default(24),
  description: text("description"),
  features: jsonb("features").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  eligibilityRequirements: jsonb("eligibility_requirements")
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  cancellationPolicyId: uuid("cancellation_policy_id"),

  status: vehicleStatusEnum("status").notNull().default("draft"),
  rejectionReason: text("rejection_reason"),
  reviewedByUserId: uuid("reviewed_by_user_id").references(() => users.id),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  isListed: boolean("is_listed").notNull().default(false),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;

export const vehicleImages = pgTable("vehicle_images", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  vehicleId: uuid("vehicle_id")
    .notNull()
    .references(() => vehicles.id, { onDelete: "cascade" }),
  fileKey: text("file_key").notNull(),
  altText: text("alt_text"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const vehicleDocuments = pgTable("vehicle_documents", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  vehicleId: uuid("vehicle_id")
    .notNull()
    .references(() => vehicles.id, { onDelete: "cascade" }),
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

// Explicit maintenance / blackout windows. Confirmed bookings occupy the vehicle via
// the exclusion constraint on `bookings` (see migration 0001) rather than a row here.
export const availabilityBlocks = pgTable("availability_blocks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  vehicleId: uuid("vehicle_id")
    .notNull()
    .references(() => vehicles.id, { onDelete: "cascade" }),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  reason: text("reason").notNull().default("maintenance"),
  createdByUserId: uuid("created_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
