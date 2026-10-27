import type { Metadata } from "next";
import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { StaticPage } from "@/components/site/StaticPage";

export const metadata: Metadata = { title: "Help centre" };

export default function HelpPage() {
  return (
    <StaticPage title="Help centre">
      <Accordion>
        <AccordionItem value="booking-status">
          <AccordionTrigger>Where do I see my booking status?</AccordionTrigger>
          <AccordionContent>
            In <Link href="/account/bookings">My bookings</Link>. Each booking shows its current status and a full
            history of status changes, including who made each change.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="payment-pending">
          <AccordionTrigger>My payment says pending / failed — what now?</AccordionTrigger>
          <AccordionContent>
            Open the booking from your account — if the hold hasn&apos;t expired, you can retry payment from the same
            checkout page. If the hold expired, you&apos;ll need to search again for the same dates.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="refund-time">
          <AccordionTrigger>How long do refunds take?</AccordionTrigger>
          <AccordionContent>
            Once approved, refunds are issued through the original payment method. Processing time after that
            depends on your bank or card issuer. You can track status on the booking&apos;s detail page.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="dispute">
          <AccordionTrigger>I disagree with an additional charge — what do I do?</AccordionTrigger>
          <AccordionContent>
            Open the booking and use &quot;Have an issue with this rental?&quot; to raise a dispute. An admin reviews it and
            records a resolution, which may include a refund.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </StaticPage>
  );
}
