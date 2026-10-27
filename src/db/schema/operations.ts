import { sql } from "drizzle-orm";
import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { chargeReviewStatusEnum, inspectionTypeEnum } from "./enums";
import { bookings } from "./bookings";
import { users } from "./auth";

export const inspections = pgTable("inspections", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: uuid("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  type: inspectionTypeEnum("type").notNull(),
  performedByUserId: uuid("performed_by_user_id").references(() => users.id),
  odometerReading: integer("odometer_reading"),
  fuelOrChargeLevelPercent: integer("fuel_or_charge_level_percent"),
  conditionNotes: text("condition_notes"),
  photoFileKeys: jsonb("photo_file_keys").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  accessoriesChecklist: jsonb("accessories_checklist")
    .$type<Record<string, boolean>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  customerAcknowledgedAt: timestamp("customer_acknowledged_at", { withTimezone: true }),
  performedAt: timestamp("performed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const additionalCharges = pgTable("additional_charges", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: uuid("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  raisedByUserId: uuid("raised_by_user_id").references(() => users.id),
  reason: text("reason").notNull(),
  amountPaise: integer("amount_paise").notNull(),
  evidenceFileKeys: jsonb("evidence_file_keys").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  reviewStatus: chargeReviewStatusEnum("review_status").notNull().default("alleged"),
  resolutionNotes: text("resolution_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
