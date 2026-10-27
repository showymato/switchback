"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateProfileAction } from "@/server/actions/profile";
import type { ActionResult } from "@/server/actions/auth";

const initialState: ActionResult | null = null;

export function ProfileForm({
  fullName,
  phone,
  drivingLicenceNumber,
  notificationEmail,
  notificationSms,
}: {
  fullName: string;
  phone: string;
  drivingLicenceNumber: string;
  notificationEmail: boolean;
  notificationSms: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" name="fullName" defaultValue={fullName} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" defaultValue={phone} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="drivingLicenceNumber">Driving licence number</Label>
        <Input id="drivingLicenceNumber" name="drivingLicenceNumber" defaultValue={drivingLicenceNumber} />
      </div>

      <div className="flex items-center justify-between rounded-md border border-border p-3">
        <Label htmlFor="notificationEmail" className="font-normal">
          Email notifications for bookings
        </Label>
        <Switch id="notificationEmail" name="notificationEmail" defaultChecked={notificationEmail} />
      </div>
      <div className="flex items-center justify-between rounded-md border border-border p-3">
        <Label htmlFor="notificationSms" className="font-normal">
          SMS notifications for bookings
        </Label>
        <Switch id="notificationSms" name="notificationSms" defaultChecked={notificationSms} />
      </div>

      {state && !state.ok && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.ok && <p className="text-sm text-primary">Saved.</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
