"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createSupportCaseAction } from "@/server/actions/support";
import type { ActionResult } from "@/server/actions/auth";

const initialState: ActionResult | null = null;

const CATEGORIES = [
  ["booking_issue", "Booking issue"],
  ["payment_issue", "Payment issue"],
  ["refund_issue", "Refund issue"],
  ["partner_no_show", "Partner no-show"],
  ["vehicle_condition", "Vehicle condition"],
  ["breakdown_or_incident", "Breakdown or incident"],
  ["eligibility_question", "Eligibility question"],
  ["complaint", "Complaint"],
  ["other", "Other"],
] as const;

export function NewSupportCaseForm() {
  const [state, formAction, pending] = useActionState(createSupportCaseAction, initialState);

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-border p-4">
      <div className="space-y-1.5">
        <Label htmlFor="category">Category</Label>
        <select id="category" name="category" defaultValue="booking_issue" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
          {CATEGORIES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" name="subject" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="body">Describe the issue</Label>
        <Textarea id="body" name="body" rows={4} required />
      </div>
      {state && !state.ok && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.ok && <p className="text-sm text-primary">Case submitted — we&apos;ll follow up.</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Submitting..." : "Submit case"}
      </Button>
    </form>
  );
}
