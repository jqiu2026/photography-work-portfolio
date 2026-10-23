import { getDb, hitRateLimit } from "@jerryqiu/db";
import { notify } from "@jerryqiu/db/automation";
import { addPrivacyRequest } from "@jerryqiu/db/business";
import { StudioError } from "@jerryqiu/db/studio";
import { clientIpHash } from "@jerryqiu/protect";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const body = z.object({
  name: z.string().trim().max(120),
  email: z.string().trim().max(200),
  details: z.string().trim().max(4000),
  consent: z.literal(true, { error: "Please tick the box so I can keep your request." }),
  /** Honeypot: real visitors never see or fill this. */
  website: z.string().max(500).optional().default(""),
});

/** `POST /api/privacy-request`: "please take me out of a photograph". Limited per network address; the owner is told at once. */
export async function POST(request: Request) {
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the form." }, { status: 400 });
  if (parsed.data.website) return NextResponse.json({ ok: true });
  const db = getDb();
  if (!db) return NextResponse.json({ error: "This is not available right now." }, { status: 503 });
  const ip = clientIpHash(request.headers);
  const one = await hitRateLimit(db, `privacy:${ip}`, 4, 3600);
  const all = await hitRateLimit(db, "privacy:all", 100, 3600);
  if (!one.allowed || !all.allowed)
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  try {
    const r = await addPrivacyRequest(db, parsed.data);
    await notify(db, {
      kind: "privacy",
      title: `Photo removal request from ${r.name}`,
      body: r.details.slice(0, 200),
      link: "/studio/privacy",
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof StudioError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
}
