import { sql } from "drizzle-orm";
import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { bookingStatusEnum, pickupMethodEnum } from "./enums";
import { users } from "./auth";
import { vehicles } from "./vehicles";
import { pickupLocations } from "./partners";

// NOTE: the exclusion constraint that makes double-booking impossible at the database
// level (`excl_booking_overlap`, a partial GiST exclusion constraint over
// (vehicle_id, tstzrange(starts_at, ends_at))) is added in drizzle/0001_booking_overlap_guard.sql
// because drizzle-kit's schema builder cannot express EXCLUDE constraints.
export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  reference: text("reference").notNull().unique(),
  vehicleId: uuid("vehicle_id")
    .notNull()
    .references(() => vehicles.id, { onDelete: "restrict" }),
  customerUserId: uuid("customer_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  pickupLocationId: uuid("pickup_location_id").references(() => pickupLocations.id),
  pickupMethod: pickupMethodEnum("pickup_method").notNull().default("partner_counter"),
  status: bookingStatusEnum("status").notNull().default("draft"),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  holdExpiresAt: timestamp("hold_expires_at", { withTimezone: true }),
  driverFullName: text("driver_full_name"),
  driverPhone: text("driver_phone"),
  driverLicenceNumber: text("driver_licence_number"),
  cancellationReason: text("cancellation_reason"),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  cancelledByUserId: uuid("cancelled_by_user_id").references(() => users.id),
  internalNotes: text("internal_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;

export const bookingStatusEvents = pgTable("booking_status_events", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: uuid("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  fromStatus: bookingStatusEnum("from_status"),
  toStatus: bookingStatusEnum("to_status").notNull(),
  actorUserId: uuid("actor_user_id").references(() => users.id),
  actorRole: text("actor_role").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Immutable snapshot of the agreed commercial terms at booking time. A later edit to
// `vehicles` pricing must never change an existing confirmed booking's payable amount.
export const bookingPriceSnapshots = pgTable("booking_price_snapshots", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: uuid("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  currency: text("currency").notNull().default("INR"),
  rateBasis: text("rate_basis").notNull(),
  rentalDurationHours: integer("rental_duration_hours").notNull(),
  baseRatePaise: integer("base_rate_paise").notNull(),
  subtotalPaise: integer("subtotal_paise").notNull(),
  deliveryChargePaise: integer("delivery_charge_paise").notNull().default(0),
  discountPaise: integer("discount_paise").notNull().default(0),
  taxPaise: integer("tax_paise").notNull().default(0),
  platformCommissionPaise: integer("platform_commission_paise").notNull(),
  depositPaise: integer("deposit_paise").notNull().default(0),
  totalPayablePaise: integer("total_payable_paise").notNull(),
  partnerPayoutPaise: integer("partner_payout_paise").notNull(),
  includedKm: integer("included_km"),
  extraKmRatePaise: integer("extra_km_rate_paise"),
  cancellationPolicy: jsonb("cancellation_policy").$type<{
    freeCancellationHours: number;
    partialRefundPercent: number;
    partialRefundCutoffHours: number;
  }>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type BookingPriceSnapshot = typeof bookingPriceSnapshots.$inferSelect;
export type NewBookingPriceSnapshot = typeof bookingPriceSnapshots.$inferInsert;
