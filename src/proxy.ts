import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "switchback_session";

// Coarse, cookie-presence-only gate. It only decides whether to bounce an anonymous
// visitor to /login before a page render starts — it is NOT the authorization boundary.
// Every protected layout/server action re-checks role via requireRole() against the
// database, because a matcher change here must never become the only thing standing
// between an unauthenticated request and a privileged route.
// "/partner" itself is intentionally excluded — it hosts the public marketing page and
// the public application form (/partner/apply). The actual partner dashboard lives at
// /partner/dashboard etc., inside a route group whose layout calls requireRole().
const PROTECTED_PREFIXES = ["/account", "/partner/dashboard", "/partner/vehicles", "/partner/bookings", "/partner/earnings", "/admin"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  if (!isProtected) return NextResponse.next();

  const hasSession = request.cookies.has(SESSION_COOKIE);
  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
