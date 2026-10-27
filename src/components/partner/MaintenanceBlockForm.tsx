"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { blockMaintenanceAction } from "@/server/actions/partner";
import type { ActionResult } from "@/server/actions/auth";

const initialState: ActionResult | null = null;

export function MaintenanceBlockForm({ vehicleId }: { vehicleId: string }) {
  const [state, formAction, pending] = useActionState(blockMaintenanceAction, initialState);

  if (state?.ok) return <p className="text-sm text-primary">Maintenance block added.</p>;

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <div className="space-y-1">
        <Label htmlFor={`start-${vehicleId}`} className="text-xs">
          Starts
        </Label>
        <input id={`start-${vehicleId}`} name="startsAt" type="datetime-local" required className="h-8 rounded-md border border-input bg-background px-2 text-sm" />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`end-${vehicleId}`} className="text-xs">
          Ends
        </Label>
        <input id={`end-${vehicleId}`} name="endsAt" type="datetime-local" required className="h-8 rounded-md border border-input bg-background px-2 text-sm" />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`reason-${vehicleId}`} className="text-xs">
          Reason
        </Label>
        <Input id={`reason-${vehicleId}`} name="reason" defaultValue="Scheduled maintenance" className="h-8 w-48" />
      </div>
      {state && !state.ok && <p className="text-xs text-destructive">{state.error}</p>}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving..." : "Block"}
      </Button>
    </form>
  );
}
