import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { partners, pickupLocations, vehicleImages, vehicles, type VehicleCategory } from "@/db/schema";
import { OCCUPYING_STATUSES } from "@/server/services/availability";

export interface VehicleSearchFilters {
  category?: VehicleCategory;
  startsAt?: Date;
  endsAt?: Date;
  minPricePaise?: number;
  maxPricePaise?: number;
  transmission?: "manual" | "automatic";
  minSeats?: number;
  sort?: "relevance" | "price_asc" | "price_desc";
}

const occupyingStatusSql = sql.join(
  OCCUPYING_STATUSES.map((s) => sql`${s}`),
  sql`, `
);

export async function searchVehicles(filters: VehicleSearchFilters) {
  const conditions = [eq(vehicles.status, "published"), eq(vehicles.isListed, true), eq(partners.status, "approved")];

  if (filters.category) conditions.push(eq(vehicles.category, filters.category));
  if (filters.minPricePaise != null) conditions.push(gte(vehicles.dailyRatePaise, filters.minPricePaise));
  if (filters.maxPricePaise != null) conditions.push(lte(vehicles.dailyRatePaise, filters.maxPricePaise));
  if (filters.transmission) conditions.push(eq(vehicles.transmission, filters.transmission));
  if (filters.minSeats != null) conditions.push(gte(vehicles.seatingCapacity, filters.minSeats));

  if (filters.startsAt && filters.endsAt) {
    conditions.push(
      sql`NOT EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.vehicle_id = ${vehicles.id}
          AND b.status IN (${occupyingStatusSql})
          AND b.starts_at < ${filters.endsAt}
          AND b.ends_at > ${filters.startsAt}
      )`
    );
    conditions.push(
      sql`NOT EXISTS (
        SELECT 1 FROM availability_blocks ab
        WHERE ab.vehicle_id = ${vehicles.id}
          AND ab.starts_at < ${filters.endsAt}
          AND ab.ends_at > ${filters.startsAt}
      )`
    );
  }

  const orderBy =
    filters.sort === "price_asc"
      ? asc(vehicles.dailyRatePaise)
      : filters.sort === "price_desc"
        ? desc(vehicles.dailyRatePaise)
        : desc(vehicles.publishedAt);

  const rows = await db
    .select({
      vehicle: vehicles,
      partnerName: partners.businessName,
      partnerStatus: partners.status,
      pickupArea: pickupLocations.area,
    })
    .from(vehicles)
    .innerJoin(partners, eq(vehicles.partnerId, partners.id))
    .leftJoin(pickupLocations, eq(vehicles.pickupLocationId, pickupLocations.id))
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(60);

  if (rows.length === 0) return [];

  const images = await db
    .select()
    .from(vehicleImages)
    .where(
      sql`${vehicleImages.vehicleId} IN (${sql.join(
        rows.map((r) => sql`${r.vehicle.id}`),
        sql`, `
      )})`
    )
    .orderBy(asc(vehicleImages.sortOrder));

  const imagesByVehicle = new Map<string, typeof images>();
  for (const image of images) {
    const list = imagesByVehicle.get(image.vehicleId) ?? [];
    list.push(image);
    imagesByVehicle.set(image.vehicleId, list);
  }

  return rows.map((r) => ({
    ...r,
    images: imagesByVehicle.get(r.vehicle.id) ?? [],
  }));
}

export async function getVehicleBySlug(slug: string) {
  const [row] = await db
    .select({ vehicle: vehicles, partner: partners, pickupLocation: pickupLocations })
    .from(vehicles)
    .innerJoin(partners, eq(vehicles.partnerId, partners.id))
    .leftJoin(pickupLocations, eq(vehicles.pickupLocationId, pickupLocations.id))
    .where(eq(vehicles.slug, slug))
    .limit(1);

  if (!row) return null;

  const images = await db
    .select()
    .from(vehicleImages)
    .where(eq(vehicleImages.vehicleId, row.vehicle.id))
    .orderBy(asc(vehicleImages.sortOrder));

  return { ...row, images };
}

export async function getFeaturedVehicles(limit = 6) {
  return searchVehicles({ sort: "relevance" }).then((rows) => rows.slice(0, limit));
}
