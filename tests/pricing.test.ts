import { describe, expect, it } from "vitest";
import { calculatePrice, PricingError } from "@/server/services/pricing";

const baseVehicle = {
  dailyRatePaise: 180000,
  hourlyRatePaise: 15000,
  weekendRatePaise: null as number | null,
  securityDepositPaise: 500000,
  deliveryChargePaise: 30000,
  includedKmPerDay: 150,
  extraKmRatePaise: 800,
  minRentalHours: 4,
};

describe("calculatePrice", () => {
  it("prices a sub-24h rental on the hourly rate", () => {
    const result = calculatePrice({
      vehicle: baseVehicle,
      commissionBps: 1500,
      startsAt: new Date("2026-11-01T10:00:00+05:30"),
      endsAt: new Date("2026-11-01T16:00:00+05:30"),
      pickupMethod: "partner_counter",
    });

    expect(result.rateBasis).toBe("hourly");
    expect(result.rentalDurationHours).toBe(6);
    expect(result.subtotalPaise).toBe(15000 * 6);
    expect(result.deliveryChargePaise).toBe(0); // partner_counter pickup
    expect(result.depositPaise).toBe(500000);
    expect(result.platformCommissionPaise).toBe(Math.round(result.subtotalPaise * 0.15));
    expect(result.totalPayablePaise).toBe(result.subtotalPaise - result.platformCommissionPaise + result.platformCommissionPaise + result.depositPaise);
    // total = subtotal + tax(0) + deposit - discount(0), commission is a platform cut of partner payout, not added to customer price
    expect(result.totalPayablePaise).toBe(result.subtotalPaise + result.depositPaise);
  });

  it("prices a multi-day rental on the daily rate and adds delivery charge", () => {
    const result = calculatePrice({
      vehicle: baseVehicle,
      commissionBps: 1500,
      startsAt: new Date("2026-11-01T10:00:00+05:30"),
      endsAt: new Date("2026-11-04T10:00:00+05:30"),
      pickupMethod: "hotel_delivery",
    });

    expect(result.rateBasis).toBe("daily");
    expect(result.rentalDurationHours).toBe(72);
    expect(result.subtotalPaise).toBe(180000 * 3);
    expect(result.deliveryChargePaise).toBe(30000);
    expect(result.totalPayablePaise).toBe(result.subtotalPaise + result.deliveryChargePaise + result.depositPaise);
  });

  it("rounds a partial day up to a full day", () => {
    const result = calculatePrice({
      vehicle: baseVehicle,
      commissionBps: 1500,
      startsAt: new Date("2026-11-01T10:00:00+05:30"),
      endsAt: new Date("2026-11-02T14:00:00+05:30"), // 28 hours
      pickupMethod: "partner_counter",
    });
    expect(result.rateBasis).toBe("daily");
    expect(result.subtotalPaise).toBe(180000 * 2); // ceil(28/24) = 2 days
  });

  it("applies the weekend rate on Saturday/Sunday (IST) when configured", () => {
    const vehicleWithWeekendRate = { ...baseVehicle, weekendRatePaise: 220000 };
    // 2026-10-31 is a Saturday in IST, 2026-11-01 is a Sunday, 2026-11-02 is a Monday.
    const result = calculatePrice({
      vehicle: vehicleWithWeekendRate,
      commissionBps: 1500,
      startsAt: new Date("2026-10-31T08:00:00+05:30"),
      endsAt: new Date("2026-11-03T08:00:00+05:30"), // Sat, Sun, Mon = 3 days
      pickupMethod: "partner_counter",
    });
    expect(result.subtotalPaise).toBe(220000 + 220000 + 180000);
  });

  it("applies a discount capped at maxDiscountPaise", () => {
    const result = calculatePrice({
      vehicle: baseVehicle,
      commissionBps: 1500,
      startsAt: new Date("2026-11-01T10:00:00+05:30"),
      endsAt: new Date("2026-11-04T10:00:00+05:30"),
      pickupMethod: "partner_counter",
      promotion: { discountPercentBps: 5000, maxDiscountPaise: 50000 }, // 50% off, capped at 500
    });
    const uncapped = Math.round(result.subtotalPaise * 0.5);
    expect(uncapped).toBeGreaterThan(50000);
    expect(result.discountPaise).toBe(50000);
  });

  it("rejects a return time that is not after the pickup time", () => {
    expect(() =>
      calculatePrice({
        vehicle: baseVehicle,
        commissionBps: 1500,
        startsAt: new Date("2026-11-01T10:00:00+05:30"),
        endsAt: new Date("2026-11-01T09:00:00+05:30"),
        pickupMethod: "partner_counter",
      })
    ).toThrow(PricingError);
  });

  it("rejects a rental shorter than the vehicle's minimum", () => {
    expect(() =>
      calculatePrice({
        vehicle: { ...baseVehicle, minRentalHours: 24 },
        commissionBps: 1500,
        startsAt: new Date("2026-11-01T10:00:00+05:30"),
        endsAt: new Date("2026-11-01T12:00:00+05:30"),
        pickupMethod: "partner_counter",
      })
    ).toThrow(PricingError);
  });

  it("never lets the partner payout exceed the commissionable amount", () => {
    const result = calculatePrice({
      vehicle: baseVehicle,
      commissionBps: 1500,
      startsAt: new Date("2026-11-01T10:00:00+05:30"),
      endsAt: new Date("2026-11-02T10:00:00+05:30"),
      pickupMethod: "partner_counter",
    });
    expect(result.partnerPayoutPaise).toBe(result.subtotalPaise - result.platformCommissionPaise);
    expect(result.partnerPayoutPaise).toBeLessThan(result.subtotalPaise);
  });
});
