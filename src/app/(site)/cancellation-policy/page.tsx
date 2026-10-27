import type { Metadata } from "next";
import { StaticPage } from "@/components/site/StaticPage";
import { DEFAULT_CANCELLATION_POLICY } from "@/server/services/pricing";

export const metadata: Metadata = { title: "Cancellation & refund policy" };

export default function CancellationPolicyPage() {
  const p = DEFAULT_CANCELLATION_POLICY;
  return (
    <StaticPage title="Cancellation & refund policy" subtitle="Draft platform default — pending legal/commercial review.">
      <section>
        <h2>Before pickup</h2>
        <ul>
          <li>
            <strong>{p.freeCancellationHours}+ hours before pickup:</strong> full refund of the rental fee, plus
            the full security deposit.
          </li>
          <li>
            <strong>Between {p.partialRefundCutoffHours} and {p.freeCancellationHours} hours before pickup:</strong>{" "}
            {p.partialRefundPercent}% refund of the rental fee, plus the full security deposit.
          </li>
          <li>
            <strong>Inside {p.partialRefundCutoffHours} hours of pickup:</strong> the rental fee is non-refundable;
            the security deposit is still fully refunded since the vehicle was never used.
          </li>
        </ul>
        <p>
          This is exactly the policy shown and locked in on your booking at checkout time — a later change to this
          page does not change the terms of a booking you&apos;ve already made.
        </p>
      </section>
      <section>
        <h2>After pickup</h2>
        <p>
          Cancellations are not available once a rental is active. If something goes wrong during the rental
          (breakdown, misrepresented condition, etc.), raise it from your booking as a dispute rather than a
          cancellation — this routes it to an admin for investigation and, where warranted, a refund.
        </p>
      </section>
      <section>
        <h2>Partner or admin-initiated cancellation</h2>
        <p>
          If a partner cannot fulfil a confirmed booking (e.g. vehicle unavailable), you&apos;re entitled to a full
          refund including the deposit regardless of how close to pickup it is.
        </p>
      </section>
    </StaticPage>
  );
}
