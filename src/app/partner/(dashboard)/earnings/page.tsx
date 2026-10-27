import { requireRole } from "@/lib/auth";
import { getPartnerForOwner, getPartnerLedgerSummary } from "@/server/queries/partners";
import { formatDateTimeIst, formatPaise, titleCase } from "@/lib/format";
import { EmptyState, PageHeader, Panel, Row, StatCard, StatGrid } from "@/components/dashboard/ui";

export default async function PartnerEarningsPage() {
  const user = await requireRole("partner_owner", "partner_staff");
  const partner = await getPartnerForOwner(user.id);
  if (!partner) return null;

  const { totals, balance, entries } = await getPartnerLedgerSummary(partner.id);

  return (
    <div>
      <PageHeader
        eyebrow="Ledger"
        title="Earnings"
        description="This balance accrues as bookings are paid; it is not yet a scheduled payout. Payout runs are managed by an admin and marked on this ledger when processed."
      />

      <StatGrid className="mb-6">
        <StatCard index={1} label="Net balance" value={formatPaise(balance)} tone="orange" />
        {Object.entries(totals).map(([type, amount], i) => (
          <StatCard key={type} index={i + 2} label={titleCase(type)} value={formatPaise(amount)} delay={(i + 1) * 0.04} />
        ))}
      </StatGrid>

      {entries.length === 0 ? (
        <EmptyState title="No ledger entries yet" body="Entries are added as bookings are paid, refunded or paid out." />
      ) : (
        <Panel title="Ledger entries" eyebrow={`${entries.length} entries`} bodyClassName="p-0">
          {entries.map((e) => (
            <Row
              key={e.id}
              title={e.description}
              meta={`${titleCase(e.type)} · ${formatDateTimeIst(e.createdAt)}`}
              aside={
                <span className={`font-heading text-base tabular-nums ${e.amountPaise < 0 ? "text-destructive" : "text-success"}`}>
                  {e.amountPaise > 0 ? "+" : ""}
                  {formatPaise(e.amountPaise)}
                </span>
              }
            />
          ))}
        </Panel>
      )}
    </div>
  );
}
