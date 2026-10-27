import Link from "next/link";
import { MountainMark } from "@/components/decorative/MountainMark";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Rent",
    links: [
      { href: "/motorcycles", label: "Motorcycles" },
      { href: "/scooters", label: "Scooters" },
      { href: "/cars", label: "Self-drive cars" },
      { href: "/suvs", label: "Self-drive SUVs" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/safety", label: "Safety" },
      { href: "/partner", label: "List your fleet" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/help", label: "Help centre" },
      { href: "/contact", label: "Contact" },
      { href: "/rental-requirements", label: "Rental requirements" },
      { href: "/cancellation-policy", label: "Cancellation & refunds" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms & conditions" },
      { href: "/privacy", label: "Privacy policy" },
    ],
  },
];

// Computed once at module load (build/boot), not per-render, so Next's Cache
// Components prerenderer doesn't treat it as an unstable per-request value.
const COPYRIGHT_YEAR = new Date().getFullYear();

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 font-heading text-lg text-foreground">
              <MountainMark className="h-6 w-8 text-primary" />
              Switchback
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Verified motorcycle, scooter, car and SUV rentals in Manali, Himachal Pradesh.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="text-sm font-medium text-foreground">{col.title}</div>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {COPYRIGHT_YEAR} Switchback. Operated in Manali, Himachal Pradesh.</p>
          <p>
            Switchback is a booking marketplace. Vehicles are owned and operated by independent, verified rental
            partners.
          </p>
        </div>
      </div>
    </footer>
  );
}
