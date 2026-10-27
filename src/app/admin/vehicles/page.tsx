import { listVehiclesForAdmin } from "@/server/queries/admin";
import { EmptyState, PageHeader, Row, RowList, StatusBadge } from "@/components/dashboard/ui";
import { formatPaise } from "@/lib/format";

export default async function AdminVehiclesPage() {
  const items = await listVehiclesForAdmin();
  const pending = items.filter(({ vehicle }) => vehicle.status === "submitted" || vehicle.status === "under_review").length;

  return (
    <div>
      <PageHeader
        eyebrow={`${items.length} vehicles · ${pending} pending`}
        title="Vehicles"
        description="Every listing is reviewed individually before it can be published."
      />
      {items.length === 0 ? (
        <EmptyState title="No vehicles yet" body="Partner listings will appear here once submitted." />
      ) : (
        <RowList>
          {items.map(({ vehicle, partnerName }) => (
            <Row
              key={vehicle.id}
              href={`/admin/vehicles/${vehicle.id}`}
              title={`${vehicle.make} ${vehicle.model}`}
              meta={`${partnerName} · ${vehicle.registrationNumber}`}
              aside={
                <>
                  <StatusBadge status={vehicle.status} />
                  <span className="technical-label text-muted-foreground">{formatPaise(vehicle.dailyRatePaise)}/day</span>
                </>
              }
            />
          ))}
        </RowList>
      )}
    </div>
  );
}
