import { maintenance } from "@jerryqiu/sites/maintenance";
import { type NextRequest, NextResponse } from "next/server";

/**
 * While maintenance mode is on (see packages/sites/src/maintenance.ts: on by default in a production build, off with
 * MAINTENANCE_MODE=0) every public route answers with the shared "back soon" page. Paths kept open: the owner's studio and its sign-in and uploads, image and storage routes the studio needs, the print lab's file route and the calendar feed (plus the defaults: cron, webhooks, auth, health, revalidate).
 */
const OPEN = [
  "/studio",
  "/sign-in",
  "/api/studio",
  "/api/upload",
  "/api/storage",
  "/api/img",
  "/api/print-file",
  "/api/ics",
];

export function proxy(request: NextRequest) {
  return maintenance(request, OPEN) ?? NextResponse.next();
}

export const config = {
  // Everything except Next's own static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
