import { listPartnersForAdmin } from "@/server/queries/admin";
import { EmptyState, PageHeader, Row, RowList, StatusBadge } from "@/components/dashboard/ui";

export default async function AdminPartnersPage() {
  const partnersList = await listPartnersForAdmin();
  const pending = partnersList.filter((p) => p.status === "submitted" || p.status === "under_review").length;

  return (
    <div>
      <PageHeader
        eyebrow={`${partnersList.length} partners · ${pending} pending`}
        title="Partners"
        description="Review business details and licensing before a partner can publish vehicles."
      />
      {partnersList.length === 0 ? (
        <EmptyState title="No partners yet" body="Partner applications will appear here once submitted." />
      ) : (
        <RowList>
          {partnersList.map((p) => (
            <Row
              key={p.id}
              href={`/admin/partners/${p.id}`}
              leading={
                <span className="hidden size-10 shrink-0 items-center justify-center rounded-[3px] bg-dust font-mono text-xs text-navy sm:flex">
                  {p.businessName.slice(0, 2).toUpperCase()}
                </span>
              }
              title={p.businessName}
              meta={p.contactEmail}
              aside={<StatusBadge status={p.status} />}
            />
          ))}
        </RowList>
      )}
    </div>
  );
}
