import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getPartnerForOwner, listPartnerVehicles } from "@/server/queries/partners";
import { Button } from "@/components/ui/button";
import { VehicleImage } from "@/components/vehicles/VehicleImage";
import { formatPaise, titleCase } from "@/lib/format";
import { MaintenanceBlockForm } from "@/components/partner/MaintenanceBlockForm";
import { Reveal } from "@/components/motion/Reveal";
import { EmptyState, PageHeader, StatusBadge } from "@/components/dashboard/ui";

export default async function PartnerVehiclesPage() {
  const user = await requireRole("partner_owner", "partner_staff");
  const partner = await getPartnerForOwner(user.id);
  if (!partner) return null;

  const items = await listPartnerVehicles(partner.id);

  return (
    <div>
      <PageHeader
        eyebrow={`${items.length} in fleet`}
        title="My vehicles"
        description="Each vehicle is reviewed by an admin before it can be published and booked."
        actions={
          <Button render={<Link href="/partner/vehicles/new" />} nativeButton={false} variant="accent">
            Add vehicle
          </Button>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          title="You haven't added any vehicles yet"
          body="Add your first motorcycle, scooter, car or SUV to start receiving bookings."
          action={
            <Button render={<Link href="/partner/vehicles/new" />} nativeButton={false}>
              Add vehicle
            </Button>
          }
        />
      ) : (
        <div className="grid gap-1 sm:grid-cols-2 xl:grid-cols-3">
          {items.map(({ vehicle, images }, i) => (
            <Reveal key={vehicle.id} delay={Math.min(i, 5) * 0.04} className="group flex flex-col overflow-hidden rounded-[4px] bg-card">
              <div className="relative aspect-[3/2] overflow-hidden bg-dust">
                <VehicleImage
                  fileKey={images[0]?.fileKey}
                  category={vehicle.category}
                  className="h-full w-full object-cover transition-transform duration-1000 ease-[cubic-bezier(.23,1,.32,1)] group-hover:scale-[1.04]"
                />
                <div className="absolute left-2 top-2">
                  <StatusBadge status={vehicle.status} className="bg-white/95 shadow-sm" />
                </div>
                <span className="technical-label absolute right-2 top-2 rounded-[2px] bg-navy/80 px-1.5 py-1 text-white">
                  {titleCase(vehicle.category)}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-foreground">
                      {vehicle.make} {vehicle.model}
                    </div>
                    <div className="technical-label mt-1 text-muted-foreground">
                      {vehicle.registrationNumber} · {vehicle.year}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-heading text-lg leading-none">{formatPaise(vehicle.dailyRatePaise)}</div>
                    <div className="technical-label mt-1 text-muted-foreground">per day</div>
                  </div>
                </div>
                {vehicle.status === "rejected" && vehicle.rejectionReason && (
                  <p className="mt-3 rounded-[3px] bg-danger-soft px-3 py-2 text-sm text-destructive">Rejected: {vehicle.rejectionReason}</p>
                )}
                {vehicle.status === "published" && (
                  <details className="group/details mt-4 border-t border-border pt-3">
                    <summary className="technical-label cursor-pointer list-none text-foreground/70 transition-colors hover:text-orange">
                      + Block dates for maintenance
                    </summary>
                    <div className="mt-3">
                      <MaintenanceBlockForm vehicleId={vehicle.id} />
                    </div>
                  </details>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
