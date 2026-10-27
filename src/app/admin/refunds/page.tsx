import { listPendingRefundsForAdmin } from "@/server/queries/admin";
import { formatPaise } from "@/lib/format";
import { ProcessRefundButton } from "@/components/admin/ProcessRefundButton";
import { EmptyState, PageHeader, Row, RowList, StatusBadge } from "@/components/dashboard/ui";

export default async function AdminRefundsPage() {
  const items = await listPendingRefundsForAdmin();
  const total = items.reduce((sum, { refund }) => sum + refund.amountPaise, 0);

  return (
    <div>
      <PageHeader
        eyebrow={`${items.length} pending · ${formatPaise(total)}`}
        title="Refunds"
        description="Refunds waiting to be processed back to travellers."
      />
      {items.length === 0 ? (
        <EmptyState title="No pending refunds" body="You're all caught up." />
      ) : (
        <RowList>
          {items.map(({ refund, booking, vehicle }) => (
            <Row
              key={refund.id}
              title={`${booking.reference} · ${vehicle.make} ${vehicle.model}`}
              meta={
                <span className="inline-flex flex-wrap items-center gap-2">
                  <StatusBadge status={refund.status} />
                  {refund.reason}
                </span>
              }
              aside={
                <>
                  <span className="font-heading text-lg tabular-nums">{formatPaise(refund.amountPaise)}</span>
                  <ProcessRefundButton refundId={refund.id} />
                </>
              }
            />
          ))}
        </RowList>
      )}
    </div>
  );
}
