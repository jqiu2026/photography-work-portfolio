import { getDb, hitRateLimit } from "@jerryqiu/db";
import { recordIdle, recordSecurityEvent } from "@jerryqiu/db/gallery-security";
import { clientIpHash } from "@jerryqiu/protect";
import { NextResponse } from "next/server";
import { z } from "zod";
import { galleryAccess } from "@/lib/client-gallery";

export const dynamic = "force-dynamic";

const body = z.object({
  kind: z.string().max(20),
  combo: z.string().max(40).optional(),
  galleryId: z.string().uuid().optional(),
});
const no = (status: number, error: string) =>
  NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });

/**
 * The page guard reports a capture attempt (screenshot or save key, print, devtools, a screen-capture call) or an idle close.
 * Only a viewer with a live gallery session can post here, from this site; the gallery's own rule decides the response
 * (log, warn, or lock after N strikes). Rate limited per address so it cannot be used to fill the log.
 */
export async function POST(request: Request) {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return no(403, "Not allowed.");
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return no(400, "Bad request.");
  const db = getDb();
  const a = await galleryAccess(parsed.data.galleryId);
  if (!db || !a) return no(401, "No gallery session.");
  const ip = clientIpHash(request.headers);
  if (!(await hitRateLimit(db, `secev:${ip}`, 60, 600)).allowed) return no(429, "Too many reports.");
  if (parsed.data.kind === "idle") {
    await recordIdle(db, a.gallery.id, a.viewer, ip);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  }
  if (a.security.level !== "strict") return NextResponse.json({ ok: true, action: "ignored" });
  const r = await recordSecurityEvent(db, {
    galleryId: a.gallery.id,
    viewer: a.viewer,
    kind: parsed.data.kind,
    combo: parsed.data.combo,
    ipHash: ip,
  });
  return NextResponse.json(
    { ok: true, action: r.action, locked: r.locked, strikes: r.strikes, until: r.until?.toISOString() ?? null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
