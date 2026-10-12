import { timingSafeEqual } from "node:crypto";
import { getDb, schema } from "@jerryqiu/db";
import { and, eq, lt } from "drizzle-orm";
import { purgeExpired } from "@/lib/trash";

export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return false; // never open when unset or weak
  const given = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Vercel Cron calls this daily with `Authorization: Bearer $CRON_SECRET`: empties the old trash, trims old logs. */
export async function GET(request: Request) {
  if (!authorized(request)) return new Response("Unauthorized", { status: 401 });
  const db = getDb();
  if (!db) return Response.json({ ok: false, error: "no database" }, { status: 503 });
  const trash = await purgeExpired(db);
  // Rate-limit rows older than a day are dead weight. Only messages marked spam expire (after 90 days); real ones never do.
  await db.delete(schema.rateLimits).where(lt(schema.rateLimits.windowStart, new Date(Date.now() - 86_400_000)));
  const spam = await db
    .delete(schema.inboxMessages)
    .where(
      and(
        eq(schema.inboxMessages.status, "spam"),
        lt(schema.inboxMessages.createdAt, new Date(Date.now() - 90 * 86_400_000)),
      ),
    )
    .returning({ id: schema.inboxMessages.id });
  return Response.json({ ok: true, ...trash, spamRemoved: spam.length });
}
