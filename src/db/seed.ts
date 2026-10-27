import { config } from "dotenv";
config({ path: ".env.local" });

import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq } from "drizzle-orm";
import ws from "ws";
import bcrypt from "bcryptjs";
import * as schema from "./schema";

neonConfig.webSocketConstructor = ws;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  const passwordHash = await bcrypt.hash("Passw0rd!123", 10);

  console.log("Seeding admin user...");
  const adminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL || "admin@switchback.test";
  const [admin] = await db
    .insert(schema.users)
    .values({
      email: adminEmail,
      passwordHash,
      fullName: "Switchback Admin",
      role: "super_admin",
      phone: "+919800000001",
      emailVerifiedAt: new Date(),
    })
    .onConflictDoNothing({ target: schema.users.email })
    .returning();

  console.log("Seeding demo customer...");
  const [customer] = await db
    .insert(schema.users)
    .values({
      email: "customer@switchback.test",
      passwordHash,
      fullName: "Riya Sharma",
      role: "customer",
      phone: "+919800000002",
      emailVerifiedAt: new Date(),
    })
    .onConflictDoNothing({ target: schema.users.email })
    .returning();
  if (customer) {
    await db.insert(schema.customerProfiles).values({ userId: customer.id }).onConflictDoNothing();
  }

  console.log("Seeding partner owners + partners...");
  const partnerSeeds = [
    {
      ownerEmail: "ridgeline@switchback.test",
      ownerName: "Tenzin Dorje",
      businessName: "Ridgeline Rentals",
      commissionBps: 1500,
      locationName: "Ridgeline Counter — Old Manali",
      area: "Old Manali",
    },
    {
      ownerEmail: "highpass@switchback.test",
      ownerName: "Karan Thakur",
      businessName: "High Pass Motors",
      commissionBps: 1500,
      locationName: "High Pass Counter — Mall Road",
      area: "Mall Road",
    },
  ];

  const partnerRecords: { id: string; pickupLocationId: string; businessName: string }[] = [];

  for (const seed of partnerSeeds) {
    const [owner] = await db
      .insert(schema.users)
      .values({
        email: seed.ownerEmail,
        passwordHash,
        fullName: seed.ownerName,
        role: "partner_owner",
        phone: "+919800000099",
        emailVerifiedAt: new Date(),
      })
      .onConflictDoNothing({ target: schema.users.email })
      .returning();

    const existingOwner =
      owner ?? (await db.select().from(schema.users).where(eq(schema.users.email, seed.ownerEmail)))[0];

    const existingPartner = await db
      .select()
      .from(schema.partners)
      .where(eq(schema.partners.businessName, seed.businessName));

    let partner = existingPartner[0];
    if (!partner) {
      [partner] = await db
        .insert(schema.partners)
        .values({
          ownerUserId: existingOwner.id,
          businessName: seed.businessName,
          legalEntityName: `${seed.businessName} Pvt. Ltd.`,
          contactPhone: "+919800000099",
          contactEmail: seed.ownerEmail,
          addressLine1: seed.area,
          city: "Manali",
          state: "Himachal Pradesh",
          gstin: "02ABCDE1234F1Z5",
          panNumber: "ABCDE1234F",
          rentalSchemeLicenceNumber: "HP-RMS-0000",
          commissionBps: seed.commissionBps,
          status: "approved",
          approvedAt: new Date(),
          approvedByUserId: admin?.id,
          policyAgreedAt: new Date(),
        })
        .returning();
    }

    const existingLocation = await db
      .select()
      .from(schema.pickupLocations)
      .where(eq(schema.pickupLocations.partnerId, partner.id));

    let location = existingLocation[0];
    if (!location) {
      [location] = await db
        .insert(schema.pickupLocations)
        .values({
          partnerId: partner.id,
          name: seed.locationName,
          addressLine: `${seed.area}, Manali, Himachal Pradesh`,
          area: seed.area,
          openingTime: "07:30",
          closingTime: "20:30",
        })
        .returning();
    }

    partnerRecords.push({ id: partner.id, pickupLocationId: location.id, businessName: partner.businessName });
  }

  console.log("Seeding vehicles...");
  const vehicleSeeds = [
    {
      partner: 0,
      category: "motorcycle" as const,
      make: "Royal Enfield",
      model: "Himalayan 450",
      year: 2025,
      transmission: "manual" as const,
      fuelType: "petrol" as const,
      seatingCapacity: 2,
      engineCc: 452,
      registrationNumber: "HP65-AB-1001",
      dailyRatePaise: 180000,
      hourlyRatePaise: 15000,
      securityDepositPaise: 500000,
      includedKmPerDay: 150,
      extraKmRatePaise: 800,
      description:
        "Purpose-built adventure tourer for the Manali–Leh corridor. Comes with pannier mounts, crash guards, and full riding gear sized to the rider on request.",
      features: ["ABS", "Pannier mounts", "Full gear included", "Long-range fuel tank"],
      eligibilityRequirements: ["Valid motorcycle licence held 1+ year", "Minimum age 21"],
    },
    {
      partner: 0,
      category: "motorcycle" as const,
      make: "Royal Enfield",
      model: "Classic 350",
      year: 2024,
      transmission: "manual" as const,
      fuelType: "petrol" as const,
      seatingCapacity: 2,
      engineCc: 349,
      registrationNumber: "HP65-AB-1002",
      dailyRatePaise: 140000,
      hourlyRatePaise: 12000,
      securityDepositPaise: 400000,
      includedKmPerDay: 120,
      extraKmRatePaise: 700,
      description: "The classic choice for valley rides — Solang, Naggar, Jana Falls — comfortable for full-day loops.",
      features: ["Comfortable seat", "Dual-channel ABS"],
      eligibilityRequirements: ["Valid motorcycle licence held 1+ year", "Minimum age 20"],
    },
    {
      partner: 1,
      category: "scooter" as const,
      make: "TVS",
      model: "Jupiter 125",
      year: 2024,
      transmission: "automatic" as const,
      fuelType: "petrol" as const,
      seatingCapacity: 2,
      engineCc: 125,
      registrationNumber: "HP65-CD-2001",
      dailyRatePaise: 80000,
      hourlyRatePaise: 7000,
      securityDepositPaise: 200000,
      includedKmPerDay: 100,
      extraKmRatePaise: 500,
      description: "Easy, automatic, and nimble for Mall Road and short valley hops. No gear-shifting experience needed.",
      features: ["Automatic", "Under-seat storage", "USB charging port"],
      eligibilityRequirements: ["Valid two-wheeler licence", "Minimum age 18"],
    },
    {
      partner: 1,
      category: "car" as const,
      make: "Maruti Suzuki",
      model: "Swift",
      year: 2024,
      transmission: "manual" as const,
      fuelType: "petrol" as const,
      seatingCapacity: 5,
      registrationNumber: "HP65-EF-3001",
      dailyRatePaise: 220000,
      securityDepositPaise: 1000000,
      includedKmPerDay: 200,
      extraKmRatePaise: 1000,
      deliveryChargePaise: 30000,
      description: "A practical, fuel-efficient hatchback for day trips to Solang Valley, Naggar Castle, and Kullu.",
      features: ["AC", "Bluetooth audio", "Power steering"],
      eligibilityRequirements: ["Valid LMV driving licence held 1+ year", "Minimum age 21"],
    },
    {
      partner: 1,
      category: "suv" as const,
      make: "Mahindra",
      model: "Thar",
      year: 2025,
      transmission: "manual" as const,
      fuelType: "diesel" as const,
      seatingCapacity: 4,
      registrationNumber: "HP65-EF-3002",
      dailyRatePaise: 380000,
      securityDepositPaise: 2000000,
      includedKmPerDay: 200,
      extraKmRatePaise: 1500,
      deliveryChargePaise: 50000,
      description: "4x4 capability for Rohtang and Atal Tunnel approach roads in-season, subject to current road and permit conditions.",
      features: ["4x4", "Hill-hold assist", "High ground clearance"],
      eligibilityRequirements: [
        "Valid LMV driving licence held 2+ years",
        "Minimum age 23",
        "Comfort with manual transmission off-camber driving",
      ],
    },
  ];

  for (const v of vehicleSeeds) {
    const partner = partnerRecords[v.partner];
    const slug = `${v.make}-${v.model}-${v.registrationNumber}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const existing = await db.select().from(schema.vehicles).where(eq(schema.vehicles.slug, slug));
    if (existing[0]) continue;

    await db.insert(schema.vehicles).values({
      partnerId: partner.id,
      pickupLocationId: partner.pickupLocationId,
      slug,
      category: v.category,
      make: v.make,
      model: v.model,
      year: v.year,
      transmission: v.transmission,
      fuelType: v.fuelType,
      seatingCapacity: v.seatingCapacity,
      engineCc: "engineCc" in v ? v.engineCc : undefined,
      registrationNumber: v.registrationNumber,
      pickupMethods: ["partner_counter", "hotel_delivery"],
      dailyRatePaise: v.dailyRatePaise,
      hourlyRatePaise: "hourlyRatePaise" in v ? v.hourlyRatePaise : undefined,
      securityDepositPaise: v.securityDepositPaise,
      includedKmPerDay: v.includedKmPerDay,
      extraKmRatePaise: v.extraKmRatePaise,
      deliveryChargePaise: "deliveryChargePaise" in v ? v.deliveryChargePaise : 0,
      minRentalHours: v.category === "motorcycle" || v.category === "scooter" ? 4 : 24,
      description: v.description,
      features: v.features,
      eligibilityRequirements: v.eligibilityRequirements,
      status: "published",
      isListed: true,
      publishedAt: new Date(),
      reviewedByUserId: admin?.id,
    });
  }

  console.log("Seed complete.");
  await pool.end();
}


main().catch((err) => {
  console.error(err);
  process.exit(1);
});
