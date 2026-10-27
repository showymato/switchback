import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  adminAuditLogs,
  bookingPriceSnapshots,
  bookings,
  disputes,
  partners,
  payments,
  refunds,
  users,
  vehicles,
  type BookingStatus,
  type VehicleStatus,
} from "@/db/schema";

export async function getAdminDashboardMetrics() {
  const [bookingCounts] = await db
    .select({
      total: sql<number>`count(*)`,
      confirmed: sql<number>`count(*) filter (where status in ('confirmed','pickup_in_progress','active','return_in_progress'))`,
      completed: sql<number>`count(*) filter (where status = 'completed')`,
      cancelled: sql<number>`count(*) filter (where status in ('cancelled','expired'))`,
      disputed: sql<number>`count(*) filter (where status = 'disputed')`,
    })
    .from(bookings);

  const [gmvRow] = await db
    .select({ gmv: sql<string>`coalesce(sum(${bookingPriceSnapshots.subtotalPaise} + ${bookingPriceSnapshots.deliveryChargePaise} - ${bookingPriceSnapshots.discountPaise}), 0)` , commission: sql<string>`coalesce(sum(${bookingPriceSnapshots.platformCommissionPaise}), 0)` })
    .from(bookingPriceSnapshots)
    .innerJoin(bookings, eq(bookingPriceSnapshots.bookingId, bookings.id))
    .where(inArray(bookings.status, ["confirmed", "pickup_in_progress", "active", "return_in_progress", "completed"]));

  const [paymentFailures] = await db
    .select({ count: sql<number>`count(*)` })
    .from(payments)
    .where(eq(payments.status, "failed"));

  const [pendingRefunds] = await db
    .select({ count: sql<number>`count(*)`, total: sql<string>`coalesce(sum(${refunds.amountPaise}), 0)` })
    .from(refunds)
    .where(inArray(refunds.status, ["requested", "approved", "processing"]));

  const [partnerCounts] = await db
    .select({
      total: sql<number>`count(*)`,
      approved: sql<number>`count(*) filter (where status = 'approved')`,
      pending: sql<number>`count(*) filter (where status in ('submitted','under_review'))`,
    })
    .from(partners);

  const [vehicleCounts] = await db
    .select({
      total: sql<number>`count(*)`,
      published: sql<number>`count(*) filter (where status = 'published')`,
      pending: sql<number>`count(*) filter (where status in ('submitted','under_review'))`,
    })
    .from(vehicles);

  return {
    bookings: bookingCounts,
    gmvPaise: Number(gmvRow?.gmv ?? 0),
    commissionPaise: Number(gmvRow?.commission ?? 0),
    paymentFailures: Number(paymentFailures?.count ?? 0),
    pendingRefunds: { count: Number(pendingRefunds?.count ?? 0), totalPaise: Number(pendingRefunds?.total ?? 0) },
    partners: partnerCounts,
    vehicles: vehicleCounts,
  };
}

export async function listPartnersForAdmin() {
  return db.select().from(partners).orderBy(desc(partners.createdAt));
}

export async function getPartnerDetailForAdmin(partnerId: string) {
  const [partner] = await db.select().from(partners).where(eq(partners.id, partnerId)).limit(1);
  if (!partner) return null;
  const [owner] = await db.select().from(users).where(eq(users.id, partner.ownerUserId)).limit(1);
  const partnerVehicles = await db.select().from(vehicles).where(eq(vehicles.partnerId, partnerId));
  return { partner, owner, vehicles: partnerVehicles };
}

export async function listVehiclesForAdmin(statusFilter?: string) {
  const conditions = statusFilter ? [eq(vehicles.status, statusFilter as VehicleStatus)] : [];
  return db
    .select({ vehicle: vehicles, partnerName: partners.businessName, partnerStatus: partners.status })
    .from(vehicles)
    .innerJoin(partners, eq(vehicles.partnerId, partners.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(vehicles.createdAt));
}

export async function getVehicleDetailForAdmin(vehicleId: string) {
  const [row] = await db
    .select({ vehicle: vehicles, partner: partners })
    .from(vehicles)
    .innerJoin(partners, eq(vehicles.partnerId, partners.id))
    .where(eq(vehicles.id, vehicleId))
    .limit(1);
  return row ?? null;
}

export async function listBookingsForAdmin(statusFilter?: string) {
  const conditions = statusFilter ? [eq(bookings.status, statusFilter as BookingStatus)] : [];
  return db
    .select({ booking: bookings, vehicle: vehicles, customer: users, partner: partners })
    .from(bookings)
    .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
    .innerJoin(partners, eq(vehicles.partnerId, partners.id))
    .innerJoin(users, eq(bookings.customerUserId, users.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(bookings.createdAt))
    .limit(100);
}

export async function listPendingRefundsForAdmin() {
  return db
    .select({ refund: refunds, booking: bookings, vehicle: vehicles })
    .from(refunds)
    .innerJoin(bookings, eq(refunds.bookingId, bookings.id))
    .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
    .where(inArray(refunds.status, ["requested", "approved", "processing"]))
    .orderBy(desc(refunds.createdAt));
}

export async function listOpenDisputesForAdmin() {
  return db
    .select({ dispute: disputes, booking: bookings, vehicle: vehicles, customer: users })
    .from(disputes)
    .innerJoin(bookings, eq(disputes.bookingId, bookings.id))
    .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
    .innerJoin(users, eq(bookings.customerUserId, users.id))
    .where(inArray(disputes.status, ["open", "investigating"]))
    .orderBy(desc(disputes.createdAt));
}

export async function listAuditLogs(limit = 100) {
  return db
    .select({ log: adminAuditLogs, actor: users })
    .from(adminAuditLogs)
    .innerJoin(users, eq(adminAuditLogs.actorUserId, users.id))
    .orderBy(desc(adminAuditLogs.createdAt))
    .limit(limit);
}
