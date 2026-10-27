import { getCurrentUser } from "@/lib/auth";
import { SmoothScroll } from "@/components/landing/SmoothScroll";
import { LandingHeader, type NavLink, type NavProduct } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import "./landing.css";

const PRODUCTS: NavProduct[] = [
  { href: "/motorcycles", title: "Motorcycles", subtitle: "Bikes", image: "/images/hero-himalaya.jpg", imagePosition: "70% 45%" },
  { href: "/suvs", title: "Cars & SUVs", subtitle: "4 wheels", image: "/images/placeholders/nav-suvs.jpg" },
];

const LINKS: NavLink[] = [
  { href: "/vehicles", label: "Explore vehicles" },
  { href: "/scooters", label: "Scooters" },
  { href: "/cars", label: "Cars" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/safety", label: "Safety" },
  { href: "/rental-requirements", label: "Rental requirements" },
  { href: "/partner", label: "List your fleet" },
  { href: "/about", label: "About" },
  { href: "/help", label: "Help" },
  { href: "/contact", label: "Contact us" },
];

const LEGAL: NavLink[] = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/cancellation-policy", label: "Cancellation policy" },
  { href: "/rental-requirements", label: "Requirements" },
];

function accountLink(role?: string) {
  if (!role) return { href: "/login", label: "Log in" };
  if (role === "customer") return { href: "/account", label: "My account" };
  if (role.startsWith("partner")) return { href: "/partner/dashboard", label: "Dashboard" };
  return { href: "/admin/dashboard", label: "Admin" };
}

export default async function LandingLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="sb-landing">
      <SmoothScroll />
      <LandingHeader products={PRODUCTS} links={LINKS} account={accountLink(user?.role)} />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <LandingFooter
        links={LINKS}
        products={PRODUCTS}
        legal={LEGAL}
        background={{ landscape: "/images/destination-himachal-valley.jpg", portrait: "/images/hero-himalaya.jpg" }}
        marquee="Ride Manali"
        cta={{ href: "/vehicles", label: "Book a ride" }}
      />
    </div>
  );
}
