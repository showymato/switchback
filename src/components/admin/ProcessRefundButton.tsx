"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { processRefundAction } from "@/server/actions/admin";

export function ProcessRefundButton({ refundId }: { refundId: string }) {
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
            const result = await processRefundAction(refundId);
            if (!result.ok) setError(result.error);
            else router.refresh();
          })
        }
      >
        {isPending ? "Processing..." : "Process refund"}
      </Button>
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}
