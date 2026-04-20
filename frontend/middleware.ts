import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/", "/login", "/signup"];
const ONBOARDING_ROUTE = "/onboarding";
const PORTAL_ROUTE = "/portal";
const DASHBOARD_ROUTE = "/dashboard";

const ADMIN_ONLY_ROUTES = ["/team", "/borrowers/add"];
const BORROWER_ROUTES = ["/portal"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Note: JWT tokens are stored in localStorage (not cookies), so client-side
  // route guards via RouteGuard and useAuth handle actual authentication checks.
  // This middleware handles structural routing only.

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/).*)"],
};
