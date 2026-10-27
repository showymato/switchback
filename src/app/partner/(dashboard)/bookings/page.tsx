import { requireRole } from "@/lib/auth";
import { getPartnerForOwner, listPartnerBookings } from "@/server/queries/partners";
import { EmptyState, PageHeader, Row, RowList, StatusBadge } from "@/components/dashboard/ui";
import { formatDateTimeIst } from "@/lib/format";

export default async function PartnerBookingsPage() {
  const user = await requireRole("partner_owner", "partner_staff");
  const partner = await getPartnerForOwner(user.id);
  if (!partner) return null;

  const bookings = await listPartnerBookings(partner.id);

  return (
    <div>
      <PageHeader
        eyebrow={`${bookings.length} total`}
        title="Bookings"
        description="Open a booking to run the documented handover and return inspection."
      />
      {bookings.length === 0 ? (
        <EmptyState title="No bookings yet" body="Once a traveller books one of your published vehicles it will appear here." />
      ) : (
        <RowList>
          {bookings.map(({ booking, vehicle, customer }) => (
            <Row
              key={booking.id}
              href={`/partner/bookings/${booking.id}`}
              title={`${vehicle.make} ${vehicle.model} · ${customer.fullName}`}
              meta={`${formatDateTimeIst(booking.startsAt)} → ${formatDateTimeIst(booking.endsAt)}`}
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
