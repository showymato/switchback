import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getBookingForCustomer } from "@/server/queries/bookings";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { formatDateTimeIst, formatPaise, titleCase } from "@/lib/format";
import { CancelBookingButton } from "@/components/checkout/CancelBookingButton";
import { ReviewForm } from "@/components/checkout/ReviewForm";
import { DisputeForm } from "@/components/checkout/DisputeForm";
import { DetailGrid, Line, PageHeader, Panel, StatusBadge } from "@/components/dashboard/ui";

const CANCELLABLE = ["pending_checkout", "awaiting_payment", "payment_failed", "pending_partner_confirmation", "confirmed"];
const DISPUTABLE = ["active", "return_in_progress", "completed"];

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const data = await getBookingForCustomer(id, user.id);
  if (!data) notFound();

  const { booking, vehicle, partner, pickupLocation, snapshot, payment, refunds, events } = data;

  const existingReview = booking.status === "completed" ? await db.select().from(reviews).where(eq(reviews.bookingId, booking.id)) : [];

  return (
    <div>
      <PageHeader
        eyebrow={`Booking ${booking.reference}`}
        title={`${vehicle.make} ${vehicle.model}`}
        status={booking.status}
        description={`${partner.businessName}${pickupLocation ? ` · ${pickupLocation.addressLine}` : ""}`}
        actions={CANCELLABLE.includes(booking.status) ? <CancelBookingButton bookingId={booking.id} /> : undefined}
      />

      <div className="grid gap-1 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-1">
          <Panel title="Trip details" eyebrow="Pickup & return">
            <DetailGrid
              items={[
                { label: "Pickup", value: formatDateTimeIst(booking.startsAt) },
                { label: "Return", value: formatDateTimeIst(booking.endsAt) },
                { label: "Driver", value: booking.driverFullName },
                { label: "Pickup method", value: titleCase(booking.pickupMethod) },
              ]}
            />
          </Panel>

          {DISPUTABLE.includes(booking.status) && (
            <Panel title="Have an issue with this rental?" eyebrow="Disputes" delay={0.04}>
              <DisputeForm bookingId={booking.id} />
            </Panel>
          )}

          {booking.status === "completed" && (
            <Panel title="Leave a review" eyebrow="Feedback" delay={0.06}>
              {existingReview.length > 0 ? (
                <p className="text-sm text-muted-foreground">You rated this rental {existingReview[0].rating} / 5. Thank you.</p>
              ) : (
                <ReviewForm bookingId={booking.id} />
              )}
            </Panel>
          )}

          <Panel title="Status history" eyebrow={`${events.length} events`} delay={0.08}>
            <ol className="relative space-y-5 border-l border-border pl-6">
              {events.map((e, i) => (
                <li key={e.id} className="relative">
                  <span
                    className={`absolute -left-[29px] top-1 size-[9px] rounded-full ring-4 ring-card ${i === events.length - 1 ? "bg-orange" : "bg-navy"}`}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={e.toStatus} />
                    <span className="technical-label text-muted-foreground">{formatDateTimeIst(e.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    by {e.actorRole}
                    {e.reason ? ` · ${e.reason}` : ""}
                  </p>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div>
          {snapshot && (
            <Panel title="Payment" eyebrow="Receipt" delay={0.04} className="lg:sticky lg:top-20">
              <Line label="Total paid" value={formatPaise(snapshot.totalPayablePaise)} strong />
              <Line label="Refundable deposit" value={formatPaise(snapshot.depositPaise)} />
              {payment && (
                <Line
                  label="Payment status"
                  value={
                    <span className="inline-flex items-center gap-2">
                      <StatusBadge status={payment.status} />
                      {payment.isSandbox && <span className="technical-label text-muted-foreground">sandbox</span>}
                    </span>
                  }
                />
              )}
              {refunds.length > 0 && (
                <div className="mt-4 border-t border-border pt-3">
                  <div className="technical-label mb-1 text-muted-foreground">Refunds</div>
                  {refunds.map((r) => (
                    <Line key={r.id} label={<StatusBadge status={r.status} />} value={formatPaise(r.amountPaise)} />
                  ))}
                </div>
              )}
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
