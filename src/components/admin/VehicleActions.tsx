"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { approveVehicleAction, rejectVehicleAction, suspendVehicleAction } from "@/server/actions/admin";
import type { ActionResult } from "@/server/actions/auth";

const initialState: ActionResult | null = null;

export function ApproveVehicleButton({ vehicleId }: { vehicleId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  return (
    <div>
      <Button
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await approveVehicleAction(vehicleId);
            if (!result.ok) setError(result.error);
            else router.refresh();
          })
        }
      >
        {isPending ? "Approving..." : "Approve & publish"}
      </Button>
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}

export function RejectVehicleForm({ vehicleId }: { vehicleId: string }) {
  const [state, formAction, pending] = useActionState(rejectVehicleAction, initialState);
  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <Textarea name="reason" placeholder="Reason for rejection" rows={2} required />
      {state && !state.ok && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" variant="destructive" size="sm" disabled={pending}>
        {pending ? "Rejecting..." : "Reject vehicle"}
      </Button>
    </form>
  );
}

export function SuspendVehicleForm({ vehicleId }: { vehicleId: string }) {
  const [state, formAction, pending] = useActionState(suspendVehicleAction, initialState);
  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <Textarea name="reason" placeholder="Reason for suspension" rows={2} required />
      {state && !state.ok && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "Suspending..." : "Suspend listing"}
      </Button>
    </form>
  );
}
