import { and, eq, lt, gt, inArray } from "drizzle-orm";
import type { DbClient } from "@/db";
import { availabilityBlocks, bookings } from "@/db/schema";

// Statuses that occupy a vehicle's calendar — kept in sync with the partial exclusion
// constraint in drizzle/0001_booking_overlap_guard.sql. If you change one, change both.
export const OCCUPYING_STATUSES = [
  "pending_checkout",
  "awaiting_payment",
  "pending_partner_confirmation",
  "confirmed",
  "pickup_in_progress",
  "active",
  "return_in_progress",
  "cancellation_requested",
] as const;

/**
 * Expired holds are released lazily, scoped to one vehicle, inside the same
 * transaction that is about to create a new hold for that vehicle — so there is no
 * dependency on a cron running on time (acceptance test #27).
 */
export async function releaseExpiredHolds(tx: DbClient, vehicleId: string) {
  await tx
    .update(bookings)
    .set({ status: "expired", updatedAt: new Date() })
    .where(
      and(
        eq(bookings.vehicleId, vehicleId),
        inArray(bookings.status, ["pending_checkout", "awaiting_payment"]),
        lt(bookings.holdExpiresAt, new Date())
      )
    );
}

export async function hasMaintenanceOverlap(tx: DbClient, vehicleId: string, startsAt: Date, endsAt: Date) {
  const rows = await tx
    .select({ id: availabilityBlocks.id })
    .from(availabilityBlocks)
    .where(
      and(
        eq(availabilityBlocks.vehicleId, vehicleId),
        lt(availabilityBlocks.startsAt, endsAt),
        gt(availabilityBlocks.endsAt, startsAt)
      )
    )
    .limit(1);
  return rows.length > 0;
}

/** Best-effort pre-check for the UI (shows an early error before checkout). The real
 * guarantee against double-booking is the database exclusion constraint, checked when
 * the booking row is actually inserted. */
export async function isVehicleAvailable(tx: DbClient, vehicleId: string, startsAt: Date, endsAt: Date) {
  await releaseExpiredHolds(tx, vehicleId);

  const overlapping = await tx
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.vehicleId, vehicleId),
        inArray(bookings.status, [...OCCUPYING_STATUSES]),
        lt(bookings.startsAt, endsAt),
        gt(bookings.endsAt, startsAt)
      )
    )
    .limit(1);

  if (overlapping.length > 0) return { available: false, reason: "Already booked for part of this period." };

  if (await hasMaintenanceOverlap(tx, vehicleId, startsAt, endsAt)) {
    return { available: false, reason: "Unavailable (maintenance) for part of this period." };
  }

  return { available: true as const };
}

function pgErrorCode(err: unknown): string | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  const direct = (err as { code?: unknown }).code;
  if (typeof direct === "string") return direct;
  // drizzle wraps the real pg error in `.cause` on its own DrizzleQueryError.
  return pgErrorCode((err as { cause?: unknown }).cause);
}

export function isPostgresExclusionViolation(err: unknown): boolean {
  return pgErrorCode(err) === "23P01";
}
