import type { Metadata } from "next";
import { StaticPage } from "@/components/site/StaticPage";

export const metadata: Metadata = { title: "Rental requirements" };

export default function RentalRequirementsPage() {
  return (
    <StaticPage title="Rental requirements" subtitle="General eligibility — always check the specific vehicle&apos;s listing too.">
      <section>
        <h2>Documents</h2>
        <ul>
          <li>A valid driving licence covering the vehicle category you&apos;re renting (two-wheeler or LMV/four-wheeler).</li>
          <li>A government-issued photo ID (Aadhaar, passport, or equivalent).</li>
          <li>The booking reference from your confirmation.</li>
        </ul>
      </section>
      <section>
        <h2>Age and licence tenure</h2>
        <p>
          Minimum age and minimum licence-holding period vary by vehicle and are shown on each listing — larger or
          higher-powered vehicles typically require a longer licence history. These thresholds are set by each
          partner and reviewed for reasonableness, not generated automatically.
        </p>
      </section>
      <section>
        <h2>Deposits and mileage</h2>
        <p>
          Every listing shows its refundable security deposit and included daily mileage before you pay. Extra
          mileage, if used, is charged at the per-km rate shown on the listing and itemised at return — not a
          surprise flat fee.
        </p>
      </section>
      <section>
        <h2>Routes and permits</h2>
        <p>
          Some high-altitude routes (e.g. Rohtang Pass, Atal Tunnel approach) are seasonally restricted, require
          permits, or are closed to certain vehicle types depending on conditions and local regulations at the
          time of travel. Switchback does not guarantee that any specific route is open or permitted on your
          travel dates — confirm current restrictions with your partner and local authorities before relying on a
          route for your itinerary.
        </p>
      </section>
    </StaticPage>
  );
}
