import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// One variable Archivo file covers body text (wdth 100), the wide display cut used for
// headings (wdth 125) and the semi-condensed marquee (wdth 87.5).
const archivo = Archivo({ variable: "--sb-archivo", subsets: ["latin"], axes: ["wdth"] });

const plexMono = IBM_Plex_Mono({ variable: "--sb-plex", subsets: ["latin"], weight: ["400", "500"] });

const SITE_DESCRIPTION =
  "Switchback connects travellers with verified motorcycle, scooter, car and SUV rental partners in Manali — transparent pricing, real availability, documented pickup and return.";

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL) : undefined,
  title: {
    default: "Switchback — Verified vehicle rentals in Manali",
    template: "%s | Switchback",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "Switchback",
    title: "Switchback — Verified vehicle rentals in Manali",
    description: SITE_DESCRIPTION,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Switchback — Verified vehicle rentals in Manali",
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* Scroll-reveal content (src/components/motion/Reveal.tsx) starts at opacity:0
            in the SSR'd HTML and only becomes visible once motion's JS hydrates and the
            IntersectionObserver fires. If JS never loads — blocked, failed, or a very
            slow connection — that content would stay invisible forever. This forces it
            visible in that no-JS case; browsers with JS just never apply it. */}
        <noscript>
          <style>{`[style*="opacity:0"],[style*="opacity: 0"]{opacity:1 !important;transform:none !important;}`}</style>
        </noscript>
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
