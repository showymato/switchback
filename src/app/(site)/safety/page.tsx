import type { Metadata } from "next";
import { StaticPage } from "@/components/site/StaticPage";

export const metadata: Metadata = { title: "Safety" };

export default function SafetyPage() {
  return (
    <StaticPage title="Safety" subtitle="What we check, and what we don&apos;t claim.">
      <section>
        <h2>What partner verification covers</h2>
        <p>
          Before a partner&apos;s first vehicle can be published, an admin reviews the business details and documents
          they submit at application. Before an individual vehicle can be published, an admin reviews that
          specific vehicle&apos;s listing. Verification confirms the information and documents provided were reviewed —
          it is not an independent inspection of the physical vehicle&apos;s roadworthiness on every rental, and it does
          not guarantee safety.
        </p>
      </section>
      <section>
        <h2>Before you ride or drive</h2>
        <ul>
          <li>Wear the safety gear provided or bring your own — helmets for motorcycles/scooters are mandatory.</li>
          <li>Check brakes, lights, horn, and tyre condition at handover and note anything unusual on the checklist.</li>
          <li>Carry your licence and ID; keep the booking reference accessible.</li>
          <li>Check road and weather conditions before high-altitude routes — conditions change quickly in Himachal Pradesh.</li>
        </ul>
      </section>
      <section>
        <h2>If something goes wrong</h2>
        <p>
          For a medical emergency or accident, contact local emergency services first. Afterwards, report the
          incident through your account&apos;s support page so we can assist with the booking, deposit, and any
          dispute. We do not currently offer a 24/7 roadside assistance network — if a partner provides one, that
          is stated on their listing, not assumed.
        </p>
      </section>
    </StaticPage>
  );
}
