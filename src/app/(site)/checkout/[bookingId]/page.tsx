import { redirect } from "next/navigation";
import Link from "next/link";
import { BadgeCheck, CalendarClock, MapPin, RefreshCcw, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getBookingForCustomer } from "@/server/queries/bookings";
import { formatDateTimeIst, formatPaise, titleCase } from "@/lib/format";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckoutPanel } from "@/components/checkout/CheckoutPanel";
import { Reveal } from "@/components/motion/Reveal";

export default async function CheckoutPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const user = await requireUser();

  const data = await getBookingForCustomer(bookingId, user.id);
  if (!data) redirect("/account/bookings");

  const { booking, vehicle, partner, pickupLocation, snapshot, payment } = data;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Reveal>
        <p className="text-sm text-muted-foreground">Booking reference</p>
        <h1 className="mt-1 font-heading text-3xl text-foreground">{booking.reference}</h1>
      </Reveal>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-start">
        <Reveal delay={0.05} className="space-y-6">
          <div className="rounded-sm border border-border bg-card p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-heading text-xl text-foreground">
                  {vehicle.make} {vehicle.model}
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                  {partner.businessName}
                  {pickupLocation ? ` · ${pickupLocation.area}` : ""}
                </p>
              </div>
              <Badge variant="secondary">{titleCase(booking.status)}</Badge>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <CalendarClock className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">Pickup</div>
                  <div className="font-medium text-foreground">{formatDateTimeIst(booking.startsAt)}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CalendarClock className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">Return</div>
                  <div className="font-medium text-foreground">{formatDateTimeIst(booking.endsAt)}</div>
                </div>
              </div>
              {pickupLocation && (
                <div className="col-span-2 flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <div className="text-xs text-muted-foreground">Pickup location</div>
                    <div className="font-medium text-foreground">{pickupLocation.area}</div>
                  </div>
                </div>
              )}
            </div>

            {snapshot && (
              <>
                <Separator className="my-5" />
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">
                      Rental ({snapshot.rentalDurationHours}h, {snapshot.rateBasis})
                    </dt>
                    <dd>{formatPaise(snapshot.subtotalPaise)}</dd>
                  </div>
                  {snapshot.deliveryChargePaise > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Delivery / pickup charge</dt>
                      <dd>{formatPaise(snapshot.deliveryChargePaise)}</dd>
                    </div>
                  )}
                  {snapshot.discountPaise > 0 && (
                    <div className="flex justify-between text-primary">
                      <dt>Discount</dt>
                      <dd>-{formatPaise(snapshot.discountPaise)}</dd>
                    </div>
                  )}
                  {snapshot.taxPaise > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Tax</dt>
                      <dd>{formatPaise(snapshot.taxPaise)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Refundable security deposit</dt>
                    <dd>{formatPaise(snapshot.depositPaise)}</dd>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-heading text-lg text-foreground">
                    <dt>Total payable now</dt>
                    <dd>{formatPaise(snapshot.totalPayablePaise)}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs text-muted-foreground">
                  Includes a fully refundable deposit of {formatPaise(snapshot.depositPaise)}, returned after your
                  return inspection. See the cancellation policy agreed at booking time on your confirmation page.
                </p>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-2 rounded-sm border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary" /> Secure, verified partner
            </div>
            <div className="flex items-center gap-2 rounded-sm border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
              <RefreshCcw className="h-4 w-4 shrink-0 text-primary" /> Free cancellation window
            </div>
            <div className="flex items-center gap-2 rounded-sm border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
              <BadgeCheck className="h-4 w-4 shrink-0 text-primary" /> Deposit fully refundable
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="lg:sticky lg:top-24">
            <CheckoutPanel
              bookingId={booking.id}
              status={booking.status}
              holdExpiresAt={booking.holdExpiresAt?.toISOString() ?? null}
              existingPayment={payment ? { status: payment.status, isSandbox: payment.isSandbox, orderId: payment.providerOrderId } : null}
            />
            <p className="mt-4 text-center text-sm text-muted-foreground">
              <Link href="/account/bookings" className="link-underline">
                View all my bookings
              </Link>
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
