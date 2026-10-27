import { maintenance } from "@jerryqiu/sites/maintenance";
import { type NextRequest, NextResponse } from "next/server";

/**
 * First, maintenance mode (packages/sites/src/maintenance.ts: on by default in a production build, off with
 * MAINTENANCE_MODE=0): every public route answers with the shared "back soon" page. The admin, its sign-in and the
 * routes the admin uses stay open (below), plus the defaults: cron, webhooks, auth, health, revalidate.
 *
 * Then it guards /admin: no session cookie means a redirect to /sign-in. This is only the FIRST gate (cheap, signed-cookie
 * presence); the admin layout and every Server Action re-check the session and role against the database.
 * The maintenance module is the only shared code here, and it needs no database.
 * (music., flying. and photo. are separate deployments now; /music and /flying here redirect, see next.config.mjs.)
 */
const OPEN_SIGNIN = process.env.NODE_ENV === "development" && process.env.DASHBOARD_OPEN_SIGNIN === "true";
const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];

const MAINTENANCE_OPEN = ["/admin", "/sign-in", "/api/admin", "/api/storage", "/api/img"];

export function proxy(request: NextRequest) {
  const down = maintenance(request, MAINTENANCE_OPEN);
  if (down) return down;
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const has = SESSION_COOKIES.some((c) => request.cookies.has(c));
    if (!has && !OPEN_SIGNIN) {
      const url = request.nextUrl.clone();
      url.pathname = "/sign-in";
      url.search = `?callbackUrl=${encodeURIComponent(pathname + request.nextUrl.search)}`;
      return NextResponse.redirect(url);
    }
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "private, no-store");
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  // Skip Next internals and static asset folders. API routes are included so maintenance mode can answer them.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|opt).*)"],
};
