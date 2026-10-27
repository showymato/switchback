"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { customerProfiles, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import type { ActionResult } from "./auth";

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name"),
  phone: z.string().trim().min(8, "Enter a valid phone number"),
  drivingLicenceNumber: z.string().trim().optional(),
  notificationEmail: z.boolean(),
  notificationSms: z.boolean(),
});

export async function updateProfileAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    drivingLicenceNumber: formData.get("drivingLicenceNumber") || undefined,
    notificationEmail: formData.get("notificationEmail") === "on",
    notificationSms: formData.get("notificationSms") === "on",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  await db
    .update(users)
    .set({ fullName: parsed.data.fullName, phone: parsed.data.phone, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  await db
    .update(customerProfiles)
    .set({
      drivingLicenceNumber: parsed.data.drivingLicenceNumber,
      notificationEmail: parsed.data.notificationEmail,
      notificationSms: parsed.data.notificationSms,
      updatedAt: new Date(),
    })
    .where(eq(customerProfiles.userId, user.id));

  revalidatePath("/account/profile");
  return { ok: true, data: undefined };
}

export async function requestAccountDeletionAction(): Promise<ActionResult> {
  const user = await requireUser();
  await db.update(users).set({ deletionRequestedAt: new Date() }).where(eq(users.id, user.id));
  revalidatePath("/account/profile");
  return { ok: true, data: undefined };
}
