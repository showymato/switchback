import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { MobileNav } from "./MobileNav";
import { logOut } from "@/server/actions/auth";
import { MountainMark } from "@/components/decorative/MountainMark";
import { HeaderChrome } from "./HeaderChrome";

const NAV_LINKS = [
  { href: "/vehicles", label: "Explore vehicles" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/safety", label: "Safety" },
  { href: "/partner", label: "List your fleet" },
];

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <HeaderChrome>
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-heading text-xl tracking-tight text-current">
          <MountainMark className="h-6 w-8 text-current" />
          Switchback
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="link-underline text-sm text-current/85 transition hover:text-current"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Button
                render={<Link href={user.role === "customer" ? "/account" : user.role.startsWith("partner") ? "/partner/dashboard" : "/admin/dashboard"} />}
                nativeButton={false}
                variant="ghost"
                size="sm"
                className="text-current hover:bg-current/10 hover:text-current"
              >
                {user.role === "customer" ? "My account" : user.role.startsWith("partner") ? "Partner dashboard" : "Admin"}
              </Button>
              <form action={logOut}>
                <Button variant="outline" size="sm" type="submit" className="border-current/40 bg-transparent text-current hover:bg-current/10 hover:text-current">
                  Log out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button render={<Link href="/login" />} nativeButton={false} variant="ghost" size="sm" className="text-current hover:bg-current/10 hover:text-current">
                Log in
              </Button>
              <Button render={<Link href="/vehicles" />} nativeButton={false} size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                Explore vehicles
              </Button>
            </>
          )}
        </div>

        <MobileNav links={NAV_LINKS} isAuthenticated={Boolean(user)} role={user?.role} />
      </div>
    </HeaderChrome>
  );
}
