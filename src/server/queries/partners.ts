import { desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  bookingPriceSnapshots,
  bookings,
  partnerLedgerEntries,
  partners,
  pickupLocations,
  users,
  vehicleImages,
  vehicles,
} from "@/db/schema";

export async function getPartnerForOwner(ownerUserId: string) {
  const [partner] = await db.select().from(partners).where(eq(partners.ownerUserId, ownerUserId)).limit(1);
  return partner ?? null;
}

export async function listPartnerVehicles(partnerId: string) {
  const vehicleRows = await db.select().from(vehicles).where(eq(vehicles.partnerId, partnerId)).orderBy(desc(vehicles.createdAt));
  if (vehicleRows.length === 0) return [];
  const images = await db
    .select()
    .from(vehicleImages)
    .where(inArray(vehicleImages.vehicleId, vehicleRows.map((v) => v.id)));
  const byVehicle = new Map<string, typeof images>();
  for (const img of images) byVehicle.set(img.vehicleId, [...(byVehicle.get(img.vehicleId) ?? []), img]);
  return vehicleRows.map((v) => ({ vehicle: v, images: byVehicle.get(v.id) ?? [] }));
}

export async function listPartnerPickupLocations(partnerId: string) {
  return db.select().from(pickupLocations).where(eq(pickupLocations.partnerId, partnerId));
}

export async function listPartnerBookings(partnerId: string) {
  return db
    .select({ booking: bookings, vehicle: vehicles, customer: users })
    .from(bookings)
    .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
    .innerJoin(users, eq(bookings.customerUserId, users.id))
    .where(eq(vehicles.partnerId, partnerId))
    .orderBy(desc(bookings.createdAt));
}

export async function getPartnerBookingDetail(partnerId: string, bookingId: string) {
  const [row] = await db
    .select({ booking: bookings, vehicle: vehicles, customer: users })
    .from(bookings)
    .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
    .innerJoin(users, eq(bookings.customerUserId, users.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);
  if (!row || row.vehicle.partnerId !== partnerId) return null;

  const [snapshot] = await db
    .select()
    .from(bookingPriceSnapshots)
    .where(eq(bookingPriceSnapshots.bookingId, bookingId))
    .orderBy(desc(bookingPriceSnapshots.createdAt))
    .limit(1);

  return { ...row, snapshot: snapshot ?? null };
}

export async function getPartnerLedgerSummary(partnerId: string) {
  const rows = await db
    .select({ type: partnerLedgerEntries.type, total: sql<string>`sum(${partnerLedgerEntries.amountPaise})` })
    .from(partnerLedgerEntries)
    .where(eq(partnerLedgerEntries.partnerId, partnerId))
    .groupBy(partnerLedgerEntries.type);

  const totals: Record<string, number> = {};
  for (const r of rows) totals[r.type] = Number(r.total);
  const balance = Object.values(totals).reduce((sum, v) => sum + v, 0);

  const entries = await db
    .select()
    .from(partnerLedgerEntries)
    .where(eq(partnerLedgerEntries.partnerId, partnerId))
    .orderBy(desc(partnerLedgerEntries.createdAt))
    .limit(50);

  return { totals, balance, entries };
}
