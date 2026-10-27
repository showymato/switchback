import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bookingPriceSnapshots, bookings, partnerLedgerEntries, payments, refunds, vehicles } from "@/db/schema";
import type { UserRole } from "@/db/schema";
import { transitionBooking } from "./bookingStateMachine";

export class CancellationError extends Error {}

const CANCELLABLE_STATUSES = [
  "pending_checkout",
  "awaiting_payment",
  "payment_failed",
  "pending_partner_confirmation",
  "confirmed",
];

/**
 * Cancellation policy (pre-pickup only — see docs/compliance-register.md, this is a
 * draft platform policy pending legal review): the security deposit is always fully
 * refundable since the vehicle was never used; the rental fee follows the
 * cancellationPolicy snapshotted on the booking at checkout time, keyed off hours
 * remaining until pickup.
 */
export async function requestCancellation(input: {
  bookingId: string;
  actorUserId: string;
  actorRole: UserRole;
  reason: string;
}) {
  return db.transaction(async (tx) => {
    const [booking] = await tx.select().from(bookings).where(eq(bookings.id, input.bookingId)).limit(1);
    if (!booking) throw new CancellationError("Booking not found.");

    if (input.actorRole === "customer" && booking.customerUserId !== input.actorUserId) {
      throw new CancellationError("You can only cancel your own bookings.");
    }
    if (!CANCELLABLE_STATUSES.includes(booking.status)) {
      throw new CancellationError(`A booking that is "${booking.status}" can no longer be cancelled this way.`);
    }

    const [snapshot] = await tx
      .select()
      .from(bookingPriceSnapshots)
      .where(eq(bookingPriceSnapshots.bookingId, booking.id))
      .limit(1);

    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.bookingId, booking.id))
      .limit(1);

    const hasCapturedPayment = payment?.status === "captured";

    await transitionBooking(tx, {
      bookingId: booking.id,
      to: "cancellation_requested",
      actorUserId: input.actorUserId,
      actorRole: input.actorRole,
      reason: input.reason,
    });

    if (!hasCapturedPayment || !snapshot) {
      await tx
        .update(bookings)
        .set({ cancellationReason: input.reason, cancelledAt: new Date(), cancelledByUserId: input.actorUserId })
        .where(eq(bookings.id, booking.id));
      await transitionBooking(tx, {
        bookingId: booking.id,
        to: "cancelled",
        actorUserId: input.actorUserId,
        actorRole: input.actorRole,
        reason: "No captured payment to refund",
      });
      return { refundAmountPaise: 0 };
    }

    const hoursUntilPickup = (booking.startsAt.getTime() - Date.now()) / (60 * 60 * 1000);
    const policy = snapshot.cancellationPolicy;

    let refundPercent: number;
    if (hoursUntilPickup >= policy.freeCancellationHours) refundPercent = 100;
    else if (hoursUntilPickup >= policy.partialRefundCutoffHours) refundPercent = policy.partialRefundPercent;
    else refundPercent = 0;

    const refundableRentalPaise = snapshot.subtotalPaise + snapshot.deliveryChargePaise - snapshot.discountPaise + snapshot.taxPaise;
    const rentalRefundPaise = Math.round((refundableRentalPaise * refundPercent) / 100);
    const depositRefundPaise = snapshot.depositPaise;
    const refundAmountPaise = Math.min(rentalRefundPaise + depositRefundPaise, payment.amountPaise);

    await tx
      .update(bookings)
      .set({ cancellationReason: input.reason, cancelledAt: new Date(), cancelledByUserId: input.actorUserId })
      .where(eq(bookings.id, booking.id));

    if (refundAmountPaise > 0) {
      await tx.insert(refunds).values({
        bookingId: booking.id,
        paymentId: payment.id,
        amountPaise: refundAmountPaise,
        reason: `Cancellation (${refundPercent}% rental refund + full deposit): ${input.reason}`,
        status: "requested",
        requestedByUserId: input.actorUserId,
      });

      const [vehicle] = await tx.select().from(vehicles).where(eq(vehicles.id, booking.vehicleId)).limit(1);
      if (vehicle) {
        await tx.insert(partnerLedgerEntries).values({
          partnerId: vehicle.partnerId,
          bookingId: booking.id,
          type: "refund_debit",
          amountPaise: -Math.min(rentalRefundPaise, snapshot.partnerPayoutPaise),
          description: `Booking ${booking.reference} cancellation — rental portion refunded to customer`,
        });
      }

      await transitionBooking(tx, {
        bookingId: booking.id,
        to: "refund_pending",
        actorUserId: input.actorUserId,
        actorRole: input.actorRole,
        reason: "Refund owed on cancellation",
      });
    } else {
      await transitionBooking(tx, {
        bookingId: booking.id,
        to: "cancelled",
        actorUserId: input.actorUserId,
        actorRole: input.actorRole,
        reason: "Outside refund window — no refund owed",
      });
    }

    return { refundAmountPaise };
  });
}
