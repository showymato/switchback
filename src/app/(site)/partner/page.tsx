import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "List your fleet" };

const BENEFITS = [
  "Reach travellers already searching for verified rentals in Manali",
  "Manage vehicles, availability and pricing from one dashboard",
  "Server-side double-booking prevention — no overlapping reservations",
  "Transparent commission, with a running ledger you can audit",
];

export default function PartnerLandingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-heading text-3xl text-foreground sm:text-4xl">Run a rental business in Manali?</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Switchback is a booking marketplace for verified motorcycle, scooter, car and SUV rental partners.
        Applications are reviewed before your vehicles can go live.
      </p>

      <ul className="mt-8 space-y-3">
        {BENEFITS.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm text-foreground/90">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            {b}
          </li>
        ))}
      </ul>

      <div className="mt-8 rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Before you apply</p>
        <p className="mt-1">
          You&apos;ll need your business details and, once approved, you&apos;ll be asked to submit vehicle registration,
          insurance and permit documents per vehicle before it can be published. See{" "}
          <Link href="/rental-requirements" className="underline">
            rental requirements
          </Link>{" "}
          for the kind of documentation we review.
        </p>
      </div>

      <Button render={<Link href="/partner/apply" />} nativeButton={false} className="mt-8" size="lg">
        Apply as a partner
      </Button>
    </div>
  );
}
