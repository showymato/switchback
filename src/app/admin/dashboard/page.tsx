import { getAdminDashboardMetrics } from "@/server/queries/admin";
import { formatPaise } from "@/lib/format";
import { PageHeader, Panel, PanelLink, StatCard, StatGrid } from "@/components/dashboard/ui";

export default async function AdminDashboardPage() {
  const m = await getAdminDashboardMetrics();

  const mix = [
    { label: "Active / confirmed", value: Number(m.bookings.confirmed), color: "bg-navy" },
    { label: "Completed", value: Number(m.bookings.completed), color: "bg-success" },
    { label: "Cancelled / expired", value: Number(m.bookings.cancelled), color: "bg-steel" },
    { label: "Disputed", value: Number(m.bookings.disputed), color: "bg-orange" },
  ];
  const mixTotal = mix.reduce((sum, s) => sum + s.value, 0);

  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Operations dashboard"
        description="All figures are computed live from the database. Nothing on this page is hardcoded demo data."
      />

      <div className="technical-label mb-2 text-muted-foreground">Money</div>
      <StatGrid className="mb-6">
        <StatCard index={1} label="GMV (confirmed+)" value={formatPaise(m.gmvPaise)} tone="navy" />
        <StatCard index={2} label="Commission revenue" value={formatPaise(m.commissionPaise)} tone="orange" delay={0.04} />
        <StatCard
          index={3}
          label="Pending refunds"
          value={m.pendingRefunds.count}
          hint={formatPaise(m.pendingRefunds.totalPaise)}
          href="/admin/refunds"
          delay={0.08}
        />
        <StatCard index={4} label="Payment failures" value={m.paymentFailures} delay={0.12} />
      </StatGrid>

      <div className="grid gap-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel title="Booking mix" eyebrow={`${m.bookings.total} bookings total`} action={<PanelLink href="/admin/bookings">View all</PanelLink>}>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-dust">
            {mixTotal > 0 &&
              mix.map((s) => (
                <div key={s.label} className={`${s.color} h-full`} style={{ width: `${(s.value / mixTotal) * 100}%` }} title={`${s.label}: ${s.value}`} />
              ))}
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5">
            {mix.map((s) => (
              <div key={s.label}>
                <dt className="technical-label flex items-center gap-2 text-muted-foreground">
                  <span className={`size-2 rounded-full ${s.color}`} />
                  {s.label}
                </dt>
                <dd className="font-heading mt-1.5 text-2xl tabular-nums">{s.value}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <div className="grid gap-1">
          <StatCard
            label="Partners"
            value={`${m.partners.approved} approved`}
            hint={`${m.partners.pending} waiting for review`}
            href="/admin/partners"
            delay={0.06}
          />
          <StatCard
            label="Vehicles"
            value={`${m.vehicles.published} live`}
            hint={`${m.vehicles.pending} waiting for review`}
            href="/admin/vehicles"
            delay={0.1}
          />
        </div>
      </div>
    </div>
  );
}
