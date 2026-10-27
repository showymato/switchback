import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  bookingPriceSnapshots,
  bookings,
  partnerLedgerEntries,
  partners,
  payments,
  pickupLocations,
  refunds,
  users,
  vehicles,
} from "@/db/schema";
import { createBookingHold, BookingError } from "@/server/services/booking";
import { createOrderForBooking, confirmPaymentCaptured, markPaymentFailed } from "@/server/services/payments";
import { requestCancellation } from "@/server/services/cancellation";

// Integration tests against the real Neon database configured in .env.local. Every
// row created here is deleted in afterAll, in FK-safe order, so the seeded demo data
// is left untouched.
const RUN_ID = Date.now().toString(36);

let partnerId: string;
let pickupLocationId: string;
let vehicleAId: string;
let vehicleBId: string;
let customer1Id: string;
let customer2Id: string;

const createdBookingIds: string[] = [];

async function createUser(email: string, role: "customer" | "partner_owner") {
  const [user] = await db
    .insert(users)
    .values({ email, passwordHash: "test-hash-not-used", fullName: "Test User", role })
    .returning();
  return user.id;
}

beforeAll(async () => {
  customer1Id = await createUser(`test-customer-1-${RUN_ID}@example.com`, "customer");
  customer2Id = await createUser(`test-customer-2-${RUN_ID}@example.com`, "customer");
  const ownerId = await createUser(`test-owner-${RUN_ID}@example.com`, "partner_owner");

  const [partner] = await db
    .insert(partners)
    .values({
      ownerUserId: ownerId,
      businessName: `Test Partner ${RUN_ID}`,
      contactPhone: "+910000000000",
      contactEmail: `test-owner-${RUN_ID}@example.com`,
      addressLine1: "Test Address",
      commissionBps: 1500,
      status: "approved",
      approvedAt: new Date(),
    })
    .returning();
  partnerId = partner.id;

  const [location] = await db
    .insert(pickupLocations)
    .values({ partnerId, name: "Test Counter", addressLine: "Test Rd", area: "Test Area" })
    .returning();
  pickupLocationId = location.id;

  const [vehicleA] = await db
    .insert(vehicles)
    .values({
      partnerId,
      pickupLocationId,
      slug: `test-vehicle-a-${RUN_ID}`,
      category: "motorcycle",
      make: "Test",
      model: "Bike A",
      registrationNumber: `TEST-A-${RUN_ID}`,
      dailyRatePaise: 150000,
      securityDepositPaise: 300000,
      minRentalHours: 4,
      status: "published",
      isListed: true,
      publishedAt: new Date(),
    })
    .returning();
  vehicleAId = vehicleA.id;

  const [vehicleB] = await db
    .insert(vehicles)
    .values({
      partnerId,
      pickupLocationId,
      slug: `test-vehicle-b-${RUN_ID}`,
      category: "motorcycle",
      make: "Test",
      model: "Bike B",
      registrationNumber: `TEST-B-${RUN_ID}`,
      dailyRatePaise: 150000,
      securityDepositPaise: 300000,
      minRentalHours: 4,
      status: "published",
      isListed: true,
      publishedAt: new Date(),
    })
    .returning();
  vehicleBId = vehicleB.id;
});

afterAll(async () => {
  for (const bookingId of createdBookingIds) {
    await db.delete(refunds).where(eq(refunds.bookingId, bookingId));
    await db.delete(partnerLedgerEntries).where(eq(partnerLedgerEntries.bookingId, bookingId));
    await db.delete(payments).where(eq(payments.bookingId, bookingId));
  }
  // bookingPriceSnapshots and bookingStatusEvents cascade on booking delete.
  for (const bookingId of createdBookingIds) {
    await db.delete(bookings).where(eq(bookings.id, bookingId));
  }
  await db.delete(vehicles).where(eq(vehicles.id, vehicleAId));
  await db.delete(vehicles).where(eq(vehicles.id, vehicleBId));
  await db.delete(pickupLocations).where(eq(pickupLocations.id, pickupLocationId));
  await db.delete(partners).where(eq(partners.id, partnerId));
  await db.delete(users).where(eq(users.id, customer1Id));
  await db.delete(users).where(eq(users.id, customer2Id));
  const [partner] = await db.select().from(partners).where(eq(partners.id, partnerId));
  if (!partner) {
    await db.delete(users).where(eq(users.email, `test-owner-${RUN_ID}@example.com`));
  }
});

function futureRange(daysFromNow: number, durationHours = 24) {
  const startsAt = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  const endsAt = new Date(startsAt.getTime() + durationHours * 60 * 60 * 1000);
  return { startsAt, endsAt };
}

describe("booking + payment + cancellation (acceptance tests)", () => {
  it("creates a pending_checkout hold with an immutable price snapshot (acceptance test #2, #3)", async () => {
    const { startsAt, endsAt } = futureRange(10);
    const hold = await createBookingHold({
      vehicleSlug: `test-vehicle-a-${RUN_ID}`,
      customerUserId: customer1Id,
      startsAt,
      endsAt,
      pickupMethod: "partner_counter",
      driverFullName: "Riya Sharma",
      driverPhone: "+919800000000",
      driverLicenceNumber: "HP1234567890",
    });
    createdBookingIds.push(hold.bookingId);

    const [booking] = await db.select().from(bookings).where(eq(bookings.id, hold.bookingId));
    expect(booking.status).toBe("pending_checkout");
    expect(booking.holdExpiresAt).not.toBeNull();

    const [snapshot] = await db.select().from(bookingPriceSnapshots).where(eq(bookingPriceSnapshots.bookingId, hold.bookingId));
    expect(snapshot.subtotalPaise).toBe(150000);
    expect(snapshot.depositPaise).toBe(300000);
    expect(snapshot.totalPayablePaise).toBe(150000 + 300000);
  });

  it("rejects a return time before the pickup time before touching the database", async () => {
    const { startsAt } = futureRange(11);
    await expect(
      createBookingHold({
        vehicleSlug: `test-vehicle-a-${RUN_ID}`,
        customerUserId: customer1Id,
        startsAt,
        endsAt: new Date(startsAt.getTime() - 1000),
        pickupMethod: "partner_counter",
        driverFullName: "Riya Sharma",
        driverPhone: "+919800000000",
        driverLicenceNumber: "HP1234567890",
      })
    ).rejects.toThrow(BookingError);
  });

  it("prevents two concurrent holds from overlapping on the same vehicle (acceptance test #7)", async () => {
    const { startsAt, endsAt } = futureRange(20);

    const attempt = (customerUserId: string) =>
      createBookingHold({
        vehicleSlug: `test-vehicle-b-${RUN_ID}`,
        customerUserId,
        startsAt,
        endsAt,
        pickupMethod: "partner_counter",
        driverFullName: "Concurrent Test",
        driverPhone: "+919800000001",
        driverLicenceNumber: "HP0000000000",
      });

    const results = await Promise.allSettled([attempt(customer1Id), attempt(customer2Id)]);

    const fulfilled = results.filter((r) => r.status === "fulfilled") as PromiseFulfilledResult<Awaited<ReturnType<typeof attempt>>>[];
    const rejected = results.filter((r) => r.status === "rejected");

    // Track for cleanup before any assertion can throw.
    for (const f of fulfilled) createdBookingIds.push(f.value.bookingId);

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(BookingError);
  }, 30000);

  it("does not confirm a booking on a failed payment, and confirms + posts the ledger on a captured one (acceptance test #5)", async () => {
    const { startsAt, endsAt } = futureRange(30);

    const holdA = await createBookingHold({
      vehicleSlug: `test-vehicle-a-${RUN_ID}`,
      customerUserId: customer1Id,
      startsAt,
      endsAt,
      pickupMethod: "partner_counter",
      driverFullName: "Pay Fail Test",
      driverPhone: "+919800000002",
      driverLicenceNumber: "HP1111111111",
    });
    createdBookingIds.push(holdA.bookingId);

    const order = await createOrderForBooking(holdA.bookingId, customer1Id);
    expect(order.isSandbox).toBe(true); // no RAZORPAY_* keys in this environment

    await markPaymentFailed({
      providerOrderId: order.orderId,
      providerEventId: `evt-fail-${RUN_ID}`,
      reason: "test failure",
    });

    const [failedBooking] = await db.select().from(bookings).where(eq(bookings.id, holdA.bookingId));
    expect(failedBooking.status).toBe("payment_failed");

    // A fresh booking for the success path (test#2's vehicle A slot from day 10 is taken,
    // day 40 is free).
    const { startsAt: s2, endsAt: e2 } = futureRange(40);
    const holdB = await createBookingHold({
      vehicleSlug: `test-vehicle-a-${RUN_ID}`,
      customerUserId: customer1Id,
      startsAt: s2,
      endsAt: e2,
      pickupMethod: "partner_counter",
      driverFullName: "Pay Success Test",
      driverPhone: "+919800000003",
      driverLicenceNumber: "HP2222222222",
    });
    createdBookingIds.push(holdB.bookingId);

    const orderB = await createOrderForBooking(holdB.bookingId, customer1Id);
    const eventId = `evt-success-${RUN_ID}`;

    await confirmPaymentCaptured({
      providerOrderId: orderB.orderId,
      providerPaymentId: `pay_${RUN_ID}`,
      providerEventId: eventId,
      rawVerifiedPayload: { test: true },
    });

    const [confirmedBooking] = await db.select().from(bookings).where(eq(bookings.id, holdB.bookingId));
    expect(confirmedBooking.status).toBe("confirmed");

    const ledgerEntries = await db.select().from(partnerLedgerEntries).where(eq(partnerLedgerEntries.bookingId, holdB.bookingId));
    expect(ledgerEntries).toHaveLength(2);
    const credit = ledgerEntries.find((e) => e.type === "booking_credit")!;
    const debit = ledgerEntries.find((e) => e.type === "commission_debit")!;
    expect(credit.amountPaise).toBe(150000);
    expect(debit.amountPaise).toBe(-Math.round(150000 * 0.15));

    // Replaying the exact same webhook event id must not duplicate the ledger
    // (acceptance test #6 — idempotent webhook processing).
    await confirmPaymentCaptured({
      providerOrderId: orderB.orderId,
      providerPaymentId: `pay_${RUN_ID}`,
      providerEventId: eventId,
      rawVerifiedPayload: { test: true },
    });
    const ledgerAfterReplay = await db.select().from(partnerLedgerEntries).where(eq(partnerLedgerEntries.bookingId, holdB.bookingId));
    expect(ledgerAfterReplay).toHaveLength(2);

    // Cancellation on a confirmed, far-future booking should refund close to 100%.
    const result = await requestCancellation({
      bookingId: holdB.bookingId,
      actorUserId: customer1Id,
      actorRole: "customer",
      reason: "test cancellation",
    });
    expect(result.refundAmountPaise).toBe(150000 + 300000); // full rental + full deposit

    const [refundRow] = await db.select().from(refunds).where(eq(refunds.bookingId, holdB.bookingId));
    expect(refundRow.amountPaise).toBe(450000);

    const [cancelledBooking] = await db.select().from(bookings).where(eq(bookings.id, holdB.bookingId));
    expect(cancelledBooking.status).toBe("refund_pending");
  }, 60000);
});
