import { NextResponse } from "next/server";
import crypto from "crypto";
import { getPaymentProvider } from "@/server/services/paymentProvider";
import { confirmPaymentCaptured, markPaymentFailed, PaymentError } from "@/server/services/payments";

// Real Razorpay webhook endpoint. Returns 200 even on application-level errors (after
// logging) so Razorpay does not endlessly retry a payload we understand but can't
// apply — but a bad or missing signature is always rejected outright.
export async function POST(request: Request) {
  const provider = getPaymentProvider();
  if (provider.isSandbox) {
    return NextResponse.json({ error: "Sandbox mode — use /api/payments/sandbox-confirm" }, { status: 404 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");
  if (!signature || !provider.verifyWebhookSignature({ rawBody, signature })) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const payload = JSON.parse(rawBody) as {
    event: string;
    payload: { payment?: { entity: { id: string; order_id: string } } };
  };
  const eventId =
    request.headers.get("x-razorpay-event-id") ?? crypto.createHash("sha256").update(rawBody).digest("hex");

  try {
    if (payload.event === "payment.captured" && payload.payload.payment) {
      await confirmPaymentCaptured({
        providerOrderId: payload.payload.payment.entity.order_id,
        providerPaymentId: payload.payload.payment.entity.id,
        providerEventId: eventId,
        rawVerifiedPayload: payload,
      });
    } else if (payload.event === "payment.failed" && payload.payload.payment) {
      await markPaymentFailed({
        providerOrderId: payload.payload.payment.entity.order_id,
        providerEventId: eventId,
        reason: "Razorpay reported payment.failed",
      });
    }
  } catch (err) {
    if (err instanceof PaymentError) {
      console.error("Webhook application error (acknowledged, not retried):", err.message);
      return NextResponse.json({ received: true });
    }
    throw err;
  }

  return NextResponse.json({ received: true });
}
