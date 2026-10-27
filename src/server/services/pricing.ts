import type { PickupMethod, Vehicle } from "@/db/schema";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** Calendar-day key in Asia/Kolkata (India has no DST, so a fixed offset is exact). */
function istDateKey(date: Date): string {
  const shifted = new Date(date.getTime() + IST_OFFSET_MS);
  return shifted.toISOString().slice(0, 10);
}

function isWeekendIst(date: Date): boolean {
  const shifted = new Date(date.getTime() + IST_OFFSET_MS);
  const day = shifted.getUTCDay();
  return day === 0 || day === 6;
}

export class PricingError extends Error {}

export interface PriceBreakdown {
  rateBasis: "hourly" | "daily";
  rentalDurationHours: number;
  baseRatePaise: number;
  subtotalPaise: number;
  deliveryChargePaise: number;
  discountPaise: number;
  taxPaise: number;
  platformCommissionPaise: number;
  depositPaise: number;
  totalPayablePaise: number;
  partnerPayoutPaise: number;
  includedKm: number | null;
  extraKmRatePaise: number | null;
  cancellationPolicy: {
    freeCancellationHours: number;
    partialRefundPercent: number;
    partialRefundCutoffHours: number;
  };
}

// The platform's default, unreviewed cancellation terms. Flagged in the compliance
// register as "requires legal review" — see docs/compliance-register.md.
export const DEFAULT_CANCELLATION_POLICY = {
  freeCancellationHours: 24,
  partialRefundPercent: 50,
  partialRefundCutoffHours: 6,
};

interface PricingInput {
  vehicle: Pick<
    Vehicle,
    | "dailyRatePaise"
    | "hourlyRatePaise"
    | "weekendRatePaise"
    | "securityDepositPaise"
    | "deliveryChargePaise"
    | "includedKmPerDay"
    | "extraKmRatePaise"
    | "minRentalHours"
  >;
  commissionBps: number;
  startsAt: Date;
  endsAt: Date;
  pickupMethod: PickupMethod;
  promotion?: { discountPercentBps: number; maxDiscountPaise: number | null } | null;
}

/**
 * The single authoritative pricing calculation. Called server-side only, both when
 * showing the customer an estimate and when creating the booking's immutable snapshot
 * — so a listing price and a checkout price can never silently diverge.
 */
export function calculatePrice(input: PricingInput): PriceBreakdown {
  const { vehicle, commissionBps, startsAt, endsAt, pickupMethod, promotion } = input;

  if (endsAt.getTime() <= startsAt.getTime()) {
    throw new PricingError("Return time must be after pickup time.");
  }

  const durationMs = endsAt.getTime() - startsAt.getTime();
  const durationHours = Math.ceil(durationMs / HOUR_MS);

  if (durationHours < vehicle.minRentalHours) {
    throw new PricingError(`This vehicle requires a minimum rental of ${vehicle.minRentalHours} hours.`);
  }

  let rateBasis: "hourly" | "daily";
  let baseRatePaise: number;
  let subtotalPaise: number;

  if (durationHours < 24 && vehicle.hourlyRatePaise) {
    rateBasis = "hourly";
    baseRatePaise = vehicle.hourlyRatePaise;
    subtotalPaise = vehicle.hourlyRatePaise * durationHours;
  } else {
    rateBasis = "daily";
    baseRatePaise = vehicle.dailyRatePaise;
    const totalDays = Math.ceil(durationHours / 24);

    if (vehicle.weekendRatePaise) {
      let runningSubtotal = 0;
      for (let d = 0; d < totalDays; d++) {
        const dayStart = new Date(startsAt.getTime() + d * DAY_MS);
        runningSubtotal += isWeekendIst(dayStart) ? vehicle.weekendRatePaise : vehicle.dailyRatePaise;
      }
      subtotalPaise = runningSubtotal;
    } else {
      subtotalPaise = vehicle.dailyRatePaise * totalDays;
    }
  }

  const deliveryChargePaise = pickupMethod === "partner_counter" ? 0 : vehicle.deliveryChargePaise;

  let discountPaise = 0;
  if (promotion) {
    discountPaise = Math.round((subtotalPaise * promotion.discountPercentBps) / 10000);
    if (promotion.maxDiscountPaise != null) {
      discountPaise = Math.min(discountPaise, promotion.maxDiscountPaise);
    }
  }

  // GST treatment for a rental marketplace facilitator is not yet finalized — see
  // compliance register. Held at zero until confirmed with a tax professional.
  const taxPaise = 0;

  const commissionableAmount = subtotalPaise + deliveryChargePaise - discountPaise;
  const platformCommissionPaise = Math.round((commissionableAmount * commissionBps) / 10000);
  const depositPaise = vehicle.securityDepositPaise;

  const totalPayablePaise = commissionableAmount + taxPaise + depositPaise;
  const partnerPayoutPaise = commissionableAmount - platformCommissionPaise;

  return {
    rateBasis,
    rentalDurationHours: durationHours,
    baseRatePaise,
    subtotalPaise,
    deliveryChargePaise,
    discountPaise,
    taxPaise,
    platformCommissionPaise,
    depositPaise,
    totalPayablePaise,
    partnerPayoutPaise,
    includedKm:
      vehicle.includedKmPerDay != null
        ? vehicle.includedKmPerDay * (rateBasis === "daily" ? Math.ceil(durationHours / 24) : 1)
        : null,
    extraKmRatePaise: vehicle.extraKmRatePaise ?? null,
    cancellationPolicy: DEFAULT_CANCELLATION_POLICY,
  };
}

export function formatPaise(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export { istDateKey };
