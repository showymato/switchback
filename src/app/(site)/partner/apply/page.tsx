import type { Metadata } from "next";
import { ApplyForm } from "@/components/partner/ApplyForm";

export const metadata: Metadata = { title: "Partner application" };

export default function PartnerApplyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-heading text-2xl text-foreground">Apply as a Switchback partner</h1>
      <p className="mt-1 text-sm text-muted-foreground">Takes about five minutes. You can add vehicles right away.</p>
      <div className="mt-6 rounded-lg border border-border bg-card p-6">
        <ApplyForm />
      </div>
    </div>
  );
}
