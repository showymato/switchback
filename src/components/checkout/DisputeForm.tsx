"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { raiseDisputeAction } from "@/server/actions/customerBooking";
import type { ActionResult } from "@/server/actions/auth";

const initialState: ActionResult | null = null;

export function DisputeForm({ bookingId }: { bookingId: string }) {
  const [state, formAction, pending] = useActionState(raiseDisputeAction, initialState);

  if (state?.ok) return <p className="text-sm text-primary">Dispute raised — our team will investigate and respond here.</p>;

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="bookingId" value={bookingId} />
      <Textarea name="summary" rows={3} placeholder="Describe the issue (e.g. disputed damage charge, vehicle condition)" required />
      {state && !state.ok && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "Submitting..." : "Raise a dispute"}
      </Button>
    </form>
  );
}
