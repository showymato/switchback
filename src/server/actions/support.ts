"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { supportCases, supportMessages } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import type { ActionResult } from "./auth";

function generateCaseNumber() {
  return `SC-${Date.now().toString(36).toUpperCase()}`;
}

const schema = z.object({
  category: z.enum([
    "booking_issue",
    "payment_issue",
    "refund_issue",
    "partner_no_show",
    "vehicle_condition",
    "breakdown_or_incident",
    "eligibility_question",
    "complaint",
    "other",
  ]),
  subject: z.string().trim().min(4, "Give your case a short subject"),
  body: z.string().trim().min(10, "Describe the issue in a bit more detail"),
  bookingId: z.string().optional(),
});

export async function createSupportCaseAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = schema.safeParse({
    category: formData.get("category"),
    subject: formData.get("subject"),
    body: formData.get("body"),
    bookingId: formData.get("bookingId") || undefined,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const [supportCase] = await db
    .insert(supportCases)
    .values({
      caseNumber: generateCaseNumber(),
      bookingId: parsed.data.bookingId || null,
      createdByUserId: user.id,
      category: parsed.data.category,
      subject: parsed.data.subject,
    })
    .returning();

  await db.insert(supportMessages).values({
    supportCaseId: supportCase.id,
    authorUserId: user.id,
    body: parsed.data.body,
  });

  revalidatePath("/account/support");
  return { ok: true, data: undefined };
}
