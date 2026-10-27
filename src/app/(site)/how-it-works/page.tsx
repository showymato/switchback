import type { Metadata } from "next";
import { StaticPage } from "@/components/site/StaticPage";

export const metadata: Metadata = { title: "How it works" };

export default function HowItWorksPage() {
  return (
    <StaticPage title="How booking works" subtitle="From search to return, in six steps.">
      <ol className="list-decimal space-y-4 pl-5">
        <li>
          <strong>Search.</strong> Pick a category and your pickup/return dates. We only show vehicles that are
          actually free for that exact window — availability is checked against live bookings and partner
          maintenance blocks, not a static calendar.
        </li>
        <li>
          <strong>Review the full price.</strong> Each listing and the checkout page show the same breakdown:
          rental cost, any delivery charge, the refundable deposit, and included mileage. There&apos;s no separate
          number revealed at pickup.
        </li>
        <li>
          <strong>Reserve.</strong> Starting checkout holds the vehicle for 15 minutes while you pay, so someone
          else can&apos;t book the same slot out from under you mid-checkout.
        </li>
        <li>
          <strong>Pay.</strong> Payment is processed through our payment provider. We only mark a booking confirmed
          after the payment is verified — never just because your browser reached a &quot;success&quot; page.
        </li>
        <li>
          <strong>Pickup.</strong> Bring your driving licence and a government photo ID. Your partner records a
          handover checklist (odometer, fuel/charge level, existing condition) before handing over the keys.
        </li>
        <li>
          <strong>Return.</strong> The partner records a return checklist. Your deposit is reconciled against that
          checklist — if there&apos;s a disputed charge, you can raise it from your account.
        </li>
      </ol>
    </StaticPage>
  );
}
