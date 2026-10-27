"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createBookingHold, BookingError } from "@/server/services/booking";
import { createOrderForBooking, PaymentError } from "@/server/services/payments";
import type { ActionResult } from "./auth";

const checkoutSchema = z.object({
  vehicleSlug: z.string().min(1),
  startsAt: z.string().min(1, "Choose a pickup date and time"),
  endsAt: z.string().min(1, "Choose a return date and time"),
  pickupMethod: z.enum(["partner_counter", "hotel_delivery", "airport_pickup"]),
  driverFullName: z.string().trim().min(2, "Enter the driver's full name"),
  driverPhone: z
    .string()
    .trim()
    .regex(/^[+]?[0-9\s-]{8,15}$/, "Enter a valid phone number"),
  driverLicenceNumber: z.string().trim().min(4, "Enter a valid driving licence number"),
});

export async function startCheckoutAction(
  _prev: ActionResult<{ bookingId: string }> | null,
  formData: FormData
): Promise<ActionResult<{ bookingId: string }>> {
  const user = await requireUser();

  const parsed = checkoutSchema.safeParse({
    vehicleSlug: formData.get("vehicleSlug"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    pickupMethod: formData.get("pickupMethod"),
    driverFullName: formData.get("driverFullName"),
    driverPhone: formData.get("driverPhone"),
    driverLicenceNumber: formData.get("driverLicenceNumber"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  }

  // <input type="datetime-local"> values are plain wall-clock strings with no offset.
  // Every pickup in this MVP happens in Manali, so we interpret them as IST (+05:30)
  // rather than the server process's local timezone (UTC on Vercel).
  const parseIst = (value: string) => new Date(`${value}:00+05:30`);

  try {
    const result = await createBookingHold({
      vehicleSlug: parsed.data.vehicleSlug,
      customerUserId: user.id,
      startsAt: parseIst(parsed.data.startsAt),
      endsAt: parseIst(parsed.data.endsAt),
      pickupMethod: parsed.data.pickupMethod,
      driverFullName: parsed.data.driverFullName,
      driverPhone: parsed.data.driverPhone,
      driverLicenceNumber: parsed.data.driverLicenceNumber,
    });
    redirect(`/checkout/${result.bookingId}`);
  } catch (err) {
    if (err instanceof BookingError) return { ok: false, error: err.message };
    throw err;
  }
}

export async function createPaymentOrderAction(bookingId: string) {
  const user = await requireUser();
  try {
    return { ok: true as const, data: await createOrderForBooking(bookingId, user.id) };
  } catch (err) {
    if (err instanceof PaymentError) return { ok: false as const, error: err.message };
    throw err;
  }
}
