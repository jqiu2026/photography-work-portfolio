import { getDb, hitRateLimit } from "@jerryqiu/db";
import * as gal from "@jerryqiu/db/galleries";
import { downloadsInLastDay } from "@jerryqiu/db/gallery-security";
import { embedViewerCode, viewerCode, zipStream } from "@jerryqiu/media";
import { clientIpHash } from "@jerryqiu/protect";
import { downloadsUnlocked, galleryAccess } from "@/lib/client-gallery";
import { baseName, zipPlan } from "@/lib/downloads";
import { derivativesStore, originalsStore } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const deny = (status: number, error: string) =>
  Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Client downloads (the portfolio's strict-tier gallery itself never shows an original):
 *   GET /client/download?m=<mediaId>&size=web|full[&g=<galleryId>]       one photograph
 *   GET /client/download?zip=1&size=web|full&part=1[&g=<galleryId>]      a ZIP part (large galleries come in parts)
 * Needs a passcode session for that gallery or a signed-in portal account that owns it; the gallery must be live, the
 * download policy must allow the size, and a download PIN (if set) must have been entered. Web size is a JPEG with the
 * invisible per-viewer watermark; full size is the original file. Every download is logged.
 */
export async function GET(request: Request) {
  const u = new URL(request.url);
  const size = u.searchParams.get("size") === "full" ? "full" : "web";
  const db = getDb();
  const a = await galleryAccess(u.searchParams.get("g") ?? undefined);
  if (!db || !a) return deny(401, "Open your gallery again to download.");
  if (a.state === "expired" || a.state === "archived" || a.state === "draft")
    return deny(403, "This gallery has expired. Extend it to download.");
  const g = a.gallery;
  if (!gal.downloadAllowed(g, size)) return deny(403, "Downloads are not enabled for this gallery.");
  if (g.downloadPinHash && !(await downloadsUnlocked(g.id))) return deny(403, "Enter the download PIN first.");
  const ip = clientIpHash(request.headers);
  const zip = u.searchParams.get("zip") === "1";
  const cap = a.security.maxDownloadsPerDay;
  if (cap && (await downloadsInLastDay(db, g.id, a.viewer)) >= cap)
    return deny(429, `The daily download limit (${cap}) has been reached. Try again tomorrow.`);
  if (!(await hitRateLimit(db, `dl:${zip ? "zip" : "one"}:${ip}`, zip ? 12 : 120, 600)).allowed)
    return deny(429, "Too many downloads. Wait a few minutes.");
  const contents = await gal.galleryContents(db, g.id);
  const headers = {
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, noai, noimageai",
  };

  const web = async (mediaId: string) => {
    const c = contents.find((x) => x.media.id === mediaId);
    if (!c) return null;
    const d =
      [...c.media.derivatives].filter((x) => x.format === "webp").sort((x, y) => y.width - x.width)[0] ??
      [...c.media.derivatives].sort((x, y) => y.width - x.width)[0];
    const obj = d ? await derivativesStore().get(d.key) : null;
    if (!obj) return null;
    return {
      name: `${baseName(c.media.filename)}-web.jpg`,
      bytes: await embedViewerCode(obj.body, viewerCode(a.viewer), "jpeg"),
    };
  };
  const full = async (mediaId: string) => {
    const c = contents.find((x) => x.media.id === mediaId);
    const obj = c ? await originalsStore().get(c.media.originalKey) : null;
    return c && obj ? { name: c.media.filename, bytes: Buffer.from(obj.body), type: c.media.mime } : null;
  };

  if (!zip) {
    const mediaId = u.searchParams.get("m") ?? "";
    const f = size === "full" ? await full(mediaId) : await web(mediaId);
    if (!f) return deny(404, "That photograph is not available.");
    await gal.logDownload(db, {
      galleryId: g.id,
      mediaId,
      kind: size,
      viewer: a.viewer,
      ipHash: ip,
      bytes: f.bytes.length,
    });
    return new Response(new Uint8Array(f.bytes), {
      headers: {
        ...headers,
        "Content-Type": "type" in f ? String(f.type) : "image/jpeg",
        "Content-Disposition": `attachment; filename="${f.name.replace(/"/g, "")}"`,
        "Content-Length": String(f.bytes.length),
      },
    });
  }

  const parts = zipPlan(
    contents.map((c) => ({ mediaId: c.media.id, filename: c.media.filename, bytes: c.media.bytes })),
    size,
  );
  const part = Number(u.searchParams.get("part") ?? "1");
  if (!Number.isInteger(part) || part < 1 || part > parts.length) return deny(404, "No such part.");
  const mine = parts[part - 1];
  await gal.logDownload(db, {
    galleryId: g.id,
    kind: size === "full" ? "zip-full" : "zip-web",
    part,
    viewer: a.viewer,
    ipHash: ip,
  });
  const stream = zipStream(
    mine.map((it) => ({
      name: size === "full" ? it.filename : `${baseName(it.filename)}-web.jpg`,
      read: async () => {
        const f = size === "full" ? await full(it.mediaId) : await web(it.mediaId);
        return f ? new Uint8Array(f.bytes) : new Uint8Array();
      },
    })),
  );
  const safeTitle =
    g.title
      .replace(/[^A-Za-z0-9._ -]/g, "")
      .trim()
      .replace(/\s+/g, "-") || "gallery";
  return new Response(stream, {
    headers: {
      ...headers,
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${safeTitle}-${size}-part-${part}-of-${parts.length}.zip"`,
      "X-Zip-Parts": String(parts.length),
    },
  });
}
