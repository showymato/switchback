import { listOpenDisputesForAdmin } from "@/server/queries/admin";
import { formatDateTimeIst } from "@/lib/format";
import { ResolveDisputeForm } from "@/components/admin/ResolveDisputeForm";
import { EmptyState, PageHeader, Panel } from "@/components/dashboard/ui";

export default async function AdminDisputesPage() {
  const items = await listOpenDisputesForAdmin();

  return (
    <div>
      <PageHeader eyebrow={`${items.length} open`} title="Disputes" description="Review the booking history and resolve each case." />
      {items.length === 0 ? (
        <EmptyState title="No open disputes" body="You're all caught up." />
      ) : (
        <div className="grid gap-1 lg:grid-cols-2">
          {items.map(({ dispute, booking, vehicle, customer }, i) => (
            <Panel
              key={dispute.id}
              eyebrow={`${booking.reference} · raised ${formatDateTimeIst(dispute.createdAt)}`}
              title={`${vehicle.make} ${vehicle.model} · ${customer.fullName}`}
              delay={Math.min(i, 4) * 0.04}
              className="border-t-[3px] border-orange"
            >
              <blockquote className="border-l-2 border-border pl-4 text-sm leading-relaxed text-foreground/85">{dispute.summary}</blockquote>
              <div className="mt-5">
                <ResolveDisputeForm disputeId={dispute.id} />
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
