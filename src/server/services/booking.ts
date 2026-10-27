import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookingPriceSnapshots, bookingStatusEvents, bookings, partners, vehicles } from "@/db/schema";
import type { PickupMethod } from "@/db/schema";
import { calculatePrice } from "./pricing";
import { hasMaintenanceOverlap, isPostgresExclusionViolation, releaseExpiredHolds } from "./availability";

export class BookingError extends Error {}

const HOLD_DURATION_MS = 15 * 60 * 1000;
const MAX_RENTAL_DAYS = 30;

function generateReference() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `SWB-${stamp}${rand}`;
}

export interface CreateHoldInput {
  vehicleSlug: string;
  customerUserId: string;
  startsAt: Date;
  endsAt: Date;
  pickupMethod: PickupMethod;
  driverFullName: string;
  driverPhone: string;
  driverLicenceNumber: string;
}

export interface CreateHoldResult {
  bookingId: string;
  reference: string;
}

/**
 * Creates a time-limited booking hold with its immutable price snapshot. Relies on
 * the database exclusion constraint (not just the application check) as the final
 * word on whether two concurrent requests can reserve the same vehicle — see
 * acceptance test #7.
 */
export async function createBookingHold(input: CreateHoldInput): Promise<CreateHoldResult> {
  const now = new Date();

  if (input.endsAt.getTime() <= input.startsAt.getTime()) {
    throw new BookingError("Return time must be after pickup time.");
  }
  if (input.startsAt.getTime() < now.getTime() - 5 * 60 * 1000) {
    throw new BookingError("Pickup time must be in the future.");
  }
  const spanDays = (input.endsAt.getTime() - input.startsAt.getTime()) / (24 * 60 * 60 * 1000);
  if (spanDays > MAX_RENTAL_DAYS) {
    throw new BookingError(`Bookings longer than ${MAX_RENTAL_DAYS} days are not supported yet — contact support.`);
  }

  try {
    return await db.transaction(async (tx) => {
      const [vehicle] = await tx
        .select()
        .from(vehicles)
        .where(and(eq(vehicles.slug, input.vehicleSlug), eq(vehicles.isListed, true), eq(vehicles.status, "published")))
        .limit(1);

      if (!vehicle) throw new BookingError("This vehicle is not available for booking.");

      const [partner] = await tx.select().from(partners).where(eq(partners.id, vehicle.partnerId)).limit(1);
      if (!partner || partner.status !== "approved") {
        throw new BookingError("This vehicle's rental partner is not currently approved.");
      }

      await releaseExpiredHolds(tx, vehicle.id);

      if (await hasMaintenanceOverlap(tx, vehicle.id, input.startsAt, input.endsAt)) {
        throw new BookingError("This vehicle is unavailable (maintenance) for part of the selected period.");
      }

      const price = calculatePrice({
        vehicle,
        commissionBps: partner.commissionBps,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        pickupMethod: input.pickupMethod,
      });

      const reference = generateReference();
      const holdExpiresAt = new Date(now.getTime() + HOLD_DURATION_MS);

      const [booking] = await tx
        .insert(bookings)
        .values({
          reference,
          vehicleId: vehicle.id,
          customerUserId: input.customerUserId,
          pickupLocationId: vehicle.pickupLocationId,
          pickupMethod: input.pickupMethod,
          status: "pending_checkout",
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          holdExpiresAt,
          driverFullName: input.driverFullName,
          driverPhone: input.driverPhone,
          driverLicenceNumber: input.driverLicenceNumber,
        })
        .returning({ id: bookings.id, reference: bookings.reference });

      await tx.insert(bookingPriceSnapshots).values({
        bookingId: booking.id,
        rateBasis: price.rateBasis,
        rentalDurationHours: price.rentalDurationHours,
        baseRatePaise: price.baseRatePaise,
        subtotalPaise: price.subtotalPaise,
        deliveryChargePaise: price.deliveryChargePaise,
        discountPaise: price.discountPaise,
        taxPaise: price.taxPaise,
        platformCommissionPaise: price.platformCommissionPaise,
        depositPaise: price.depositPaise,
        totalPayablePaise: price.totalPayablePaise,
        partnerPayoutPaise: price.partnerPayoutPaise,
        includedKm: price.includedKm,
        extraKmRatePaise: price.extraKmRatePaise,
        cancellationPolicy: price.cancellationPolicy,
      });

      await tx.insert(bookingStatusEvents).values({
        bookingId: booking.id,
        fromStatus: null,
        toStatus: "pending_checkout",
        actorRole: "customer",
        reason: "Checkout started",
      });

      return { bookingId: booking.id, reference: booking.reference };
    });
  } catch (err) {
    if (isPostgresExclusionViolation(err)) {
      throw new BookingError(
        "This vehicle was just reserved for an overlapping period by another customer. Please choose different dates."
      );
    }
    throw err;
  }
}
