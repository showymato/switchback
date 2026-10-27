import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getPartnerBookingDetail, getPartnerForOwner } from "@/server/queries/partners";
import { formatDateTimeIst, formatPaise, titleCase } from "@/lib/format";
import { InspectionForm } from "@/components/partner/InspectionForm";
import { DetailGrid, PageHeader, Panel, StatCard } from "@/components/dashboard/ui";

export default async function PartnerBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole("partner_owner", "partner_staff");
  const partner = await getPartnerForOwner(user.id);
  if (!partner) return null;

  const detail = await getPartnerBookingDetail(partner.id, id);
  if (!detail) notFound();

  const { booking, vehicle, customer, snapshot } = detail;
  const showHandover = ["confirmed", "pickup_in_progress"].includes(booking.status);
  const showReturn = ["active", "return_in_progress"].includes(booking.status);

  return (
    <div>
      <PageHeader eyebrow={`Booking ${booking.reference}`} title={`${vehicle.make} ${vehicle.model}`} status={booking.status} description={`Booked by ${customer.fullName}`} />

      <div className="grid gap-1 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-1">
          <Panel title="Rental details" eyebrow="Customer & schedule">
            <DetailGrid
              items={[
                { label: "Customer", value: customer.fullName },
                { label: "Customer phone", value: booking.driverPhone },
                { label: "Pickup", value: formatDateTimeIst(booking.startsAt) },
                { label: "Return", value: formatDateTimeIst(booking.endsAt) },
                { label: "Driver licence", value: booking.driverLicenceNumber },
                { label: "Pickup method", value: titleCase(booking.pickupMethod) },
              ]}
            />
          </Panel>

          {showHandover && (
            <Panel title="Handover inspection" eyebrow="Step 1 · Pickup" delay={0.04}>
              <InspectionForm bookingId={booking.id} type="handover" />
            </Panel>
          )}
          {showReturn && (
            <Panel title="Return inspection" eyebrow="Step 2 · Return" delay={0.04}>
              <InspectionForm bookingId={booking.id} type="return" />
            </Panel>
          )}
        </div>

        {snapshot && (
          <div>
            <StatCard label="Your payout" value={formatPaise(snapshot.partnerPayoutPaise)} hint="After Switchback commission" tone="navy" delay={0.06} />
          </div>
        )}
      </div>
    </div>
  );
}
