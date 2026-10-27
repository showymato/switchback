import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { listBookingsForCustomer } from "@/server/queries/bookings";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, Row, RowList, StatusBadge } from "@/components/dashboard/ui";
import { formatDateTimeIst } from "@/lib/format";

export const metadata: Metadata = { title: "My bookings" };

export default async function AccountBookingsPage() {
  const user = await requireUser();
  const bookings = await listBookingsForCustomer(user.id);

  return (
    <div>
      <PageHeader
        eyebrow={`${bookings.length} booking${bookings.length === 1 ? "" : "s"}`}
        title="My bookings"
        description="Every rental you've booked through Switchback, newest first. Open one for pickup details, payments and refunds."
        actions={
          <Button render={<Link href="/vehicles" />} nativeButton={false} variant="accent">
            New booking
          </Button>
        }
      />

      {bookings.length === 0 ? (
        <EmptyState
          title="You haven't made any bookings yet"
          body="When you book a vehicle it'll show up here with its status and receipts."
          action={
            <Button render={<Link href="/vehicles" />} nativeButton={false}>
              Browse vehicles
            </Button>
          }
        />
      ) : (
        <RowList>
          {bookings.map(({ booking, vehicle, partner }) => (
            <Row
              key={booking.id}
              href={booking.status === "pending_checkout" || booking.status === "awaiting_payment" ? `/checkout/${booking.id}` : `/account/bookings/${booking.id}`}
              title={`${vehicle.make} ${vehicle.model}`}
              meta={
                <>
                  {partner.businessName} · {formatDateTimeIst(booking.startsAt)} → {formatDateTimeIst(booking.endsAt)}
                </>
              }
              aside={
                <>
                  <StatusBadge status={booking.status} />
                  <span className="technical-label text-muted-foreground">{booking.reference}</span>
                </>
              }
            />
          ))}
        </RowList>
      )}
    </div>
  );
}
