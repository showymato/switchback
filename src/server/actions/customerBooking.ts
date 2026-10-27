"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { bookings, disputes, reviews } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { requestCancellation, CancellationError } from "@/server/services/cancellation";
import { transitionBooking } from "@/server/services/bookingStateMachine";
import type { ActionResult } from "./auth";

export async function cancelBookingAction(bookingId: string, reason: string): Promise<ActionResult<{ refundAmountPaise: number }>> {
  const user = await requireUser();
  try {
    const result = await requestCancellation({
      bookingId,
      actorUserId: user.id,
      actorRole: user.role,
      reason: reason || "Cancelled by customer",
    });
    revalidatePath(`/account/bookings/${bookingId}`);
    revalidatePath("/account/bookings");
    return { ok: true, data: result };
  } catch (err) {
    if (err instanceof CancellationError) return { ok: false, error: err.message };
    throw err;
  }
}

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional(),
});

export async function submitReviewAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const bookingId = String(formData.get("bookingId"));

  const parsed = reviewSchema.safeParse({
    rating: formData.get("rating"),
    comment: formData.get("comment"),
  });
  if (!parsed.success) return { ok: false, error: "Please choose a rating from 1 to 5." };

  const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  if (!booking || booking.customerUserId !== user.id) return { ok: false, error: "Booking not found." };
  if (booking.status !== "completed") return { ok: false, error: "You can only review a completed booking." };

  await db
    .insert(reviews)
    .values({
      bookingId,
      vehicleId: booking.vehicleId,
      customerUserId: user.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    })
    .onConflictDoUpdate({
      target: reviews.bookingId,
      set: { rating: parsed.data.rating, comment: parsed.data.comment },
    });

  revalidatePath(`/account/bookings/${bookingId}`);
  return { ok: true, data: undefined };
}

const disputeSchema = z.object({ summary: z.string().trim().min(10, "Describe the issue in a bit more detail") });

export async function raiseDisputeAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const bookingId = String(formData.get("bookingId"));
  const parsed = disputeSchema.safeParse({ summary: formData.get("summary") });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  if (!booking || booking.customerUserId !== user.id) return { ok: false, error: "Booking not found." };
  if (!["active", "return_in_progress", "completed"].includes(booking.status)) {
    return { ok: false, error: "Disputes can be raised once a rental has started." };
  }

  await db.transaction(async (tx) => {
    await tx.insert(disputes).values({ bookingId, raisedByUserId: user.id, summary: parsed.data.summary });
    await transitionBooking(tx, { bookingId, to: "disputed", actorUserId: user.id, actorRole: "customer", reason: "Dispute raised" });
  });

  revalidatePath(`/account/bookings/${bookingId}`);
  return { ok: true, data: undefined };
}
