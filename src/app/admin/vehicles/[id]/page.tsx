import { notFound } from "next/navigation";
import Link from "next/link";
import { getVehicleDetailForAdmin } from "@/server/queries/admin";
import { Separator } from "@/components/ui/separator";
import { formatPaise, titleCase } from "@/lib/format";
import { ApproveVehicleButton, RejectVehicleForm, SuspendVehicleForm } from "@/components/admin/VehicleActions";
import { DetailGrid, PageHeader, Panel, StatusBadge } from "@/components/dashboard/ui";

export default async function AdminVehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getVehicleDetailForAdmin(id);
  if (!detail) notFound();
  const { vehicle, partner } = detail;
  const inReview = vehicle.status === "submitted" || vehicle.status === "under_review";

  return (
    <div>
      <PageHeader
        eyebrow={`Vehicle · ${vehicle.registrationNumber}`}
        title={`${vehicle.make} ${vehicle.model}`}
        status={vehicle.status}
        description={
          <Link href={`/admin/partners/${partner.id}`} className="inline-flex items-center gap-2 hover:text-orange">
            {partner.businessName} <StatusBadge status={partner.status} />
          </Link>
        }
      />

      <div className="grid gap-1 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Panel title="Listing" eyebrow="Details">
          <DetailGrid
            items={[
              { label: "Registration", value: vehicle.registrationNumber },
              { label: "Category", value: titleCase(vehicle.category) },
              { label: "Daily rate", value: formatPaise(vehicle.dailyRatePaise) },
              { label: "Deposit", value: formatPaise(vehicle.securityDepositPaise) },
            ]}
          />
          {vehicle.description && <p className="mt-6 border-t border-border pt-4 text-sm leading-relaxed text-foreground/85">{vehicle.description}</p>}
        </Panel>

        <div className="space-y-1">
          {inReview && (
            <Panel title="Review decision" eyebrow="Action required" delay={0.04} className="border-t-[3px] border-orange">
              <div className="space-y-4">
                {partner.status !== "approved" ? (
                  <p className="text-sm text-muted-foreground">This vehicle&apos;s partner is not yet approved. Approve the partner first.</p>
                ) : (
                  <ApproveVehicleButton vehicleId={vehicle.id} />
                )}
                <Separator />
                <RejectVehicleForm vehicleId={vehicle.id} />
              </div>
            </Panel>
          )}
          {vehicle.status === "published" && (
            <Panel title="Suspend listing" eyebrow="Enforcement" delay={0.04}>
              <SuspendVehicleForm vehicleId={vehicle.id} />
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
