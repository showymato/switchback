import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { db } from "@/db";
import { bookings, payments } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getSandboxProvider } from "@/server/services/paymentProvider";
import { confirmPaymentCaptured, markPaymentFailed, PaymentError } from "@/server/services/payments";

// Sandbox-only simulated checkout callback. Returns 404 the instant real Razorpay
// credentials are configured, so this path can never be reachable in a production
// payment flow — see getPaymentProvider() in paymentProvider.ts.
export async function POST(request: Request) {
  const sandbox = getSandboxProvider();
  if (!sandbox) return NextResponse.json({ error: "Not available — live payment provider is configured" }, { status: 404 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = (await request.json()) as { bookingId: string; outcome: "success" | "failure" };

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, body.bookingId))
    .limit(1);
  if (!booking || booking.customerUserId !== user.id) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const [payment] = await db.select().from(payments).where(eq(payments.bookingId, booking.id)).limit(1);
  if (!payment) return NextResponse.json({ error: "No payment order for this booking" }, { status: 404 });

  const eventId = `sandbox_${payment.providerOrderId}_${body.outcome}_${crypto.randomBytes(4).toString("hex")}`;

  try {
    if (body.outcome === "failure") {
      await markPaymentFailed({
        providerOrderId: payment.providerOrderId,
        providerEventId: eventId,
        reason: "Simulated sandbox payment failure",
      });
      return NextResponse.json({ ok: true, status: "failed" });
    }

    const simulatedPaymentId = `sandbox_pay_${crypto.randomBytes(6).toString("hex")}`;
    await confirmPaymentCaptured({
      providerOrderId: payment.providerOrderId,
      providerPaymentId: simulatedPaymentId,
      providerEventId: eventId,
      rawVerifiedPayload: { sandbox: true, orderId: payment.providerOrderId },
    });
    return NextResponse.json({ ok: true, status: "captured" });
  } catch (err) {
    if (err instanceof PaymentError) return NextResponse.json({ error: err.message }, { status: 409 });
    throw err;
  }
}
