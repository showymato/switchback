import type { MetadataRoute } from "next";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const STATIC_ROUTES = [
  "",
  "/vehicles",
  "/motorcycles",
  "/scooters",
  "/cars",
  "/suvs",
  "/how-it-works",
  "/rental-requirements",
  "/safety",
  "/about",
  "/contact",
  "/help",
  "/terms",
  "/privacy",
  "/cancellation-policy",
  "/partner",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.6,
  }));

  const publishedVehicles = await db
    .select({ slug: vehicles.slug, updatedAt: vehicles.updatedAt })
    .from(vehicles)
    .where(and(eq(vehicles.status, "published"), eq(vehicles.isListed, true)));

  const vehicleEntries: MetadataRoute.Sitemap = publishedVehicles.map((v) => ({
    url: `${base}/vehicles/${v.slug}`,
    lastModified: v.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticEntries, ...vehicleEntries];
}
