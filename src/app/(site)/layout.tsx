import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      {/* pt-20 compensates the now-fixed header's height (h-20) so content never starts
          underneath it; the homepage hero cancels this with -mt-20 since it's designed
          to extend behind the transparent header itself. */}
      <main className="flex-1 pt-20">{children}</main>
      <SiteFooter />
    </div>
  );
}
