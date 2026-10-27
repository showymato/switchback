import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/DashboardShell";

const NAV_ITEMS: DashboardNavItem[] = [
  { href: "/account", label: "Overview", icon: "overview" },
  { href: "/account/bookings", label: "My bookings", icon: "bookings" },
  { href: "/account/support", label: "Support", icon: "support" },
  { href: "/account/profile", label: "Profile", icon: "profile" },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (user.role !== "customer") {
    redirect(user.role.startsWith("partner") ? "/partner/dashboard" : "/admin/dashboard");
  }

  return (
    <DashboardShell brandLabel="Account" roleLabel="Traveller" navItems={NAV_ITEMS} userFullName={user.fullName}>
      {children}
    </DashboardShell>
  );
}
