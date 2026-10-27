"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPaymentOrderAction } from "@/server/actions/booking";
import type { BookingStatus } from "@/db/schema";

interface ExistingPayment {
  status: string;
  isSandbox: boolean;
  orderId: string;
}

export function CheckoutPanel({
  bookingId,
  status,
  holdExpiresAt,
  existingPayment,
}: {
  bookingId: string;
  status: BookingStatus;
  holdExpiresAt: string | null;
  existingPayment: ExistingPayment | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<"success" | "failure" | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [sandboxOrder, setSandboxOrder] = useState(
    existingPayment && existingPayment.isSandbox && existingPayment.status !== "captured" ? existingPayment : null
  );
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!holdExpiresAt || status === "confirmed") return;
    const tick = () => setSecondsLeft(Math.max(0, Math.round((new Date(holdExpiresAt).getTime() - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [holdExpiresAt, status]);

  if (status === "confirmed") {
    return (
      <div className="flex items-start gap-3 rounded-sm border border-primary/30 bg-primary/5 p-6">
        <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
        <div>
          <p className="font-medium text-foreground">Booking confirmed</p>
          <p className="mt-1 text-sm text-muted-foreground">Your payment was captured and the vehicle is reserved for you.</p>
          <Button render={<Link href={`/account/bookings/${bookingId}`} />} nativeButton={false} className="mt-3" size="sm">
            View booking
          </Button>
        </div>
      </div>
    );
  }

  if (status === "cancelled" || status === "expired") {
    return (
      <div className="flex items-start gap-3 rounded-sm border border-destructive/30 bg-destructive/5 p-6">
        <XCircle className="mt-0.5 h-5 w-5 text-destructive" />
        <div>
          <p className="font-medium text-foreground">
            {status === "expired" ? "This hold has expired" : "This booking was cancelled"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">You can search again to book this vehicle for your dates.</p>
          <Button render={<Link href="/vehicles" />} nativeButton={false} className="mt-3" size="sm" variant="outline">
            Search vehicles
          </Button>
        </div>
      </div>
    );
  }

  const handleProceed = () => {
    setOrderError(null);
    startTransition(async () => {
      const result = await createPaymentOrderAction(bookingId);
      if (!result.ok) {
        setOrderError(result.error);
        return;
      }
      if (result.data.isSandbox) {
        setSandboxOrder({ status: "created", isSandbox: true, orderId: result.data.orderId });
      } else {
        setOrderError("Live payment checkout is not wired up in this environment (no Razorpay keys configured).");
      }
    });
  };

  const handleSandboxConfirm = async (outcome: "success" | "failure") => {
    setConfirming(outcome);
    setOrderError(null);
    try {
      const res = await fetch("/api/payments/sandbox-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, outcome }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Something went wrong.");
      router.refresh();
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setConfirming(null);
    }
  };

  if (status === "payment_failed") {
    return (
      <div className="rounded-sm border border-border bg-card p-6">
        <p className="flex items-center gap-2 text-sm text-destructive">
          <XCircle className="h-4 w-4" /> Your last payment attempt failed.
        </p>
        {orderError && <p className="mt-2 text-sm text-destructive">{orderError}</p>}
        <Button className="mt-3" onClick={handleProceed} disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Try payment again"}
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-border bg-card p-6">
      {secondsLeft != null && secondsLeft > 0 && (
        <p className="mb-3 text-sm text-muted-foreground">
          Hold expires in <span className="font-medium text-foreground">{Math.floor(secondsLeft / 60)}m {secondsLeft % 60}s</span>
        </p>
      )}
      {secondsLeft === 0 && (
        <p className="mb-3 text-sm text-destructive">Your hold has expired — refresh this page to confirm.</p>
      )}

      {orderError && <p className="mb-3 text-sm text-destructive">{orderError}</p>}

      {!sandboxOrder ? (
        <Button onClick={handleProceed} disabled={isPending} className="w-full">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Proceed to payment"}
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="rounded-sm border border-dashed border-border bg-muted/50 p-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Sandbox payment.</span> No real Razorpay account is
            configured for this environment, so this step simulates the provider&apos;s checkout outcome instead of
            charging a real card. See README for how to switch to live Razorpay keys.
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => handleSandboxConfirm("success")} disabled={confirming !== null}>
              {confirming === "success" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simulate: Pay now (success)"}
            </Button>
            <Button className="flex-1" variant="outline" onClick={() => handleSandboxConfirm("failure")} disabled={confirming !== null}>
              {confirming === "failure" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simulate: Payment fails"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
