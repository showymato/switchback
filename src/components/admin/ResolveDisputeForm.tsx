"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { resolveDisputeAction } from "@/server/actions/admin";
import type { ActionResult } from "@/server/actions/auth";

const initialState: ActionResult | null = null;

export function ResolveDisputeForm({ disputeId }: { disputeId: string }) {
  const [state, formAction, pending] = useActionState(resolveDisputeAction, initialState);
  const [outcome, setOutcome] = useState("completed");

  if (state?.ok) return <p className="text-sm text-primary">Dispute resolved.</p>;

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="disputeId" value={disputeId} />
      <div className="flex items-center gap-2">
        <Label htmlFor={`outcome-${disputeId}`} className="text-xs">
          Outcome
        </Label>
        <select
          id={`outcome-${disputeId}`}
          name="outcome"
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="completed">No action — booking completed</option>
          <option value="refund_pending">Issue a refund</option>
          <option value="cancelled">Cancel booking</option>
        </select>
      </div>
      {outcome === "refund_pending" && (
        <Input name="refundAmountRupees" type="number" placeholder="Refund amount (&#8377;)" className="h-8 w-48" />
      )}
      <Textarea name="resolutionNotes" rows={2} placeholder="Resolution notes" required />
      {state && !state.ok && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving..." : "Resolve dispute"}
      </Button>
    </form>
  );
}
