import type { Metadata } from "next";
import { StaticPage } from "@/components/site/StaticPage";

export const metadata: Metadata = { title: "Terms & conditions" };

export default function TermsPage() {
  return (
    <StaticPage title="Terms & conditions" subtitle="Draft for legal review — not yet finalised. Last updated: build date.">
      <div className="rounded-md border border-amber-400/40 bg-amber-100/40 px-4 py-3 text-sm dark:bg-amber-900/20">
        This is a working draft generated for development purposes. It has not been reviewed by a qualified
        lawyer and must not be treated as binding until it is. See the compliance register in the project
        repository for what&apos;s confirmed versus open.
      </div>

      <section>
        <h2>What Switchback is</h2>
        <p>
          Switchback operates a booking marketplace connecting customers with independent vehicle rental
          partners in Manali, Himachal Pradesh. The rental contract for each vehicle is between the customer and
          the rental partner; Switchback facilitates discovery, booking, payment collection, and dispute support.
        </p>
      </section>
      <section>
        <h2>Eligibility</h2>
        <p>
          You must hold a valid driving licence for the vehicle category booked and meet the minimum age shown on
          that vehicle&apos;s listing. Providing false licence or identity information is grounds for booking
          cancellation without refund.
        </p>
      </section>
      <section>
        <h2>Payments and deposits</h2>
        <p>
          The amount shown at checkout is the total payable, including any refundable security deposit. The
          deposit is returned after the return inspection, net of any confirmed additional charges you have been
          shown evidence for.
        </p>
      </section>
      <section>
        <h2>Liability</h2>
        <p>
          [Open — requires legal review.] Liability allocation between customer, partner, and Switchback for
          accidents, traffic violations, and vehicle damage during the rental period needs confirmation against
          the Motor Vehicles Act, applicable state rules, and insurance terms before this section can be
          finalised.
        </p>
      </section>
      <section>
        <h2>Governing law</h2>
        <p>[Open — requires legal review.] To be confirmed with counsel, likely the courts of Himachal Pradesh.</p>
      </section>
    </StaticPage>
  );
}
