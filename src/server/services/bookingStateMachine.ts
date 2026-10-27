import { eq } from "drizzle-orm";
import type { BookingStatus, UserRole } from "@/db/schema";
import { bookingStatusEvents, bookings } from "@/db/schema";
import type { DbClient } from "@/db";

/**
 * The only paths a booking is allowed to move through. Every mutation in the app goes
 * through transitionBooking() below rather than writing bookings.status directly, so
 * this map is the single source of truth for "what can happen next" (spec §4, "Booking
 * states"). Admins and super_admins may force any transition, but it is still recorded
 * — see transitionBooking.
 */
export const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  draft: ["pending_checkout", "expired"],
  pending_checkout: ["awaiting_payment", "expired", "cancelled"],
  awaiting_payment: ["confirmed", "payment_failed", "expired"],
  payment_failed: ["awaiting_payment", "expired", "cancelled"],
  pending_partner_confirmation: ["confirmed", "cancelled"],
  confirmed: ["cancellation_requested", "pickup_in_progress", "disputed", "cancelled"],
  cancellation_requested: ["cancelled", "refund_pending", "confirmed"],
  cancelled: ["refund_pending", "refunded"],
  pickup_in_progress: ["active", "cancelled"],
  active: ["return_in_progress", "disputed"],
  return_in_progress: ["completed", "disputed"],
  completed: ["disputed"],
  refund_pending: ["partially_refunded", "refunded"],
  partially_refunded: [],
  refunded: [],
  disputed: ["completed", "refund_pending", "cancelled", "confirmed"],
  expired: [],
};

export class InvalidTransitionError extends Error {}

export async function transitionBooking(
  tx: DbClient,
  params: {
    bookingId: string;
    to: BookingStatus;
    actorUserId?: string;
    actorRole: UserRole | "system";
    reason?: string;
  }
) {
  const [current] = await tx.select({ status: bookings.status }).from(bookings).where(eq(bookings.id, params.bookingId)).limit(1);
  if (!current) throw new InvalidTransitionError("Booking not found.");

  const isAdminOverride = params.actorRole === "admin" || params.actorRole === "super_admin";
  const allowed = ALLOWED_TRANSITIONS[current.status]?.includes(params.to);

  if (!allowed && !isAdminOverride) {
    throw new InvalidTransitionError(`Cannot move booking from "${current.status}" to "${params.to}".`);
  }
  if (!allowed && isAdminOverride && !params.reason) {
    throw new InvalidTransitionError("An admin override of the normal booking state machine requires a reason.");
  }

  await tx.update(bookings).set({ status: params.to, updatedAt: new Date() }).where(eq(bookings.id, params.bookingId));

  await tx.insert(bookingStatusEvents).values({
    bookingId: params.bookingId,
    fromStatus: current.status,
    toStatus: params.to,
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    reason: params.reason ?? (allowed ? undefined : "admin override"),
  });
}
