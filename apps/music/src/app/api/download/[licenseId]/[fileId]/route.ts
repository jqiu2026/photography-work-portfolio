import { getDb } from "@jerryqiu/db";
import * as m from "@jerryqiu/db/music";
import { licensePdf, stampScore } from "@jerryqiu/scores";
import { NextResponse } from "next/server";
import { allow, ipHash } from "@/lib/public-action";
import { buyerId } from "@/lib/session";
import { scoreStore } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const safe = (s: string) =>
  s
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "score";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const deny = (status: number, error: string) =>
  NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });

/**
 * A score for one license. Who may ask: the holder of the order link (`?t=`) or the signed-in buyer who owns the license.
 * A PDF is stamped for this buyer on every request (name and license number on every page, license page at the end); the
 * stored original is never sent. Other files go out as they are. The license page itself ("license") does not use up
 * a download.
 */
export async function GET(req: Request, { params }: { params: Promise<{ licenseId: string; fileId: string }> }) {
  const { licenseId, fileId } = await params;
  if (!UUID.test(licenseId) || !(fileId === "license" || UUID.test(fileId))) return deny(404, "Not found.");
  if (!(await allow("download", 60, 3600))) return deny(429, "Too many downloads. Please wait a while.");
  const db = getDb();
  if (!db) return deny(503, "Downloads are not open yet.");
  const ctx = await m.licenseWithContext(db, licenseId);
  if (!ctx) return deny(404, "Not found.");

  const token = new URL(req.url).searchParams.get("t");
  const viaToken = token ? (await m.orderByAccessToken(db, token))?.order.id === ctx.order.id : false;
  const viaSession = !viaToken && (await buyerId()) === ctx.license.buyerId && ctx.license.buyerId !== null;
  if (!viaToken && !viaSession) return deny(403, "This link is not valid for this license.");
  if (ctx.license.revokedAt || ctx.order.status !== "paid") return deny(403, "This license is not active.");

  const facts = {
    licenseNo: ctx.license.licenseNo,
    tier: ctx.license.tier,
    holder: ctx.license.holder,
    organization: ctx.license.organization ?? undefined,
    email: ctx.order.email,
    title: ctx.work.title,
    issuedAt: ctx.license.issuedAt,
  };
  const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

  if (fileId === "license") {
    const bytes = await licensePdf(facts);
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        ...headers,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safe(ctx.license.licenseNo)}-license.pdf"`,
      },
    });
  }

  const check = await m.checkDownload(db, licenseId, fileId);
  if (!check.ok) return deny(403, check.reason);
  const stored = await scoreStore().get(check.file.storageKey);
  if (!stored) return deny(404, "This file is not available right now. Please write and it will be fixed.");
  let body: Uint8Array = stored.body;
  if (check.file.mime === "application/pdf") {
    try {
      body = await stampScore(stored.body, facts);
    } catch (e) {
      console.error("[music] could not stamp", check.file.id, String(e));
      return deny(500, "This file could not be prepared. Please write and it will be fixed.");
    }
  }
  await m.recordDownload(db, licenseId, fileId, await ipHash());
  const ext = check.file.filename.includes(".") ? check.file.filename.slice(check.file.filename.lastIndexOf(".")) : "";
  return new NextResponse(Buffer.from(body), {
    headers: {
      ...headers,
      "Content-Type": check.file.mime,
      "Content-Disposition": `attachment; filename="${safe(`${ctx.work.slug}-${check.file.label}-${ctx.license.licenseNo}`)}${safe(ext)}"`,
    },
  });
}
