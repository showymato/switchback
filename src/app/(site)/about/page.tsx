import type { Metadata } from "next";
import { StaticPage } from "@/components/site/StaticPage";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <StaticPage title="About Switchback">
      <p>
        Switchback is a booking marketplace for vehicle rentals in Manali, Himachal Pradesh — motorcycles,
        scooters, self-drive cars, and self-drive SUVs. We don&apos;t own or operate any vehicles ourselves; every
        listing belongs to an independent, verified rental partner. Switchback provides the booking, payment,
        availability, and dispute-handling layer that connects travellers with those partners.
      </p>
      <p>
        We&apos;re starting with Manali because that&apos;s where the product is tested against the way trips here actually
        work — pickup around Old Manali and Mall Road, day trips to Solang and Naggar, and the operational realities
        of a mountain tourism market. We&apos;d rather get this one market right before expanding.
      </p>
      <h2>What we optimise for</h2>
      <ul>
        <li>Prices and terms that don&apos;t change between the listing and the receipt.</li>
        <li>A real server-side booking system — no double-booked vehicles, no bookings marked &quot;paid&quot; on a hunch.</li>
        <li>A documented process when something goes wrong, not just a contact form.</li>
      </ul>
    </StaticPage>
  );
}
