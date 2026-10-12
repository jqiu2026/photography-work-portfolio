import { type NextRequest, NextResponse } from "next/server";

/**
 * Host routing for the hub app (A33). One deployment serves several hostnames:
 *   music.jerryqiu.com/x  -> /music/x      flying.jerryqiu.com/x -> /flying/x
 * In production jerryqiu.com/music and /flying redirect (308) to their own hostname so each page has one
 * canonical URL. In dev the path forms (localhost:3000/music) work as they are.
 *
 * It also guards /admin: no session cookie means a redirect to /sign-in. This is only the FIRST gate (cheap, signed-cookie
 * presence); the admin layout and every Server Action re-check the session and role against the database.
 * Self-contained on purpose: proxy code should not depend on shared modules.
 */
const HUB_URL = (process.env.NEXT_PUBLIC_HUB_URL ?? "https://jerryqiu.com").replace(/\/$/, "");
const SUBS = {
  music: process.env.NEXT_PUBLIC_MUSIC_URL ?? "https://music.jerryqiu.com",
  flying: process.env.NEXT_PUBLIC_FLYING_URL ?? "https://flying.jerryqiu.com",
} as const;
const OPEN_SIGNIN = process.env.NODE_ENV === "development" && process.env.DASHBOARD_OPEN_SIGNIN === "true";
const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];

export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  const { pathname } = request.nextUrl;
  const sub = host.startsWith("music.") ? "music" : host.startsWith("flying.") ? "flying" : null;

  if (sub) {
    // Already-prefixed paths (old links) are redirected to the clean URL.
    if (pathname === `/${sub}` || pathname.startsWith(`/${sub}/`)) {
      const url = request.nextUrl.clone();
      url.pathname = pathname.slice(sub.length + 1) || "/";
      return NextResponse.redirect(url, 308);
    }
    const url = request.nextUrl.clone();
    url.pathname = `/${sub}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

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

  if (process.env.NODE_ENV === "production") {
    for (const s of ["music", "flying"] as const) {
      // Same origin as the hub (path mode, e.g. test builds): nothing to redirect to.
      if (new URL(SUBS[s]).origin === new URL(HUB_URL).origin) continue;
      if (pathname === `/${s}` || pathname.startsWith(`/${s}/`)) {
        return NextResponse.redirect(
          new URL(`${SUBS[s].replace(/\/$/, "")}${pathname.slice(s.length + 1)}${request.nextUrl.search}`, HUB_URL),
          308,
        );
      }
    }
  }
  return NextResponse.next();
}

export const config = {
  // Skip Next internals, API routes and static asset folders.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|opt|sequence|\\.well-known).*)"],
};
