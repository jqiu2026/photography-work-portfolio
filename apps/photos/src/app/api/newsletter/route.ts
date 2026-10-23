import { getDb, hitRateLimit } from "@jerryqiu/db";
import { subscribe } from "@jerryqiu/db/newsletter";
import { StudioError } from "@jerryqiu/db/studio";
import { sendTemplate } from "@jerryqiu/email";
import { clientIpHash } from "@jerryqiu/protect";
import { getSite } from "@jerryqiu/sites";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const body = z.object({
  email: z.string().trim().max(200),
  source: z.string().max(80).optional(),
  /** Honeypot: real visitors never see or fill this. */
  website: z.string().max(500).optional().default(""),
});

/**
 * `POST /api/newsletter`: starts a double opt-in signup. The answer is the same whether the address is new, pending or
 * already confirmed, so the list cannot be probed. Limited per network address; a filled honeypot is dropped silently.
 */
export async function POST(request: Request) {
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter your email address." }, { status: 400 });
  if (parsed.data.website) return NextResponse.json({ ok: true });
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Signup is not available right now." }, { status: 503 });
  const ipHash = clientIpHash(request.headers);
  const limited = await hitRateLimit(db, `newsletter:${ipHash}`, 5, 600);
  const global = await hitRateLimit(db, "newsletter:all", 200, 3600);
  if (!limited.allowed || !global.allowed)
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  try {
    const r = await subscribe(db, { email: parsed.data.email, source: parsed.data.source ?? "footer" });
    if (r.status === "pending" && r.token) {
      const link = `${getSite("photos").url}/newsletter/confirm?t=${encodeURIComponent(r.token)}`;
      await sendTemplate(db, parsed.data.email.trim().toLowerCase(), "newsletter-confirm", {
        link,
        linkLabel: "Confirm my email",
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof StudioError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
}
