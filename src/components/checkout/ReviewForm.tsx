"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { submitReviewAction } from "@/server/actions/customerBooking";
import type { ActionResult } from "@/server/actions/auth";

const initialState: ActionResult | null = null;

export function ReviewForm({ bookingId }: { bookingId: string }) {
  const [state, formAction, pending] = useActionState(submitReviewAction, initialState);

  if (state?.ok) {
    return <p className="text-sm text-primary">Thanks — your review has been posted.</p>;
  }

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-border p-4">
      <input type="hidden" name="bookingId" value={bookingId} />
      <div>
        <Label htmlFor="rating">Rating</Label>
        <select id="rating" name="rating" defaultValue="5" className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm sm:w-40">
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} / 5
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="comment">Comment (optional)</Label>
        <Textarea id="comment" name="comment" rows={3} />
      </div>
      {state && !state.ok && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Submitting..." : "Submit review"}
      </Button>
    </form>
  );
}
