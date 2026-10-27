import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  bookingPriceSnapshots,
  bookingStatusEvents,
  bookings,
  partners,
  payments,
  pickupLocations,
  refunds,
  vehicles,
} from "@/db/schema";

export async function getBookingForCustomer(bookingId: string, customerUserId: string) {
  const [row] = await db
    .select({ booking: bookings, vehicle: vehicles, partner: partners, pickupLocation: pickupLocations })
    .from(bookings)
    .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
    .innerJoin(partners, eq(vehicles.partnerId, partners.id))
    .leftJoin(pickupLocations, eq(bookings.pickupLocationId, pickupLocations.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!row || row.booking.customerUserId !== customerUserId) return null;

  const [snapshot] = await db
    .select()
    .from(bookingPriceSnapshots)
    .where(eq(bookingPriceSnapshots.bookingId, bookingId))
    .orderBy(desc(bookingPriceSnapshots.createdAt))
    .limit(1);

  const [payment] = await db.select().from(payments).where(eq(payments.bookingId, bookingId)).limit(1);
  const bookingRefunds = await db.select().from(refunds).where(eq(refunds.bookingId, bookingId));
  const events = await db
    .select()
    .from(bookingStatusEvents)
    .where(eq(bookingStatusEvents.bookingId, bookingId))
    .orderBy(bookingStatusEvents.createdAt);

  return { ...row, snapshot: snapshot ?? null, payment: payment ?? null, refunds: bookingRefunds, events };
}

export async function listBookingsForCustomer(customerUserId: string) {
  const rows = await db
    .select({ booking: bookings, vehicle: vehicles, partner: partners })
    .from(bookings)
    .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
    .innerJoin(partners, eq(vehicles.partnerId, partners.id))
    .where(eq(bookings.customerUserId, customerUserId))
    .orderBy(desc(bookings.createdAt));
  return rows;
}
