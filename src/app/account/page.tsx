import Image from "next/image";
import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listBookingsForCustomer } from "@/server/queries/bookings";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/Reveal";
import { EmptyState, Eyebrow, Panel, PanelLink, Row, StatCard, StatGrid, StatusBadge } from "@/components/dashboard/ui";
import { formatDateTimeIst } from "@/lib/format";

const UPCOMING_STATUSES = ["pending_checkout", "awaiting_payment", "confirmed", "pickup_in_progress", "active"];

export default async function AccountOverviewPage() {
  const user = await requireUser();
  const bookings = await listBookingsForCustomer(user.id);
  const upcoming = bookings.filter((b) => UPCOMING_STATUSES.includes(b.booking.status));
  const completed = bookings.filter((b) => b.booking.status === "completed").length;
  const next = upcoming[0];

  return (
    <div className="space-y-1">
      {/* ------------------------------------------------------------ welcome */}
      <Reveal className="relative mb-6 overflow-hidden rounded-[6px] bg-navy text-white">
        <Image
          src="/images/hero-himalaya.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 900px, 100vw"
          className="object-cover object-[70%_45%] opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-navy/10" />
        <div className="relative flex min-h-[260px] flex-col justify-between gap-8 p-6 sm:p-8">
          <Eyebrow>Traveller account</Eyebrow>
          <div>
            <h1 className="font-heading max-w-xl text-[clamp(2rem,1.5rem+2vw,3.25rem)] leading-[0.98]">
              Welcome back, {user.fullName.split(" ")[0]}.
            </h1>
            <p className="mt-3 max-w-md text-sm text-white/70">
              {next
                ? `Your next ride: ${next.vehicle.make} ${next.vehicle.model}, ${formatDateTimeIst(next.booking.startsAt)}.`
                : "No trips on the calendar yet. The road always asks for one more turn."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button render={<Link href="/vehicles" />} nativeButton={false} variant="accent" size="lg">
              Find a ride
            </Button>
            <Button
              render={<Link href="/account/bookings" />}
              nativeButton={false}
              size="lg"
              className="bg-white/10 text-white hover:bg-white/20"
            >
              My bookings
            </Button>
          </div>
        </div>
      </Reveal>

      <StatGrid className="mb-6">
        <StatCard index={1} label="Total bookings" value={bookings.length} href="/account/bookings" />
        <StatCard index={2} label="Upcoming" value={upcoming.length} tone="navy" delay={0.04} />
        <StatCard index={3} label="Completed trips" value={completed} delay={0.08} />
        <StatCard index={4} label="Need help?" value="Support" hint="Open a case from any booking" href="/account/support" tone="orange" delay={0.12} />
      </StatGrid>

      {upcoming.length === 0 ? (
        <EmptyState
          title="No upcoming bookings yet"
          body="Browse verified motorcycles, scooters, cars and SUVs from local partners in Manali."
          action={
            <Button render={<Link href="/vehicles" />} nativeButton={false}>
              Browse vehicles
            </Button>
          }
        />
      ) : (
        <Panel title="Upcoming trips" eyebrow={`${upcoming.length} scheduled`} action={<PanelLink href="/account/bookings">View all</PanelLink>} bodyClassName="p-0">
          {upcoming.map(({ booking, vehicle, partner }) => (
            <Row
              key={booking.id}
              href={booking.status === "pending_checkout" || booking.status === "awaiting_payment" ? `/checkout/${booking.id}` : `/account/bookings/${booking.id}`}
              leading={
                <span className="hidden size-10 shrink-0 items-center justify-center rounded-[3px] bg-dust text-navy sm:flex">
                  <CalendarClock className="size-4" strokeWidth={1.75} />
                </span>
              }
              title={`${vehicle.make} ${vehicle.model}`}
              meta={`${partner.businessName} · ${formatDateTimeIst(booking.startsAt)}`}
              aside={<StatusBadge status={booking.status} />}
            />
          ))}
        </Panel>
      )}
    </div>
  );
}
