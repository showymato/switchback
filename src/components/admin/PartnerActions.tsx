"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { approvePartnerAction, rejectPartnerAction, suspendPartnerAction } from "@/server/actions/admin";
import type { ActionResult } from "@/server/actions/auth";

const initialState: ActionResult | null = null;

export function ApprovePartnerButton({ partnerId }: { partnerId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <Button
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await approvePartnerAction(partnerId);
          router.refresh();
        })
      }
    >
      {isPending ? "Approving..." : "Approve partner"}
    </Button>
  );
}

export function RejectPartnerForm({ partnerId }: { partnerId: string }) {
  const [state, formAction, pending] = useActionState(rejectPartnerAction, initialState);
  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="partnerId" value={partnerId} />
      <Textarea name="reason" placeholder="Reason for rejection" rows={2} required />
      {state && !state.ok && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" variant="destructive" size="sm" disabled={pending}>
        {pending ? "Rejecting..." : "Reject partner"}
      </Button>
    </form>
  );
}

export function SuspendPartnerForm({ partnerId }: { partnerId: string }) {
  const [state, formAction, pending] = useActionState(suspendPartnerAction, initialState);
  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="partnerId" value={partnerId} />
      <Textarea name="reason" placeholder="Reason for suspension" rows={2} required />
      {state && !state.ok && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "Suspending..." : "Suspend partner"}
      </Button>
    </form>
  );
}
