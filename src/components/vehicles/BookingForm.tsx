"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { startCheckoutAction } from "@/server/actions/booking";
import type { ActionResult } from "@/server/actions/auth";

const initialState: ActionResult<{ bookingId: string }> | null = null;

export function BookingForm({
  vehicleSlug,
  minRentalHours,
  deliveryAvailable,
}: {
  vehicleSlug: string;
  minRentalHours: number;
  deliveryAvailable: boolean;
}) {
  const [state, formAction, pending] = useActionState(startCheckoutAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="vehicleSlug" value={vehicleSlug} />

      {state && !state.ok && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}

      <div className="space-y-1.5">
        <Label htmlFor="startsAt">Pickup</Label>
        <input id="startsAt" name="startsAt" type="datetime-local" required className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" />
        {state && !state.ok && state.fieldErrors?.startsAt && <p className="text-xs text-destructive">{state.fieldErrors.startsAt}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="endsAt">Return</Label>
        <input id="endsAt" name="endsAt" type="datetime-local" required className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" />
        <p className="text-xs text-muted-foreground">Minimum rental: {minRentalHours} hours.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pickupMethod">Pickup method</Label>
        <select id="pickupMethod" name="pickupMethod" defaultValue="partner_counter" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
          <option value="partner_counter">Pickup at partner counter</option>
          {deliveryAvailable && <option value="hotel_delivery">Hotel delivery (extra charge)</option>}
          {deliveryAvailable && <option value="airport_pickup">Airport pickup (extra charge)</option>}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="driverFullName">Driver&apos;s full name</Label>
        <Input id="driverFullName" name="driverFullName" required />
        {state && !state.ok && state.fieldErrors?.driverFullName && <p className="text-xs text-destructive">{state.fieldErrors.driverFullName}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="driverPhone">Driver&apos;s phone</Label>
        <Input id="driverPhone" name="driverPhone" required />
        {state && !state.ok && state.fieldErrors?.driverPhone && <p className="text-xs text-destructive">{state.fieldErrors.driverPhone}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="driverLicenceNumber">Driving licence number</Label>
        <Input id="driverLicenceNumber" name="driverLicenceNumber" required />
        {state && !state.ok && state.fieldErrors?.driverLicenceNumber && (
          <p className="text-xs text-destructive">{state.fieldErrors.driverLicenceNumber}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Checking availability..." : "Reserve — pay next"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        We hold this vehicle for 15 minutes while you complete payment. The exact total is confirmed on the next
        step.
      </p>
    </form>
  );
}
