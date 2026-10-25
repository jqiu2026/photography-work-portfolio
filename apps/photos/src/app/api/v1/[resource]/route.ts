import { getDb, hitRateLimit } from "@jerryqiu/db";
import { checkApiKey } from "@jerryqiu/db/api-keys";
import * as schema from "@jerryqiu/db/schema";
import { clientIpHash } from "@jerryqiu/protect";
import { desc, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * The owner's read-only REST API: `GET /api/v1/clients | jobs | invoices | galleries` with
 * `Authorization: Bearer jqk_...`. Newest first, at most 200 rows (`?limit=` lowers it). Keys are made and revoked in
 * the studio (Automations). Nothing can be changed through it.
 */
export async function GET(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Not available." }, { status: 503 });
  const limited = await hitRateLimit(db, `api:${clientIpHash(request.headers)}`, 120, 60);
  if (!limited.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const token = /^Bearer (\S+)$/.exec(request.headers.get("authorization") ?? "")?.[1] ?? "";
  if (!(await checkApiKey(db, token)))
    return NextResponse.json({ error: "Send a valid key as 'Authorization: Bearer <key>'." }, { status: 401 });
  const n = Math.min(200, Math.max(1, Number(new URL(request.url).searchParams.get("limit")) || 200));
  let data: unknown;
  switch (resource) {
    case "clients":
      data = await db
        .select()
        .from(schema.studioClients)
        .where(isNull(schema.studioClients.deletedAt))
        .orderBy(desc(schema.studioClients.createdAt))
        .limit(n);
      break;
    case "jobs":
      data = await db.select().from(schema.studioJobs).orderBy(desc(schema.studioJobs.createdAt)).limit(n);
      break;
    case "invoices":
      data = (
        await db.select().from(schema.studioInvoices).orderBy(desc(schema.studioInvoices.createdAt)).limit(n)
      ).map(({ tokenHash: _t, ...rest }) => rest);
      break;
    case "galleries":
      data = (
        await db.select().from(schema.studioGalleries).orderBy(desc(schema.studioGalleries.createdAt)).limit(n)
      ).map(({ passcodeHash: _p, ...rest }) => rest);
      break;
    default:
      return NextResponse.json(
        { error: "Unknown resource. Use clients, jobs, invoices or galleries." },
        { status: 404 },
      );
  }
  return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
}
