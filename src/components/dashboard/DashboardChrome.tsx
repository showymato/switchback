"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, LogOut, X } from "lucide-react";
import { MountainMark } from "@/components/decorative/MountainMark";
import { cn } from "@/lib/utils";
import { DashboardNavLink, isNavActive, type NavIconName } from "./DashboardNavLink";

export interface DashboardNavItem {
  href: string;
  label: string;
  icon?: NavIconName;
}

function Brand({ portal }: { portal: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Link href="/" className="flex items-center gap-2 text-navy">
        <MountainMark className="h-[19px] w-[25px]" />
        <span className="font-heading text-[13px] uppercase tracking-[0.14em]">Switchback</span>
      </Link>
      <span className="technical-label rounded-[2px] bg-orange px-1.5 py-1 text-white">{portal}</span>
    </div>
  );
}

function UserCard({ name, roleLabel, logOut }: { name: string; roleLabel: string; logOut: (formData: FormData) => void }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="flex items-center gap-3 rounded-[4px] bg-dust p-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-orange font-mono text-[11px] text-white">
        {initials}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">{name}</div>
        <div className="technical-label text-muted-foreground">{roleLabel}</div>
      </div>
      <form action={logOut}>
        <button
          type="submit"
          aria-label="Log out"
          title="Log out"
          className="flex size-8 items-center justify-center rounded-[2px] text-foreground/60 transition-colors hover:bg-white hover:text-destructive"
        >
          <LogOut className="size-4" />
        </button>
      </form>
    </div>
  );
}

function NavList({ items, onNavigate }: { items: DashboardNavItem[]; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Portal">
      {items.map((item, i) => (
        <DashboardNavLink
          key={item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
          index={i}
          rootHref={items[0].href}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}

export function DashboardChrome({
  portal,
  roleLabel,
  navItems,
  userFullName,
  logOut,
  children,
}: {
  portal: string;
  roleLabel: string;
  navItems: DashboardNavItem[];
  userFullName: string;
  logOut: (formData: FormData) => void;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const current = [...navItems].reverse().find((n) => isNavActive(pathname, n.href, navItems[0].href));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="grain min-h-screen bg-background">
      {/* ---------------------------------------------------------- desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[272px] p-3 lg:block">
        <div className="flex h-full flex-col rounded-[6px] bg-card px-5 py-6 shadow-[0_0_0_1px_rgba(17,35,47,0.04)]">
          <Brand portal={portal} />
          <div className="mt-6 h-[9px] rounded-t-[4px] border border-b-0 border-foreground/12" />
          <div className="technical-label mb-3 mt-1 text-muted-foreground">Navigate</div>
          <NavList items={navItems} />
          <div className="mt-auto space-y-3">
            <Link
              href="/vehicles"
              className="grain group flex items-center justify-between rounded-[4px] bg-orange px-4 py-3 text-sm text-white transition-colors hover:bg-[#e74f32]"
            >
              <span>
                <span className="technical-label block text-white/70">Switchback</span>
                Browse vehicles
              </span>
              <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
            <UserCard name={userFullName} roleLabel={roleLabel} logOut={logOut} />
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------------------- top bar */}
      <div className="lg:pl-[272px]">
        <header
          className={cn(
            "sticky top-0 z-20 flex h-16 items-center justify-between gap-4 px-4 transition-[background-color,box-shadow,backdrop-filter] duration-300 sm:px-6 lg:px-10",
            scrolled ? "bg-background/80 shadow-[0_1px_0_rgba(17,35,47,0.08)] backdrop-blur-md" : "bg-transparent"
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="text-navy lg:hidden" aria-label="Switchback home">
              <MountainMark className="h-[19px] w-[25px]" />
            </Link>
            <div className="technical-label flex min-w-0 items-center gap-2 text-muted-foreground">
              <span className="hidden sm:inline">{portal}</span>
              <span aria-hidden className="hidden h-1 w-4 rounded-full bg-orange sm:inline-block" />
              <span className="truncate text-foreground">{current?.label ?? ""}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="technical-label hidden items-center gap-1 rounded-[2px] px-3 py-2 text-foreground/70 transition-colors hover:bg-card hover:text-foreground sm:inline-flex"
            >
              Back to site <ArrowUpRight className="size-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="flex h-8 w-14 items-center justify-center rounded-[2px] bg-card text-navy lg:hidden"
            >
              <svg width="20" height="10" viewBox="0 0 20 10" aria-hidden>
                <path d="M0 1h20M0 9h20" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-4 sm:px-6 lg:px-10 lg:pt-6">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.38, 0.005, 0.215, 1] }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* --------------------------------------------------------- mobile drawer */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-navy/60 backdrop-blur-[6px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="absolute inset-x-2 top-2 flex max-h-[calc(100%-1rem)] flex-col overflow-auto rounded-[6px] bg-card p-5"
              initial={{ y: "-105%" }}
              animate={{ y: 0 }}
              exit={{ y: "-105%" }}
              transition={{ duration: 0.5, ease: [0.38, 0.005, 0.215, 1] }}
            >
              <div className="flex items-center justify-between gap-3">
                <Brand portal={portal} />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="flex h-8 w-14 items-center justify-center rounded-[2px] bg-dust text-navy"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="my-5 h-[9px] rounded-t-[4px] border border-b-0 border-foreground/12" />
              <NavList items={navItems} onNavigate={() => setOpen(false)} />
              <div className="mt-6">
                <UserCard name={userFullName} roleLabel={roleLabel} logOut={logOut} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
