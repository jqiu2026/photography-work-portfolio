import { timingSafeEqual } from "node:crypto";
import { getDb } from "@jerryqiu/db";
import { runScheduled } from "@/lib/automations";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Vercel Cron (hourly): releases lapsed booking holds, sends due recurring and instalment invoices, and runs the automation
 * rules. Refuses unless CRON_SECRET is set and sent as a bearer token. Everything it does is idempotent, so a repeat or an
 * overlap is harmless.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const got = (request.headers.get("authorization") ?? "").replace(/^Bearer /, "");
  const ok =
    Boolean(secret) &&
    secret?.length === got.length &&
    timingSafeEqual(Buffer.from(secret as string), Buffer.from(got));
  if (!ok) return new Response("Unauthorized", { status: 401 });
  const db = getDb();
  if (!db) return Response.json({ error: "No database" }, { status: 503 });
  return Response.json(await runScheduled(db), { headers: { "Cache-Control": "no-store" } });
}
