"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { applyAsPartnerAction } from "@/server/actions/partner";
import type { ActionResult } from "@/server/actions/auth";

const initialState: ActionResult | null = null;

export function ApplyForm() {
  const [state, formAction, pending] = useActionState(applyAsPartnerAction, initialState);

  return (
    <form action={formAction} className="space-y-6">
      {state && !state.ok && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}

      <div>
        <h2 className="font-medium text-foreground">Your account</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Your full name</Label>
            <Input id="fullName" name="fullName" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Your phone</Label>
            <Input id="phone" name="phone" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" minLength={8} required />
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-medium text-foreground">Business details</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="businessName">Business name</Label>
            <Input id="businessName" name="businessName" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contactPhone">Business phone</Label>
            <Input id="contactPhone" name="contactPhone" required />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="addressLine1">Business address (Manali)</Label>
            <Input id="addressLine1" name="addressLine1" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gstin">GSTIN (if registered)</Label>
            <Input id="gstin" name="gstin" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="panNumber">PAN</Label>
            <Input id="panNumber" name="panNumber" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="rentalSchemeLicenceNumber">Rent-a-Vehicle scheme licence number (if held)</Label>
            <Input id="rentalSchemeLicenceNumber" name="rentalSchemeLicenceNumber" />
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        By applying you agree to Switchback&apos;s partner terms and commission structure, shown in full before your
        first vehicle is published. An admin reviews every application before approval.
      </p>

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Submitting..." : "Submit application"}
      </Button>
    </form>
  );
}
