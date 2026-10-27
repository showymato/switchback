import { requireRole } from "@/lib/auth";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/DashboardShell";

const NAV_ITEMS: DashboardNavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/partners", label: "Partners", icon: "partners" },
  { href: "/admin/vehicles", label: "Vehicles", icon: "vehicles" },
  { href: "/admin/bookings", label: "Bookings", icon: "bookings" },
  { href: "/admin/refunds", label: "Refunds", icon: "refunds" },
  { href: "/admin/disputes", label: "Disputes", icon: "disputes" },
  { href: "/admin/audit-logs", label: "Audit logs", icon: "audit" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("admin", "super_admin");
  return (
    <DashboardShell brandLabel="Admin" roleLabel={user.role === "super_admin" ? "Super admin" : "Admin"} navItems={NAV_ITEMS} userFullName={user.fullName}>
      {children}
    </DashboardShell>
  );
}
