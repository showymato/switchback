"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPickupLocationAction } from "@/server/actions/partner";
import type { ActionResult } from "@/server/actions/auth";

const initialState: ActionResult | null = null;

export function NewPickupLocationForm() {
  const [state, formAction, pending] = useActionState(createPickupLocationAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="loc-name">Location name</Label>
        <Input id="loc-name" name="name" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="loc-area">Area</Label>
        <Input id="loc-area" name="area" required placeholder="e.g. Old Manali" />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="loc-address">Address</Label>
        <Input id="loc-address" name="addressLine" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="loc-open">Opens</Label>
        <Input id="loc-open" name="openingTime" type="time" defaultValue="08:00" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="loc-close">Closes</Label>
        <Input id="loc-close" name="closingTime" type="time" defaultValue="20:00" required />
      </div>
      {state && !state.ok && <p className="text-sm text-destructive sm:col-span-2">{state.error}</p>}
      <div className="sm:col-span-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving..." : "Add location"}
        </Button>
      </div>
    </form>
  );
}
