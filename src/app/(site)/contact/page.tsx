import type { Metadata } from "next";
import Link from "next/link";
import { StaticPage } from "@/components/site/StaticPage";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <StaticPage title="Contact">
      <p>
        For anything related to an existing booking — payment, refund, pickup, or a dispute — the fastest path is
        opening a support case from{" "}
        <Link href="/account/support">your account</Link>, since it&apos;s tied to your booking and routed to our team
        with that context attached.
      </p>
      <p>
        For partner applications, see{" "}
        <Link href="/partner">list your fleet</Link>. For general enquiries, email{" "}
        <a href="mailto:hello@switchback.example">hello@switchback.example</a> (placeholder address for this
        build — replace with a monitored inbox before launch).
      </p>
    </StaticPage>
  );
}
