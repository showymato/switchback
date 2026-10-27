import { notFound } from "next/navigation";
import { getPartnerDetailForAdmin } from "@/server/queries/admin";
import { Separator } from "@/components/ui/separator";
import { ApprovePartnerButton, RejectPartnerForm, SuspendPartnerForm } from "@/components/admin/PartnerActions";
import { DetailGrid, EmptyState, PageHeader, Panel, Row, StatusBadge } from "@/components/dashboard/ui";

export default async function AdminPartnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getPartnerDetailForAdmin(id);
  if (!detail) notFound();
  const { partner, owner, vehicles } = detail;

  return (
    <div>
      <PageHeader eyebrow="Partner" title={partner.businessName} status={partner.status} description={`${partner.city} · owned by ${owner?.fullName ?? "unknown"}`} />

      <div className="grid gap-1 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-1">
          <Panel title="Business details" eyebrow="Verification">
            <DetailGrid
              items={[
                { label: "Owner", value: owner?.fullName ?? "—" },
                { label: "Contact", value: `${partner.contactEmail} · ${partner.contactPhone}` },
                { label: "Address", value: `${partner.addressLine1}, ${partner.city}` },
                { label: "GSTIN / PAN", value: `${partner.gstin || "—"} / ${partner.panNumber || "—"}` },
                { label: "Rent-a-vehicle scheme licence", value: partner.rentalSchemeLicenceNumber || "Not provided" },
                { label: "Commission", value: `${(partner.commissionBps / 100).toFixed(1)}%` },
              ]}
            />
          </Panel>

          {vehicles.length === 0 ? (
            <EmptyState title="No vehicles listed" body="This partner hasn't submitted any vehicles yet." />
          ) : (
            <Panel title="Vehicles" eyebrow={`${vehicles.length} listed`} bodyClassName="p-0" delay={0.05}>
              {vehicles.map((v) => (
                <Row key={v.id} href={`/admin/vehicles/${v.id}`} title={`${v.make} ${v.model}`} aside={<StatusBadge status={v.status} />} />
              ))}
            </Panel>
          )}
        </div>

        <div className="space-y-1">
          {partner.status !== "approved" && partner.status !== "suspended" && (
            <Panel title="Review decision" eyebrow="Action required" delay={0.04} className="border-t-[3px] border-orange">
              <div className="space-y-4">
                <ApprovePartnerButton partnerId={partner.id} />
                <Separator />
                <RejectPartnerForm partnerId={partner.id} />
              </div>
            </Panel>
          )}
          {partner.status === "approved" && (
            <Panel title="Suspend partner" eyebrow="Enforcement" delay={0.04}>
              <SuspendPartnerForm partnerId={partner.id} />
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
