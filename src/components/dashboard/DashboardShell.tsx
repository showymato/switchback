import { logOut } from "@/server/actions/auth";
import { DashboardChrome, type DashboardNavItem } from "./DashboardChrome";

export type { DashboardNavItem };

export function DashboardShell({
  brandLabel,
  roleLabel,
  navItems,
  userFullName,
  children,
}: {
  brandLabel: string;
  roleLabel?: string;
  navItems: DashboardNavItem[];
  userFullName: string;
  children: React.ReactNode;
}) {
  return (
    <DashboardChrome
      portal={brandLabel}
      roleLabel={roleLabel ?? brandLabel}
      navItems={navItems}
      userFullName={userFullName}
      logOut={logOut}
    >
      {children}
    </DashboardChrome>
  );
}
