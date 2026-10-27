import { sql } from "drizzle-orm";
import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import {
  disputeStatusEnum,
  supportCategoryEnum,
  supportPriorityEnum,
  supportStatusEnum,
} from "./enums";
import { bookings } from "./bookings";
import { users } from "./auth";

export const supportCases = pgTable("support_cases", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  caseNumber: text("case_number").notNull().unique(),
  bookingId: uuid("booking_id").references(() => bookings.id),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => users.id),
  category: supportCategoryEnum("category").notNull(),
  priority: supportPriorityEnum("priority").notNull().default("normal"),
  status: supportStatusEnum("status").notNull().default("open"),
  subject: text("subject").notNull(),
  assignedToUserId: uuid("assigned_to_user_id").references(() => users.id),
  resolutionNotes: text("resolution_notes"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const supportMessages = pgTable("support_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  supportCaseId: uuid("support_case_id")
    .notNull()
    .references(() => supportCases.id, { onDelete: "cascade" }),
  authorUserId: uuid("author_user_id").references(() => users.id),
  body: text("body").notNull(),
  attachmentFileKeys: jsonb("attachment_file_keys").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  isInternal: boolean("is_internal").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const disputes = pgTable("disputes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: uuid("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "restrict" }),
  raisedByUserId: uuid("raised_by_user_id").references(() => users.id),
  status: disputeStatusEnum("status").notNull().default("open"),
  summary: text("summary").notNull(),
  resolutionNotes: text("resolution_notes"),
  resolvedByUserId: uuid("resolved_by_user_id").references(() => users.id),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Reviews are restricted at the application layer to the booking's customer, and only
// once that booking's status is 'completed' — enforced in src/server/reviews.ts.
export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: uuid("booking_id")
    .notNull()
    .unique()
    .references(() => bookings.id, { onDelete: "cascade" }),
  vehicleId: uuid("vehicle_id").notNull(),
  customerUserId: uuid("customer_user_id")
    .notNull()
    .references(() => users.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
