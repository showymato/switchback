"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { recordInspectionAction } from "@/server/actions/partner";
import type { ActionResult } from "@/server/actions/auth";

const initialState: ActionResult | null = null;

export function InspectionForm({ bookingId, type }: { bookingId: string; type: "handover" | "return" }) {
  const [state, formAction, pending] = useActionState(recordInspectionAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-border p-4">
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="type" value={type} />
      <h3 className="font-medium text-foreground">{type === "handover" ? "Handover checklist" : "Return checklist"}</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`odo-${type}`}>Odometer (km)</Label>
          <Input id={`odo-${type}`} name="odometerReading" type="number" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`fuel-${type}`}>Fuel/charge (%)</Label>
          <Input id={`fuel-${type}`} name="fuelOrChargeLevelPercent" type="number" min={0} max={100} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`notes-${type}`}>Condition notes</Label>
        <Textarea id={`notes-${type}`} name="conditionNotes" rows={2} />
      </div>
      {state && !state.ok && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving..." : type === "handover" ? "Confirm handover" : "Confirm return"}
      </Button>
    </form>
  );
}
