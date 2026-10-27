import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  bookingPriceSnapshots,
  bookings,
  partnerLedgerEntries,
  paymentEvents,
  payments,
  vehicles,
} from "@/db/schema";
import { transitionBooking } from "./bookingStateMachine";
import { getPaymentProvider } from "./paymentProvider";

export class PaymentError extends Error {}

export async function createOrderForBooking(bookingId: string, customerUserId: string) {
  const provider = getPaymentProvider();

  return db.transaction(async (tx) => {
    const [booking] = await tx
      .select()
      .from(bookings)
      .where(and(eq(bookings.id, bookingId), eq(bookings.customerUserId, customerUserId)))
      .limit(1);
    if (!booking) throw new PaymentError("Booking not found.");
    if (booking.status !== "pending_checkout") {
      throw new PaymentError(`Booking is "${booking.status}" and cannot start checkout.`);
    }
    if (!booking.holdExpiresAt || booking.holdExpiresAt.getTime() < Date.now()) {
      throw new PaymentError("Your hold on this vehicle has expired. Please search again.");
    }

    const [snapshot] = await tx
      .select()
      .from(bookingPriceSnapshots)
      .where(eq(bookingPriceSnapshots.bookingId, bookingId))
      .orderBy(bookingPriceSnapshots.createdAt)
      .limit(1);
    if (!snapshot) throw new PaymentError("Price snapshot missing for this booking.");

    const order = await provider.createOrder({ amountPaise: snapshot.totalPayablePaise, receipt: booking.reference });

    const [payment] = await tx
      .insert(payments)
      .values({
        bookingId,
        provider: "razorpay",
        providerOrderId: order.orderId,
        status: "created",
        amountPaise: order.amountPaise,
        isSandbox: order.isSandbox,
      })
      .returning();

    await tx.insert(paymentEvents).values({
      paymentId: payment.id,
      type: "order_created",
      payload: { orderId: order.orderId, amountPaise: order.amountPaise, isSandbox: order.isSandbox },
      signatureVerified: true,
    });

    await transitionBooking(tx, {
      bookingId,
      to: "awaiting_payment",
      actorUserId: customerUserId,
      actorRole: "customer",
      reason: "Payment order created",
    });

    return {
      orderId: order.orderId,
      amountPaise: order.amountPaise,
      currency: order.currency,
      isSandbox: order.isSandbox,
      keyId: process.env.RAZORPAY_KEY_ID ?? null,
    };
  });
}

/**
 * Idempotent on providerEventId: a replayed or duplicated webhook delivery (or a
 * second click of the sandbox "pay now" button) hits the unique constraint on
 * payment_events.provider_event_id and this function treats that as already-processed
 * rather than crediting the booking twice (acceptance test #6).
 */
export async function confirmPaymentCaptured(input: {
  providerOrderId: string;
  providerPaymentId: string;
  providerEventId: string;
  rawVerifiedPayload: unknown;
}) {
  return db.transaction(async (tx) => {
    const [payment] = await tx.select().from(payments).where(eq(payments.providerOrderId, input.providerOrderId)).limit(1);
    if (!payment) throw new PaymentError("Payment not found for this order.");

    const existingEvent = await tx
      .select({ id: paymentEvents.id })
      .from(paymentEvents)
      .where(eq(paymentEvents.providerEventId, input.providerEventId))
      .limit(1);
    if (existingEvent.length > 0) {
      return { alreadyProcessed: true as const };
    }

    if (payment.status === "captured") {
      await tx.insert(paymentEvents).values({
        paymentId: payment.id,
        type: "payment_captured",
        providerEventId: input.providerEventId,
        payload: input.rawVerifiedPayload as object,
        signatureVerified: true,
      });
      return { alreadyProcessed: true as const };
    }

    await tx
      .update(payments)
      .set({ status: "captured", providerPaymentId: input.providerPaymentId, updatedAt: new Date() })
      .where(eq(payments.id, payment.id));

    await tx.insert(paymentEvents).values({
      paymentId: payment.id,
      type: "payment_captured",
      providerEventId: input.providerEventId,
      payload: input.rawVerifiedPayload as object,
      signatureVerified: true,
    });

    const [booking] = await tx.select().from(bookings).where(eq(bookings.id, payment.bookingId)).limit(1);
    if (!booking) throw new PaymentError("Booking not found for this payment.");

    if (booking.status === "awaiting_payment") {
      await transitionBooking(tx, {
        bookingId: booking.id,
        to: "confirmed",
        actorRole: "system",
        reason: "Payment captured",
      });

      const [snapshot] = await tx
        .select()
        .from(bookingPriceSnapshots)
        .where(eq(bookingPriceSnapshots.bookingId, booking.id))
        .limit(1);

      if (snapshot) {
        const [vehicle] = await tx.select().from(vehicles).where(eq(vehicles.id, booking.vehicleId)).limit(1);
        if (!vehicle) throw new PaymentError("Vehicle not found for this booking.");

        const grossPaise = snapshot.subtotalPaise + snapshot.deliveryChargePaise - snapshot.discountPaise;
        await tx.insert(partnerLedgerEntries).values([
          {
            partnerId: vehicle.partnerId,
            bookingId: booking.id,
            type: "booking_credit",
            amountPaise: grossPaise,
            description: `Booking ${booking.reference} — gross rental revenue`,
          },
          {
            partnerId: vehicle.partnerId,
            bookingId: booking.id,
            type: "commission_debit",
            amountPaise: -snapshot.platformCommissionPaise,
            description: `Booking ${booking.reference} — platform commission`,
          },
        ]);
      }
    }

    return { alreadyProcessed: false as const };
  });
}

export async function markPaymentFailed(input: {
  providerOrderId: string;
  providerEventId: string;
  reason: string;
}) {
  return db.transaction(async (tx) => {
    const [payment] = await tx.select().from(payments).where(eq(payments.providerOrderId, input.providerOrderId)).limit(1);
    if (!payment) throw new PaymentError("Payment not found for this order.");

    const existingEvent = await tx
      .select({ id: paymentEvents.id })
      .from(paymentEvents)
      .where(eq(paymentEvents.providerEventId, input.providerEventId))
      .limit(1);
    if (existingEvent.length > 0) return { alreadyProcessed: true as const };

    await tx
      .update(payments)
      .set({ status: "failed", failureReason: input.reason, updatedAt: new Date() })
      .where(eq(payments.id, payment.id));

    await tx.insert(paymentEvents).values({
      paymentId: payment.id,
      type: "payment_failed",
      providerEventId: input.providerEventId,
      payload: { reason: input.reason },
      signatureVerified: true,
    });

    const [booking] = await tx.select().from(bookings).where(eq(bookings.id, payment.bookingId)).limit(1);
    if (booking && booking.status === "awaiting_payment") {
      await transitionBooking(tx, {
        bookingId: booking.id,
        to: "payment_failed",
        actorRole: "system",
        reason: input.reason,
      });
    }

    return { alreadyProcessed: false as const };
  });
}
