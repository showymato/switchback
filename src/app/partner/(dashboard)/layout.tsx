import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getPartnerForOwner } from "@/server/queries/partners";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/DashboardShell";
import { Notice, StatusBadge } from "@/components/dashboard/ui";

const NAV_ITEMS: DashboardNavItem[] = [
  { href: "/partner/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/partner/vehicles", label: "Vehicles", icon: "vehicles" },
  { href: "/partner/bookings", label: "Bookings", icon: "bookings" },
  { href: "/partner/earnings", label: "Earnings", icon: "earnings" },
];

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("partner_owner", "partner_staff");
  const partner = await getPartnerForOwner(user.id);
  if (!partner) redirect("/partner/apply");

  return (
    <DashboardShell brandLabel="Partner" roleLabel={user.role === "partner_owner" ? "Owner" : "Staff"} navItems={NAV_ITEMS} userFullName={user.fullName}>
      {partner.status !== "approved" && (
        <Notice
          tone={partner.status === "rejected" || partner.status === "suspended" ? "danger" : "warning"}
          title={
            <>
              Partner status <StatusBadge status={partner.status} />
            </>
          }
        >
          {partner.status === "rejected" && partner.rejectionReason && <>Reason: {partner.rejectionReason}</>}
          {partner.status === "suspended" && partner.suspensionReason && <>Reason: {partner.suspensionReason}</>}
          {(partner.status === "submitted" || partner.status === "under_review") && (
            <>
              An admin is reviewing your application and documents. You can prepare vehicle listings now; they
              won&apos;t be bookable until both your account and each vehicle are approved.
            </>
          )}
        </Notice>
      )}
      {children}
    </DashboardShell>
  );
}
