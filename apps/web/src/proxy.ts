import { type NextRequest, NextResponse } from "next/server";

/**
 * Guards /admin: no session cookie means a redirect to /sign-in. This is only the FIRST gate (cheap, signed-cookie
 * presence); the admin layout and every Server Action re-check the session and role against the database.
 * Self-contained on purpose: proxy code should not depend on shared modules.
 * (music., flying. and photo. are separate deployments now; /music and /flying here redirect, see next.config.mjs.)
 */
const OPEN_SIGNIN = process.env.NODE_ENV === "development" && process.env.DASHBOARD_OPEN_SIGNIN === "true";
const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];

export function proxy(request: NextRequest) {
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
  // Skip Next internals, API routes and static asset folders.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|opt|\\.well-known).*)"],
};
