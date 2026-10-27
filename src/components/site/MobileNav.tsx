"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { UserRole } from "@/db/schema";

export function MobileNav({
  links,
  isAuthenticated,
  role,
}: {
  links: { href: string; label: string }[];
  isAuthenticated: boolean;
  role?: UserRole;
}) {
  const [open, setOpen] = useState(false);

  const accountHref = role === "customer" ? "/account" : role?.startsWith("partner") ? "/partner/dashboard" : "/admin/dashboard";

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Open menu" className="text-current hover:bg-current/10 hover:text-current" />}>
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="right" className="w-72">
          <SheetHeader>
            <SheetTitle className="font-heading">Switchback</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 px-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-foreground/80 hover:bg-secondary"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-border pt-3">
              {isAuthenticated ? (
                <Link href={accountHref ?? "/account"} onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary block">
                  My account
                </Link>
              ) : (
                <Link href="/login" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary block">
                  Log in
                </Link>
              )}
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
