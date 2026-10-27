import type { Metadata } from "next";
import { ViewTransition } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BadgeCheck, Fuel, Gauge, MapPin, ShieldCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { VehicleImage } from "@/components/vehicles/VehicleImage";
import { BookingForm } from "@/components/vehicles/BookingForm";
import { getVehicleBySlug } from "@/server/queries/vehicles";
import { Reveal } from "@/components/motion/Reveal";
import { getCurrentUser } from "@/lib/auth";
import { formatPaise, titleCase } from "@/lib/format";
import { DEFAULT_CANCELLATION_POLICY } from "@/server/services/pricing";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getVehicleBySlug(slug);
  if (!result) return { title: "Vehicle not found" };
  return {
    title: `${result.vehicle.make} ${result.vehicle.model} rental — ${result.partner.businessName}`,
    description: result.vehicle.description ?? undefined,
  };
}

export default async function VehicleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getVehicleBySlug(slug);
  if (!result) notFound();

  const { vehicle, partner, pickupLocation, images } = result;
  const user = await getCurrentUser();
  const vehicleReviews = await db.select().from(reviews).where(eq(reviews.vehicleId, vehicle.id));
  const avgRating =
    vehicleReviews.length > 0 ? vehicleReviews.reduce((sum, r) => sum + r.rating, 0) / vehicleReviews.length : null;

  const bookable = vehicle.status === "published" && vehicle.isListed && partner.status === "approved";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${vehicle.make} ${vehicle.model}`,
    category: titleCase(vehicle.category),
    description: vehicle.description ?? undefined,
    offers: {
      "@type": "Offer",
      price: (vehicle.dailyRatePaise / 100).toFixed(2),
      priceCurrency: "INR",
      availability: bookable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(avgRating != null
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: avgRating.toFixed(1),
            reviewCount: vehicleReviews.length,
          },
        }
      : {}),
  };

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <Link
            href="/vehicles"
            className="link-underline mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to results
          </Link>
          {/* Shared-element morph: same ViewTransition name as the card this was opened
              from (src/components/vehicles/VehicleCard.tsx) — the browser animates the
              card photo directly into this hero on navigation. No extra CSS required for
              the morph itself; works in Chromium/Safari/Firefox that support the View
              Transitions API, degrades to a normal navigation elsewhere. */}
          <ViewTransition name={`vehicle-photo-${vehicle.id}`}>
            <div className="aspect-[16/10] overflow-hidden rounded-sm bg-muted">
              <VehicleImage fileKey={images[0]?.fileKey} category={vehicle.category} className="h-full w-full object-cover" />
            </div>
          </ViewTransition>
          {images.length > 1 && (
            <div className="mt-2 grid grid-cols-4 gap-2">
              {images.slice(1, 5).map((img) => (
                <div key={img.id} className="aspect-[4/3] overflow-hidden rounded-sm bg-muted">
                  <VehicleImage fileKey={img.fileKey} category={vehicle.category} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}

          <Reveal className="mt-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <Badge variant="secondary">{titleCase(vehicle.category)}</Badge>
              <h1 className="mt-2 font-heading text-3xl text-foreground">
                {vehicle.make} {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ""}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <BadgeCheck className="h-4 w-4 text-primary" />
                Listed by {partner.businessName}
                {partner.status === "approved" && " — verified partner"}
              </p>
            </div>
            {avgRating != null && (
              <div className="rounded-md border border-border px-3 py-2 text-sm">
                <span className="font-heading text-lg">{avgRating.toFixed(1)}</span>
                <span className="text-muted-foreground"> / 5 ({vehicleReviews.length} review{vehicleReviews.length === 1 ? "" : "s"})</span>
              </div>
            )}
          </Reveal>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {vehicle.transmission && (
              <span className="flex items-center gap-1.5">
                <Gauge className="h-4 w-4" /> {titleCase(vehicle.transmission)}
              </span>
            )}
            {vehicle.seatingCapacity && (
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" /> {vehicle.seatingCapacity} seats
              </span>
            )}
            {vehicle.fuelType && (
              <span className="flex items-center gap-1.5">
                <Fuel className="h-4 w-4" /> {titleCase(vehicle.fuelType)}
              </span>
            )}
            {pickupLocation && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> {pickupLocation.area}
              </span>
            )}
          </div>

          {vehicle.description && <p className="mt-6 text-foreground/90">{vehicle.description}</p>}

          {vehicle.features.length > 0 && (
            <div className="mt-6">
              <h2 className="font-medium text-foreground">Features</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {vehicle.features.map((f) => (
                  <Badge key={f} variant="outline">
                    {f}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator className="my-8" />

          <Reveal><h2 className="font-medium text-foreground">Rental conditions</h2></Reveal>
          <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-sm border border-border bg-card p-3">
              <dt className="text-muted-foreground">Refundable deposit</dt>
              <dd className="font-medium text-foreground">{formatPaise(vehicle.securityDepositPaise)}</dd>
            </div>
            <div className="rounded-sm border border-border bg-card p-3">
              <dt className="text-muted-foreground">Minimum rental</dt>
              <dd className="font-medium text-foreground">{vehicle.minRentalHours} hours</dd>
            </div>
            {vehicle.includedKmPerDay != null && (
              <div className="rounded-sm border border-border bg-card p-3">
                <dt className="text-muted-foreground">Included mileage</dt>
                <dd className="font-medium text-foreground">
                  {vehicle.includedKmPerDay} km/day
                  {vehicle.extraKmRatePaise ? ` · ${formatPaise(vehicle.extraKmRatePaise)}/km after` : ""}
                </dd>
              </div>
            )}
            {vehicle.deliveryChargePaise > 0 && (
              <div className="rounded-sm border border-border bg-card p-3">
                <dt className="text-muted-foreground">Hotel delivery / airport pickup</dt>
                <dd className="font-medium text-foreground">+{formatPaise(vehicle.deliveryChargePaise)}</dd>
              </div>
            )}
          </dl>

          {vehicle.eligibilityRequirements.length > 0 && (
            <div className="mt-6">
              <h2 className="flex items-center gap-1.5 font-medium text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" /> Driver eligibility
              </h2>
              <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
                {vehicle.eligibilityRequirements.map((req) => (
                  <li key={req}>{req}</li>
                ))}
              </ul>
            </div>
          )}

          <Separator className="my-8" />

          <h2 className="font-medium text-foreground">Cancellation policy</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Free cancellation up to {DEFAULT_CANCELLATION_POLICY.freeCancellationHours} hours before pickup.
            Cancelling between {DEFAULT_CANCELLATION_POLICY.partialRefundCutoffHours} and{" "}
            {DEFAULT_CANCELLATION_POLICY.freeCancellationHours} hours before pickup refunds{" "}
            {DEFAULT_CANCELLATION_POLICY.partialRefundPercent}% of the rental fee. Inside{" "}
            {DEFAULT_CANCELLATION_POLICY.partialRefundCutoffHours} hours, the rental fee is non-refundable. The
            security deposit is always fully refunded on a pre-pickup cancellation. See{" "}
            <Link href="/cancellation-policy" className="underline">
              full cancellation policy
            </Link>
            .
          </p>

          <Separator className="my-8" />

          <h2 className="font-medium text-foreground">Reviews</h2>
          {vehicleReviews.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No reviews yet for this vehicle.</p>
          ) : (
            <div className="mt-3 space-y-4">
              {vehicleReviews.map((r) => (
                <div key={r.id} className="rounded-md border border-border p-3 text-sm">
                  <div className="font-medium text-foreground">{r.rating} / 5</div>
                  {r.comment && <p className="mt-1 text-muted-foreground">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}

          <Separator className="my-8" />

          <h2 className="font-medium text-foreground">Frequently asked questions</h2>
          <Accordion className="mt-2">
            <AccordionItem value="docs">
              <AccordionTrigger>What do I need to bring at pickup?</AccordionTrigger>
              <AccordionContent>
                Your original driving licence, a government photo ID, and the booking reference shown in your
                account after payment.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="deposit">
              <AccordionTrigger>When is the deposit returned?</AccordionTrigger>
              <AccordionContent>
                After the return inspection confirms the vehicle&apos;s condition, typically within a few hours, minus
                any confirmed additional charges you&apos;ve been shown evidence for.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <Reveal delay={0.1}>
          <div className="sticky top-24 rounded-sm border border-border bg-card p-5 shadow-sm">
            <div className="font-heading text-2xl text-foreground">{formatPaise(vehicle.dailyRatePaise)}</div>
            <div className="text-sm text-muted-foreground">per day{vehicle.hourlyRatePaise ? ` · ${formatPaise(vehicle.hourlyRatePaise)}/hour` : ""}</div>

            {!bookable ? (
              <p className="mt-4 rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
                This vehicle is not currently open for booking.
              </p>
            ) : !user ? (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-muted-foreground">Log in or create an account to book this vehicle.</p>
                <Link
                  href={`/login?next=/vehicles/${vehicle.slug}`}
                  className="block w-full rounded-md bg-primary py-2 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Log in to book
                </Link>
              </div>
            ) : user.role !== "customer" ? (
              <p className="mt-4 rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
                Bookings are made from a customer account.
              </p>
            ) : (
              <div className="mt-4">
                <BookingForm vehicleSlug={vehicle.slug} minRentalHours={vehicle.minRentalHours} deliveryAvailable={vehicle.deliveryChargePaise > 0} />
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </div>
    </>
  );
}
