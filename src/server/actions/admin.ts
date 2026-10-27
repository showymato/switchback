"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { adminAuditLogs, disputes, partners, payments, refunds, vehicles } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { transitionBooking } from "@/server/services/bookingStateMachine";
import { getPaymentProvider } from "@/server/services/paymentProvider";
import type { ActionResult } from "./auth";

async function audit(actorUserId: string, action: string, targetType: string, targetId: string, metadata: Record<string, unknown> = {}) {
  await db.insert(adminAuditLogs).values({ actorUserId, action, targetType, targetId, metadata });
}

export async function approvePartnerAction(partnerId: string): Promise<ActionResult> {
  const admin = await requireRole("admin", "super_admin");
  await db
    .update(partners)
    .set({ status: "approved", approvedAt: new Date(), approvedByUserId: admin.id, rejectionReason: null })
    .where(eq(partners.id, partnerId));
  await audit(admin.id, "partner.approve", "partner", partnerId);
  revalidatePath(`/admin/partners/${partnerId}`);
  revalidatePath("/admin/partners");
  return { ok: true, data: undefined };
}

const reasonSchema = z.object({ reason: z.string().trim().min(3, "Give a reason") });

export async function rejectPartnerAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const admin = await requireRole("admin", "super_admin");
  const partnerId = String(formData.get("partnerId"));
  const parsed = reasonSchema.safeParse({ reason: formData.get("reason") });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  await db.update(partners).set({ status: "rejected", rejectionReason: parsed.data.reason }).where(eq(partners.id, partnerId));
  await audit(admin.id, "partner.reject", "partner", partnerId, { reason: parsed.data.reason });
  revalidatePath(`/admin/partners/${partnerId}`);
  revalidatePath("/admin/partners");
  return { ok: true, data: undefined };
}

export async function suspendPartnerAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const admin = await requireRole("admin", "super_admin");
  const partnerId = String(formData.get("partnerId"));
  const parsed = reasonSchema.safeParse({ reason: formData.get("reason") });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  await db
    .update(partners)
    .set({ status: "suspended", suspendedAt: new Date(), suspensionReason: parsed.data.reason })
    .where(eq(partners.id, partnerId));
  await audit(admin.id, "partner.suspend", "partner", partnerId, { reason: parsed.data.reason });
  revalidatePath(`/admin/partners/${partnerId}`);
  revalidatePath("/admin/partners");
  return { ok: true, data: undefined };
}

export async function approveVehicleAction(vehicleId: string): Promise<ActionResult> {
  const admin = await requireRole("admin", "super_admin");

  const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, vehicleId)).limit(1);
  if (!vehicle) return { ok: false, error: "Vehicle not found." };
  const [partner] = await db.select().from(partners).where(eq(partners.id, vehicle.partnerId)).limit(1);
  if (!partner || partner.status !== "approved") {
    return { ok: false, error: "The partner must be approved before a vehicle can be approved." };
  }

  await db
    .update(vehicles)
    .set({ status: "published", isListed: true, publishedAt: new Date(), reviewedByUserId: admin.id, rejectionReason: null })
    .where(eq(vehicles.id, vehicleId));
  await audit(admin.id, "vehicle.approve", "vehicle", vehicleId);
  revalidatePath(`/admin/vehicles/${vehicleId}`);
  revalidatePath("/admin/vehicles");
  return { ok: true, data: undefined };
}

export async function rejectVehicleAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const admin = await requireRole("admin", "super_admin");
  const vehicleId = String(formData.get("vehicleId"));
  const parsed = reasonSchema.safeParse({ reason: formData.get("reason") });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  await db
    .update(vehicles)
    .set({ status: "rejected", isListed: false, rejectionReason: parsed.data.reason, reviewedByUserId: admin.id })
    .where(eq(vehicles.id, vehicleId));
  await audit(admin.id, "vehicle.reject", "vehicle", vehicleId, { reason: parsed.data.reason });
  revalidatePath(`/admin/vehicles/${vehicleId}`);
  revalidatePath("/admin/vehicles");
  return { ok: true, data: undefined };
}

export async function suspendVehicleAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const admin = await requireRole("admin", "super_admin");
  const vehicleId = String(formData.get("vehicleId"));
  const parsed = reasonSchema.safeParse({ reason: formData.get("reason") });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  await db.update(vehicles).set({ status: "suspended", isListed: false, rejectionReason: parsed.data.reason }).where(eq(vehicles.id, vehicleId));
  await audit(admin.id, "vehicle.suspend", "vehicle", vehicleId, { reason: parsed.data.reason });
  revalidatePath(`/admin/vehicles/${vehicleId}`);
  revalidatePath("/admin/vehicles");
  return { ok: true, data: undefined };
}

const resolveDisputeSchema = z.object({
  resolutionNotes: z.string().trim().min(5, "Add a resolution note"),
  outcome: z.enum(["completed", "refund_pending", "cancelled"]),
  refundAmountRupees: z.coerce.number().min(0).optional(),
});

export async function resolveDisputeAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const admin = await requireRole("admin", "super_admin");
  const disputeId = String(formData.get("disputeId"));
  const parsed = resolveDisputeSchema.safeParse({
    resolutionNotes: formData.get("resolutionNotes"),
    outcome: formData.get("outcome"),
    refundAmountRupees: formData.get("refundAmountRupees") || undefined,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  if (parsed.data.outcome === "refund_pending" && !parsed.data.refundAmountRupees) {
    return { ok: false, error: "Enter a refund amount for a refund_pending outcome." };
  }

  await db.transaction(async (tx) => {
    const [dispute] = await tx.select().from(disputes).where(eq(disputes.id, disputeId)).limit(1);
    if (!dispute) throw new Error("Dispute not found.");

    await tx
      .update(disputes)
      .set({ status: "resolved", resolutionNotes: parsed.data.resolutionNotes, resolvedByUserId: admin.id, resolvedAt: new Date() })
      .where(eq(disputes.id, disputeId));

    if (parsed.data.outcome === "refund_pending" && parsed.data.refundAmountRupees) {
      const [payment] = await tx.select().from(payments).where(eq(payments.bookingId, dispute.bookingId)).limit(1);
      if (!payment) throw new Error("No payment found for this booking to refund against.");
      await tx.insert(refunds).values({
        bookingId: dispute.bookingId,
        paymentId: payment.id,
        amountPaise: Math.round(parsed.data.refundAmountRupees * 100),
        reason: `Dispute resolution: ${parsed.data.resolutionNotes}`,
        status: "requested",
        requestedByUserId: admin.id,
        approvedByUserId: admin.id,
      });
    }

    await transitionBooking(tx, {
      bookingId: dispute.bookingId,
      to: parsed.data.outcome,
      actorUserId: admin.id,
      actorRole: "admin",
      reason: `Dispute resolved: ${parsed.data.resolutionNotes}`,
    });
  });

  await audit(admin.id, "dispute.resolve", "dispute", disputeId, { outcome: parsed.data.outcome });
  revalidatePath("/admin/disputes");
  revalidatePath("/admin/refunds");
  return { ok: true, data: undefined };
}

/**
 * Processes an approved refund request. In sandbox mode this marks it completed
 * directly (clearly logged as sandbox); with live Razorpay credentials it calls the
 * real refund API and records the provider's refund id. Reverses the earlier
 * refund_debit ledger entry's... no — the debit was already posted when the
 * cancellation was requested (src/server/services/cancellation.ts); this step only
 * updates the refund's own status once money has actually moved.
 */
export async function processRefundAction(refundId: string): Promise<ActionResult> {
  const admin = await requireRole("admin", "super_admin");

  return db.transaction(async (tx) => {
    const [refund] = await tx.select().from(refunds).where(eq(refunds.id, refundId)).limit(1);
    if (!refund) return { ok: false, error: "Refund not found." };
    if (refund.status === "completed") return { ok: true, data: undefined };

    const [payment] = await tx.select().from(payments).where(eq(payments.id, refund.paymentId)).limit(1);
    if (!payment) return { ok: false, error: "Payment not found for this refund." };

    const provider = getPaymentProvider();
    let providerRefundId = `sandbox_refund_${refundId}`;
    if (!provider.isSandbox) {
      // Lazy import so the Razorpay SDK is never bundled when running in sandbox mode.
      const Razorpay = (await import("razorpay")).default;
      const client = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID!, key_secret: process.env.RAZORPAY_KEY_SECRET! });
      const result = await client.payments.refund(payment.providerPaymentId!, { amount: refund.amountPaise });
      providerRefundId = result.id;
    }

    await tx
      .update(refunds)
      .set({ status: "completed", providerRefundId, approvedByUserId: admin.id, updatedAt: new Date() })
      .where(eq(refunds.id, refundId));

    const remainingPaise = payment.amountPaise - refund.amountPaise;
    await tx
      .update(payments)
      .set({ status: remainingPaise > 0 ? "partially_refunded" : "refunded" })
      .where(eq(payments.id, payment.id));

    await transitionBooking(tx, {
      bookingId: refund.bookingId,
      to: remainingPaise > 0 ? "partially_refunded" : "refunded",
      actorUserId: admin.id,
      actorRole: "admin",
      reason: "Refund processed",
    });

    await audit(admin.id, "refund.process", "refund", refundId, { amountPaise: refund.amountPaise, providerRefundId });
    revalidatePath("/admin/refunds");
    return { ok: true, data: undefined };
  });
}
