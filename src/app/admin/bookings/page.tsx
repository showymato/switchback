import { listBookingsForAdmin } from "@/server/queries/admin";
import { EmptyState, PageHeader, Row, RowList, StatusBadge } from "@/components/dashboard/ui";
import { formatDateTimeIst } from "@/lib/format";

export default async function AdminBookingsPage() {
  const bookings = await listBookingsForAdmin();

  return (
    <div>
      <PageHeader eyebrow="Latest 100" title="Bookings" description="Most recent bookings across all partners." />
      {bookings.length === 0 ? (
        <EmptyState title="No bookings yet" />
      ) : (
        <RowList>
          {bookings.map(({ booking, vehicle, customer, partner }) => (
            <Row
              key={booking.id}
              title={`${vehicle.make} ${vehicle.model} · ${customer.fullName}`}
              meta={`${partner.businessName} · ${formatDateTimeIst(booking.startsAt)}`}
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
