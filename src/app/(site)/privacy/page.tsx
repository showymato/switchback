import type { Metadata } from "next";
import { StaticPage } from "@/components/site/StaticPage";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <StaticPage title="Privacy policy" subtitle="Draft for legal review — not yet finalised.">
      <div className="rounded-md border border-amber-400/40 bg-amber-100/40 px-4 py-3 text-sm dark:bg-amber-900/20">
        This is a working draft generated for development purposes, written to describe what the system actually
        does today. It has not been reviewed against the Digital Personal Data Protection Act, 2023 or other
        applicable Indian privacy law — see the compliance register for open items.
      </div>

      <section>
        <h2>What we collect</h2>
        <ul>
          <li>Account details: name, email, phone, password (stored as a salted hash, never in plain text).</li>
          <li>Booking details: pickup/return dates, driver name, phone, and driving licence number.</li>
          <li>Payment metadata (order and payment IDs, amounts, status) — card/bank details are handled by our payment provider and never stored on our servers.</li>
          <li>Partner business and document data, for verification.</li>
        </ul>
      </section>
      <section>
        <h2>How we use it</h2>
        <p>
          To create and manage bookings, process payments and refunds, verify partner and vehicle eligibility, and
          provide support. We do not sell personal data.
        </p>
      </section>
      <section>
        <h2>Retention and deletion</h2>
        <p>
          You can request account deletion from your profile page. Records tied to completed bookings may be
          retained where required for tax, accounting, or legal purposes even after a deletion request — the exact
          retention period is an open item pending legal review.
        </p>
      </section>
      <section>
        <h2>Access control</h2>
        <p>
          Partner staff can only see bookings and documents for their own vehicles. Customers can only see their
          own bookings. Administrative access to personal data is logged.
        </p>
      </section>
    </StaticPage>
  );
}
