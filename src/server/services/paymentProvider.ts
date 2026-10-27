import crypto from "crypto";

export interface CreatedOrder {
  orderId: string;
  amountPaise: number;
  currency: string;
  isSandbox: boolean;
}

export interface PaymentProvider {
  readonly isSandbox: boolean;
  createOrder(input: { amountPaise: number; receipt: string }): Promise<CreatedOrder>;
  verifyCheckoutSignature(input: { orderId: string; paymentId: string; signature: string }): boolean;
  verifyWebhookSignature(input: { rawBody: string; signature: string }): boolean;
}

function hmacHex(secret: string, payload: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Talks to the real Razorpay API. Only constructed when RAZORPAY_KEY_ID /
 * RAZORPAY_KEY_SECRET are present — see getPaymentProvider() below. Razorpay's standard
 * marketplace/route split-settlement product requires its own onboarding and KYC that
 * this project has not gone through; this adapter creates plain orders against the
 * platform's own account. Partner payout remains an internal ledger entry + manual/
 * future payout run, not an automatic Razorpay Route transfer. See
 * docs/compliance-register.md.
 */
class RazorpayProvider implements PaymentProvider {
  readonly isSandbox = false;
  private keyId: string;
  private keySecret: string;
  private webhookSecret: string;

  constructor(keyId: string, keySecret: string, webhookSecret: string) {
    this.keyId = keyId;
    this.keySecret = keySecret;
    this.webhookSecret = webhookSecret;
  }

  async createOrder(input: { amountPaise: number; receipt: string }): Promise<CreatedOrder> {
    // Lazy import: keeps the Razorpay SDK out of the bundle when running in sandbox mode.
    const Razorpay = (await import("razorpay")).default;
    const client = new Razorpay({ key_id: this.keyId, key_secret: this.keySecret });
    const order = await client.orders.create({
      amount: input.amountPaise,
      currency: "INR",
      receipt: input.receipt,
    });
    return { orderId: order.id, amountPaise: input.amountPaise, currency: "INR", isSandbox: false };
  }

  verifyCheckoutSignature(input: { orderId: string; paymentId: string; signature: string }): boolean {
    const expected = hmacHex(this.keySecret, `${input.orderId}|${input.paymentId}`);
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(input.signature));
  }

  verifyWebhookSignature(input: { rawBody: string; signature: string }): boolean {
    const expected = hmacHex(this.webhookSecret, input.rawBody);
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(input.signature));
  }
}

/**
 * No real money moves through this path. It exists so the full booking → checkout →
 * "payment" → confirmation journey can be built and tested end to end before a live
 * Razorpay account exists. Nothing here simulates a *real* captured payment — the
 * sandbox order id and signature are internally generated and only ever checked
 * against themselves. See README "Payments" for what's needed to go live.
 */
class SandboxProvider implements PaymentProvider {
  readonly isSandbox = true;
  private secret = process.env.AUTH_SECRET ?? "sandbox-only-secret";

  async createOrder(input: { amountPaise: number; receipt: string }): Promise<CreatedOrder> {
    const orderId = `sandbox_order_${input.receipt}_${Date.now()}`;
    return { orderId, amountPaise: input.amountPaise, currency: "INR", isSandbox: true };
  }

  verifyCheckoutSignature(input: { orderId: string; paymentId: string; signature: string }): boolean {
    const expected = hmacHex(this.secret, `${input.orderId}|${input.paymentId}`);
    return expected === input.signature;
  }

  verifyWebhookSignature(input: { rawBody: string; signature: string }): boolean {
    const expected = hmacHex(this.secret, input.rawBody);
    return expected === input.signature;
  }

  signCheckout(orderId: string, paymentId: string) {
    return hmacHex(this.secret, `${orderId}|${paymentId}`);
  }
}

let cached: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (cached) return cached;
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (keyId && keySecret && webhookSecret) {
    cached = new RazorpayProvider(keyId, keySecret, webhookSecret);
  } else {
    cached = new SandboxProvider();
  }
  return cached;
}

export function getSandboxProvider(): SandboxProvider | null {
  const provider = getPaymentProvider();
  return provider instanceof SandboxProvider ? provider : null;
}
