import { getDb, hitRateLimit } from "@jerryqiu/db";
import { NextResponse } from "next/server";
import { type Action, type AppUser, AuthorizationError } from "@jerryqiu/auth/server";
import { requireUser } from "@/auth";

/**
 * Wraps an admin Route Handler: re-checks the session and role on the server (never trusting the proxy), rate limits per
 * user, and turns failures into JSON. Route Handlers are not covered by CSRF protection the way Server Actions are, so
 * mutating handlers also require a same-origin request (Origin header) in production.
 */
export function guardedRoute<Ctx>(
  access: Action,
  handler: (req: Request, ctx: Ctx, user: AppUser) => Promise<Response>,
  opts: { limit?: number; mutating?: boolean } = {},
) {
  return async (req: Request, ctx: Ctx): Promise<Response> => {
    let user: AppUser;
    try {
      user = await requireUser(access);
    } catch (e) {
      if (e instanceof AuthorizationError)
        return NextResponse.json({ error: e.message }, { status: e.message.includes("sign in") ? 401 : 403 });
      throw e;
    }
    if ((opts.mutating ?? req.method !== "GET") && process.env.NODE_ENV === "production") {
      const origin = req.headers.get("origin");
      const host = req.headers.get("host");
      if (!origin || !host || new URL(origin).host !== host)
        return NextResponse.json({ error: "Cross-site request refused." }, { status: 403 });
    }
    const db = getDb();
    if (!db) return NextResponse.json({ error: "The database isn't set up." }, { status: 503 });
    const rl = await hitRateLimit(
      db,
      `route:${user.email}:${new URL(req.url).pathname.split("/").slice(0, 5).join("/")}`,
      opts.limit ?? 600,
      60,
    );
    if (!rl.allowed) return NextResponse.json({ error: "Too many requests. Wait a moment." }, { status: 429 });
    try {
      return await handler(req, ctx, user);
    } catch (e) {
      console.error("[route] failed", req.method, new URL(req.url).pathname, e);
      return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
    }
  };
}
