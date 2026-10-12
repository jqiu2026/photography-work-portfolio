import { timingSafeEqual } from "node:crypto";
import { getDb } from "@jerryqiu/db";
import { purgeExpiredExternal } from "@jerryqiu/shootproof";
import { derivativesStore } from "@/lib/storage";

export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return false;
  const given = Buffer.from((request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, ""));
  const want = Buffer.from(secret);
  return given.length === want.length && timingSafeEqual(given, want);
}

/** Vercel Cron (hourly): removes imported ShootProof photos whose time is up. */
export async function GET(request: Request) {
  if (!authorized(request)) return new Response("Unauthorized", { status: 401 });
  const db = getDb();
  if (!db) return Response.json({ ok: false, error: "no database" }, { status: 503 });
  return Response.json({ ok: true, purged: await purgeExpiredExternal(db, derivativesStore()) });
}
