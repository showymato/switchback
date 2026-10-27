import { sql } from "drizzle-orm";
import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import {
  ledgerEntryTypeEnum,
  paymentEventTypeEnum,
  paymentStatusEnum,
  payoutStatusEnum,
  refundStatusEnum,
} from "./enums";
import { bookings } from "./bookings";
import { partners } from "./partners";
import { users } from "./auth";

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: uuid("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "restrict" }),
  provider: text("provider").notNull().default("razorpay"),
  providerOrderId: text("provider_order_id").notNull().unique(),
  providerPaymentId: text("provider_payment_id"),
  status: paymentStatusEnum("status").notNull().default("created"),
  amountPaise: integer("amount_paise").notNull(),
  currency: text("currency").notNull().default("INR"),
  isSandbox: boolean("is_sandbox").notNull().default(true),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Append-only audit trail of every provider webhook / verification call. `providerEventId`
// is unique so a replayed or duplicate webhook delivery cannot be processed twice.
export const paymentEvents = pgTable("payment_events", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  paymentId: uuid("payment_id")
    .notNull()
    .references(() => payments.id, { onDelete: "cascade" }),
  type: paymentEventTypeEnum("type").notNull(),
  providerEventId: text("provider_event_id").unique(),
  payload: jsonb("payload").notNull(),
  signatureVerified: boolean("signature_verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const refunds = pgTable("refunds", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: uuid("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "restrict" }),
  paymentId: uuid("payment_id")
    .notNull()
    .references(() => payments.id, { onDelete: "restrict" }),
  amountPaise: integer("amount_paise").notNull(),
  reason: text("reason").notNull(),
  status: refundStatusEnum("status").notNull().default("requested"),
  providerRefundId: text("provider_refund_id"),
  requestedByUserId: uuid("requested_by_user_id").references(() => users.id),
  approvedByUserId: uuid("approved_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Append-only partner ledger. Running balance is derived by summing entries, never
// stored and overwritten, so financial history cannot be silently rewritten.
export const partnerLedgerEntries = pgTable("partner_ledger_entries", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: uuid("partner_id")
    .notNull()
    .references(() => partners.id, { onDelete: "restrict" }),
  bookingId: uuid("booking_id").references(() => bookings.id),
  type: ledgerEntryTypeEnum("type").notNull(),
  amountPaise: integer("amount_paise").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const partnerPayouts = pgTable("partner_payouts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: uuid("partner_id")
    .notNull()
    .references(() => partners.id, { onDelete: "restrict" }),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  amountPaise: integer("amount_paise").notNull(),
  status: payoutStatusEnum("status").notNull().default("pending"),
  providerPayoutId: text("provider_payout_id"),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
