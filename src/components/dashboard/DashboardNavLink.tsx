"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarClock,
  Car,
  Gauge,
  LayoutGrid,
  LifeBuoy,
  ReceiptText,
  Scale,
  ScrollText,
  Undo2,
  UserRound,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Icons are referenced by name because server layouts can't pass component functions
// across the client boundary.
export const NAV_ICONS = {
  overview: LayoutGrid,
  dashboard: Gauge,
  bookings: CalendarClock,
  support: LifeBuoy,
  profile: UserRound,
  vehicles: Car,
  earnings: Wallet,
  partners: Building2,
  refunds: Undo2,
  disputes: Scale,
  audit: ScrollText,
  ledger: ReceiptText,
} as const;

export type NavIconName = keyof typeof NAV_ICONS;

export function isNavActive(pathname: string, href: string, rootHref: string) {
  return pathname === href || (href !== rootHref && pathname.startsWith(`${href}/`));
}

export function DashboardNavLink({
  href,
  label,
  icon,
  index,
  rootHref,
  onNavigate,
}: {
  href: string;
  label: string;
  icon?: NavIconName;
  index: number;
  rootHref: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isActive = isNavActive(pathname, href, rootHref);
  const Icon = icon ? NAV_ICONS[icon] : null;

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-[3px] px-3 py-2.5 text-sm transition-colors duration-200",
        isActive ? "bg-navy text-white" : "text-foreground/75 hover:bg-dust hover:text-foreground"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute -left-3 top-1/2 h-1 w-4 -translate-y-1/2 rounded-full bg-orange transition-transform duration-300",
          isActive ? "scale-x-100" : "scale-x-0"
        )}
      />
      {Icon && (
        <Icon
          className={cn("size-4 shrink-0", isActive ? "text-orange" : "text-foreground/45 group-hover:text-foreground/80")}
          strokeWidth={1.75}
        />
      )}
      <span className="flex-1 truncate">{label}</span>
      <span className={cn("technical-label", isActive ? "text-white/50" : "text-foreground/30")}>
        {String(index + 1).padStart(2, "0")}
      </span>
    </Link>
  );
}
