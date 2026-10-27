"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  availabilityBlocks,
  inspections,
  partners,
  pickupLocations,
  users,
  vehicles,
} from "@/db/schema";
import { createSession, hashPassword, requireRole } from "@/lib/auth";
import { transitionBooking } from "@/server/services/bookingStateMachine";
import { getPartnerBookingDetail, getPartnerForOwner } from "@/server/queries/partners";
import type { ActionResult } from "./auth";

const applySchema = z.object({
  fullName: z.string().trim().min(2),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().min(8),
  password: z.string().min(8),
  businessName: z.string().trim().min(2),
  contactPhone: z.string().trim().min(8),
  addressLine1: z.string().trim().min(4),
  gstin: z.string().trim().optional(),
  panNumber: z.string().trim().optional(),
  rentalSchemeLicenceNumber: z.string().trim().optional(),
});

export async function applyAsPartnerAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = applySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  }
  const data = parsed.data;

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, data.email)).limit(1);
  if (existing.length > 0) {
    return { ok: false, error: "An account with that email already exists.", fieldErrors: { email: "Already registered" } };
  }

  const passwordHash = await hashPassword(data.password);
  const [user] = await db
    .insert(users)
    .values({ fullName: data.fullName, email: data.email, phone: data.phone, passwordHash, role: "partner_owner" })
    .returning({ id: users.id });

  await db.insert(partners).values({
    ownerUserId: user.id,
    businessName: data.businessName,
    contactPhone: data.contactPhone,
    contactEmail: data.email,
    addressLine1: data.addressLine1,
    gstin: data.gstin || null,
    panNumber: data.panNumber || null,
    rentalSchemeLicenceNumber: data.rentalSchemeLicenceNumber || null,
    status: "submitted",
    policyAgreedAt: new Date(),
  });

  const headerList = await headers();
  await createSession(user.id, {
    userAgent: headerList.get("user-agent") ?? undefined,
    ipAddress: headerList.get("x-forwarded-for") ?? undefined,
  });

  redirect("/partner/dashboard");
}

const vehicleSchema = z.object({
  category: z.enum(["motorcycle", "scooter", "car", "suv"]),
  make: z.string().trim().min(1),
  model: z.string().trim().min(1),
  year: z.coerce.number().int().optional(),
  transmission: z.enum(["manual", "automatic"]).optional(),
  fuelType: z.enum(["petrol", "diesel", "electric", "hybrid"]).optional(),
  seatingCapacity: z.coerce.number().int().optional(),
  engineCc: z.coerce.number().int().optional(),
  registrationNumber: z.string().trim().min(3),
  pickupLocationId: z.string().optional(),
  dailyRatePaise: z.coerce.number().int().min(100),
  hourlyRatePaise: z.coerce.number().int().optional(),
  securityDepositPaise: z.coerce.number().int().min(0),
  includedKmPerDay: z.coerce.number().int().optional(),
  extraKmRatePaise: z.coerce.number().int().optional(),
  deliveryChargePaise: z.coerce.number().int().optional(),
  minRentalHours: z.coerce.number().int().min(1),
  description: z.string().trim().optional(),
  features: z.string().optional(),
  eligibilityRequirements: z.string().optional(),
});

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createVehicleAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireRole("partner_owner", "partner_staff");
  const partner = await getPartnerForOwner(user.id);
  if (!partner) return { ok: false, error: "No partner profile found for your account." };

  const raw = Object.fromEntries(formData.entries());
  const parsed = vehicleSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const data = parsed.data;

  const slug = `${slugify(`${data.make}-${data.model}`)}-${slugify(data.registrationNumber)}`;

  await db.insert(vehicles).values({
    partnerId: partner.id,
    pickupLocationId: data.pickupLocationId || null,
    slug,
    category: data.category,
    make: data.make,
    model: data.model,
    year: data.year,
    transmission: data.transmission,
    fuelType: data.fuelType,
    seatingCapacity: data.seatingCapacity,
    engineCc: data.engineCc,
    registrationNumber: data.registrationNumber,
    // Partners enter whole-rupee amounts in the form; money is stored in paise everywhere else.
    dailyRatePaise: data.dailyRatePaise * 100,
    hourlyRatePaise: data.hourlyRatePaise != null ? data.hourlyRatePaise * 100 : undefined,
    securityDepositPaise: data.securityDepositPaise * 100,
    includedKmPerDay: data.includedKmPerDay,
    extraKmRatePaise: data.extraKmRatePaise != null ? data.extraKmRatePaise * 100 : undefined,
    deliveryChargePaise: data.deliveryChargePaise != null ? data.deliveryChargePaise * 100 : 0,
    minRentalHours: data.minRentalHours,
    description: data.description,
    features: data.features ? data.features.split(",").map((f) => f.trim()).filter(Boolean) : [],
    eligibilityRequirements: data.eligibilityRequirements
      ? data.eligibilityRequirements.split(",").map((f) => f.trim()).filter(Boolean)
      : [],
    status: "submitted",
    isListed: false,
  });

  revalidatePath("/partner/vehicles");
  redirect("/partner/vehicles");
}

const locationSchema = z.object({
  name: z.string().trim().min(2),
  addressLine: z.string().trim().min(4),
  area: z.string().trim().min(2),
  openingTime: z.string().trim().min(1),
  closingTime: z.string().trim().min(1),
});

export async function createPickupLocationAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireRole("partner_owner", "partner_staff");
  const partner = await getPartnerForOwner(user.id);
  if (!partner) return { ok: false, error: "No partner profile found." };

  const parsed = locationSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "Please fill in all location fields." };

  await db.insert(pickupLocations).values({ partnerId: partner.id, ...parsed.data });
  revalidatePath("/partner/vehicles/new");
  return { ok: true, data: undefined };
}

const maintenanceSchema = z.object({
  vehicleId: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
  reason: z.string().trim().min(2),
});

export async function blockMaintenanceAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireRole("partner_owner", "partner_staff");
  const partner = await getPartnerForOwner(user.id);
  if (!partner) return { ok: false, error: "No partner profile found." };

  const parsed = maintenanceSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "Please fill in all fields." };

  const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, parsed.data.vehicleId)).limit(1);
  if (!vehicle || vehicle.partnerId !== partner.id) return { ok: false, error: "Vehicle not found." };

  const startsAt = new Date(`${parsed.data.startsAt}:00+05:30`);
  const endsAt = new Date(`${parsed.data.endsAt}:00+05:30`);
  if (endsAt <= startsAt) return { ok: false, error: "End must be after start." };

  await db.insert(availabilityBlocks).values({
    vehicleId: vehicle.id,
    startsAt,
    endsAt,
    reason: parsed.data.reason,
    createdByUserId: user.id,
  });

  revalidatePath("/partner/vehicles");
  return { ok: true, data: undefined };
}

const handoverSchema = z.object({
  bookingId: z.string(),
  type: z.enum(["handover", "return"]),
  odometerReading: z.coerce.number().int().optional(),
  fuelOrChargeLevelPercent: z.coerce.number().int().min(0).max(100).optional(),
  conditionNotes: z.string().trim().optional(),
});

export async function recordInspectionAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireRole("partner_owner", "partner_staff");
  const partner = await getPartnerForOwner(user.id);
  if (!partner) return { ok: false, error: "No partner profile found." };

  const parsed = handoverSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "Please check the form." };

  const detail = await getPartnerBookingDetail(partner.id, parsed.data.bookingId);
  if (!detail) return { ok: false, error: "Booking not found." };

  const { booking } = detail;

  if (parsed.data.type === "handover" && !["confirmed", "pickup_in_progress"].includes(booking.status)) {
    return { ok: false, error: `Cannot record a handover for a booking that is "${booking.status}".` };
  }
  if (parsed.data.type === "return" && !["active", "return_in_progress"].includes(booking.status)) {
    return { ok: false, error: `Cannot record a return for a booking that is "${booking.status}".` };
  }

  await db.transaction(async (tx) => {
    await tx.insert(inspections).values({
      bookingId: booking.id,
      type: parsed.data.type,
      performedByUserId: user.id,
      odometerReading: parsed.data.odometerReading,
      fuelOrChargeLevelPercent: parsed.data.fuelOrChargeLevelPercent,
      conditionNotes: parsed.data.conditionNotes,
    });

    if (parsed.data.type === "handover") {
      if (booking.status === "confirmed") {
        await transitionBooking(tx, { bookingId: booking.id, to: "pickup_in_progress", actorUserId: user.id, actorRole: "partner_owner", reason: "Handover started" });
      }
      await transitionBooking(tx, { bookingId: booking.id, to: "active", actorUserId: user.id, actorRole: "partner_owner", reason: "Handover complete" });
    } else {
      if (booking.status === "active") {
        await transitionBooking(tx, { bookingId: booking.id, to: "return_in_progress", actorUserId: user.id, actorRole: "partner_owner", reason: "Return started" });
      }
      await transitionBooking(tx, { bookingId: booking.id, to: "completed", actorUserId: user.id, actorRole: "partner_owner", reason: "Return complete" });
    }
  });

  revalidatePath(`/partner/bookings/${booking.id}`);
  revalidatePath("/partner/bookings");
  return { ok: true, data: undefined };
}
