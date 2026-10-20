import { type NextRequest, NextResponse } from "next/server";
import { maintenanceHtml } from "./maintenance-html";

/**
 * Maintenance mode for jerryqiu.com. Every app calls `maintenance()` first in its proxy; while the mode is on, every
 * public route answers with the same self-contained "back soon" page (HTTP 503, Retry-After, noindex) and never reaches
 * a layout, a page or the database, so it holds even when the database is not there.
 *
 * The mode: `MAINTENANCE_MODE=1` (or true, on, yes) turns it on; `0` (or false, off, no) turns it off; when the variable is
 * unset it is ON in a production build and OFF in development and tests. So a deployment of this branch shows the page
 * with no setup, and `MAINTENANCE_MODE=0` brings the site back (for example on a preview).
 */
const OFF = new Set(["0", "false", "off", "no"]);
const ON = new Set(["1", "true", "on", "yes"]);

export function maintenanceOn(env: Record<string, string | undefined> = process.env): boolean {
  const v = (env.MAINTENANCE_MODE ?? "").trim().toLowerCase();
  if (ON.has(v)) return true;
  if (OFF.has(v)) return false;
  return env.NODE_ENV === "production";
}

/** Paths that keep working in every app: scheduled jobs, payment and print-lab callbacks, sign-in callbacks, health checks. */
export const ALWAYS_ALLOWED = [
  "/api/cron",
  "/api/webhooks",
  "/api/auth",
  "/api/health",
  "/api/revalidate",
  "/.well-known",
];

/** How long a crawler or a browser should wait before asking again (seconds). */
export const RETRY_AFTER = "86400";

const inside = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}/`);

const headers = (type: string) => ({
  "Content-Type": type,
  "Retry-After": RETRY_AFTER,
  "X-Robots-Tag": "noindex, nofollow",
  "Cache-Control": "no-store, max-age=0",
});

/**
 * Returns the maintenance response for `request`, or `null` when the request should carry on to the app (mode off, or
 * the path is exempt). `allow` lists the path prefixes this app keeps open on top of `ALWAYS_ALLOWED`.
 */
export function maintenance(request: NextRequest, allow: readonly string[] = []): NextResponse | null {
  if (!maintenanceOn()) return null;
  const path = request.nextUrl.pathname;
  if ([...ALWAYS_ALLOWED, ...allow].some((p) => inside(path, p))) return null;

  if (path === "/robots.txt")
    return new NextResponse("User-agent: *\nDisallow: /\n", { status: 200, headers: { "Content-Type": "text/plain" } });
  if (path === "/sitemap.xml" || path.startsWith("/sitemap/"))
    return new NextResponse("Not found", { status: 404, headers: { "Content-Type": "text/plain" } });
  if (path === "/api" || path.startsWith("/api/"))
    return new NextResponse(
      JSON.stringify({ error: "maintenance", message: "This site is down for a rebuild. Back soon." }),
      {
        status: 503,
        headers: headers("application/json"),
      },
    );

  const html = maintenanceHtml.replaceAll("%YEAR%", String(new Date().getFullYear()));
  return new NextResponse(request.method === "HEAD" ? null : html, {
    status: 503,
    headers: headers("text/html; charset=utf-8"),
  });
}
