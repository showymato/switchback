import { ViewTransition } from "react";
import Link from "next/link";
import { BadgeCheck, Fuel, Gauge, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { VehicleImage } from "./VehicleImage";
import { formatPaise, titleCase } from "@/lib/format";
import type { PartnerStatus, Vehicle, VehicleCategory } from "@/db/schema";

export interface VehicleCardData {
  vehicle: Vehicle;
  partnerName: string;
  partnerStatus: PartnerStatus;
  pickupArea: string | null;
  images: { fileKey: string }[];
}

export function VehicleCard({ data }: { data: VehicleCardData }) {
  const { vehicle, partnerName, pickupArea, images } = data;

  return (
    <Link
      href={`/vehicles/${vehicle.slug}`}
      className="group block transition-transform duration-300 ease-out hover:-translate-y-1"
    >
      {/* Shared-element morph: this image and the matching one on the detail page
          (src/app/(site)/vehicles/[slug]/page.tsx) share a ViewTransition name, so the
          browser animates the card photo directly into the detail hero on navigation —
          native React/Next, no animation library. Falls back to a normal navigation in
          browsers without View Transitions support (Safari/Firefox on older versions). */}
      <ViewTransition name={`vehicle-photo-${vehicle.id}`}>
        <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-muted shadow-sm transition-shadow duration-300 group-hover:shadow-xl">
          <VehicleImage
            fileKey={images[0]?.fileKey}
            category={vehicle.category as VehicleCategory}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />
          <Badge className="absolute left-3 top-3 border-none bg-background/90 text-foreground backdrop-blur-sm" variant="secondary">
            {titleCase(vehicle.category)}
          </Badge>

          {/* The "switchback" mark: a hairpin-turn chevron that draws itself in on hover —
              a quiet, recurring reference to the brand's namesake rather than a generic arrow. */}
          <svg
            viewBox="0 0 28 28"
            className="absolute bottom-3 right-3 h-7 w-7 text-background opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            aria-hidden
          >
            <circle cx="14" cy="14" r="13" className="fill-foreground/80" />
            <path
              d="M9 18 L9 13 L15 13 L15 9 L19 9"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray="1"
              className="origin-center [stroke-dashoffset:1] transition-[stroke-dashoffset] duration-500 ease-out group-hover:[stroke-dashoffset:0]"
            />
            <path d="M19 6.5 L19 9 L16.5 9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </ViewTransition>

      <div className="space-y-2.5 pt-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading text-lg leading-tight text-foreground">
            {vehicle.make} {vehicle.model}
            {vehicle.year && <span className="ml-1.5 text-sm font-sans text-muted-foreground">{vehicle.year}</span>}
          </h3>
          <div className="shrink-0 text-right">
            <div className="font-heading text-lg text-foreground transition-colors duration-300 group-hover:text-accent">
              {formatPaise(vehicle.dailyRatePaise)}
            </div>
            <div className="text-[11px] text-muted-foreground">per day</div>
          </div>
        </div>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <BadgeCheck className="h-3.5 w-3.5 text-primary" />
          {partnerName}
          {pickupArea ? ` · ${pickupArea}` : ""}
        </p>

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {vehicle.transmission && (
            <span className="flex items-center gap-1">
              <Gauge className="h-3.5 w-3.5" /> {titleCase(vehicle.transmission)}
            </span>
          )}
          {vehicle.seatingCapacity && (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {vehicle.seatingCapacity} seats
            </span>
          )}
          {vehicle.fuelType && (
            <span className="flex items-center gap-1">
              <Fuel className="h-3.5 w-3.5" /> {titleCase(vehicle.fuelType)}
            </span>
          )}
        </div>

        <p className="border-t border-border pt-2.5 text-xs text-muted-foreground">
          Refundable deposit {formatPaise(vehicle.securityDepositPaise)}
        </p>
      </div>
    </Link>
  );
}
