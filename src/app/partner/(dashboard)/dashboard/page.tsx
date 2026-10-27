import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getPartnerForOwner, listPartnerBookings, listPartnerVehicles, getPartnerLedgerSummary } from "@/server/queries/partners";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, Panel, PanelLink, Row, StatCard, StatGrid, StatusBadge } from "@/components/dashboard/ui";
import { formatDateTimeIst, formatPaise } from "@/lib/format";

export default async function PartnerDashboardPage() {
  const user = await requireRole("partner_owner", "partner_staff");
  const partner = await getPartnerForOwner(user.id);
  if (!partner) return null;

  const vehicles = await listPartnerVehicles(partner.id);
  const bookings = await listPartnerBookings(partner.id);
  const { balance } = await getPartnerLedgerSummary(partner.id);

  const publishedCount = vehicles.filter((v) => v.vehicle.status === "published").length;
  const upcoming = bookings.filter((b) => ["confirmed", "pickup_in_progress", "active"].includes(b.booking.status));
  const completed = bookings.filter((b) => b.booking.status === "completed");
  const cancelled = bookings.filter((b) => ["cancelled", "expired"].includes(b.booking.status));
  const cancellationRate = bookings.length > 0 ? Math.round((cancelled.length / bookings.length) * 100) : 0;
  const fleetShare = vehicles.length > 0 ? Math.round((publishedCount / vehicles.length) * 100) : 0;

  return (
    <div>
      <PageHeader
        eyebrow="Partner dashboard"
        title={partner.businessName}
        status={partner.status}
        description="Your fleet, bookings and ledger at a glance."
        actions={
          <>
            <Button render={<Link href="/partner/bookings" />} nativeButton={false} variant="outline">
              Bookings
            </Button>
            <Button render={<Link href="/partner/vehicles/new" />} nativeButton={false} variant="accent">
              Add vehicle
            </Button>
          </>
        }
      />

      <div className="grid gap-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <StatGrid className="lg:grid-cols-2">
          <StatCard index={1} label="Published vehicles" value={`${publishedCount}/${vehicles.length}`} hint={`${fleetShare}% of your fleet is live`} href="/partner/vehicles" />
          <StatCard index={2} label="Upcoming bookings" value={upcoming.length} tone="navy" delay={0.04} href="/partner/bookings" />
          <StatCard index={3} label="Completed" value={completed.length} delay={0.08} />
          <StatCard index={4} label="Cancellation rate" value={`${cancellationRate}%`} delay={0.12} />
        </StatGrid>
        <StatCard
          label="Ledger balance"
          value={formatPaise(balance)}
          hint="Net of commission, before payout"
          tone="orange"
          href="/partner/earnings"
          delay={0.16}
        />
      </div>

      <div className="mt-6">
        {upcoming.length === 0 ? (
          <EmptyState title="No upcoming bookings" body="Confirmed bookings for your published vehicles will appear here." />
        ) : (
          <Panel title="Upcoming handovers" eyebrow={`${upcoming.length} upcoming`} action={<PanelLink href="/partner/bookings">View all</PanelLink>} bodyClassName="p-0">
            {upcoming.slice(0, 6).map(({ booking, vehicle, customer }) => (
              <Row
                key={booking.id}
                href={`/partner/bookings/${booking.id}`}
                title={`${vehicle.make} ${vehicle.model} · ${customer.fullName}`}
                meta={`${booking.reference} · ${formatDateTimeIst(booking.startsAt)}`}
                aside={<StatusBadge status={booking.status} />}
              />
            ))}
          </Panel>
        )}
      </div>
    </div>
  );
}
