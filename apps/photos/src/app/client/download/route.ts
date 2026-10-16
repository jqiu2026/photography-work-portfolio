import { getDb, hitRateLimit } from "@jerryqiu/db";
import * as gal from "@jerryqiu/db/galleries";
import { readShop } from "@jerryqiu/db/gallery-shop";
import { downloadsInLastDay } from "@jerryqiu/db/gallery-security";
import { zipStream } from "@jerryqiu/media";
import { clientIpHash } from "@jerryqiu/protect";
import { downloadsUnlocked, galleryAccess, lockedMediaIds } from "@/lib/client-gallery";
import { baseName, zipPlan } from "@/lib/downloads";
import { fullFile, webFile } from "@/lib/gallery-files";
import { ruleDownload } from "@/lib/rule-download";

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
  // a visitor's free download under one of the gallery's rules is checked in ruleDownload; without a rule they only get the
  // legacy free web-size copies, and only when the studio allows them
  const viaRule = a.role === "visitor" && u.searchParams.has("rule");
  if (!viaRule) {
    if (a.role === "visitor") {
      if (size !== "web" || readShop(g.shop).freeDownloads !== "web")
        return deny(403, "Downloads are available in the shop.");
    } else if (!gal.downloadAllowed(g, size)) return deny(403, "Downloads are not enabled for this gallery.");
  }
  if (a.role === "client" && g.downloadPinHash && !(await downloadsUnlocked(g.id)))
    return deny(403, "Enter the download PIN first.");
  const ip = clientIpHash(request.headers);
  const zip = u.searchParams.get("zip") === "1";
  const cap = a.security.maxDownloadsPerDay;
  if (cap && (await downloadsInLastDay(db, g.id, a.viewer)) >= cap)
    return deny(429, `The daily download limit (${cap}) has been reached. Try again tomorrow.`);
  if (!(await hitRateLimit(db, `dl:${zip ? "zip" : "one"}:${ip}`, zip ? 12 : 120, 600)).allowed)
    return deny(429, "Too many downloads. Wait a few minutes.");
  const shut = await lockedMediaIds(db, g.id);
  const contents = (await gal.galleryContents(db, g.id)).filter((c) => !shut.has(c.media.id));
  const headers = {
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, noai, noimageai",
  };

  if (viaRule) return ruleDownload({ db, a, url: u, contents, ip, headers });

  const web = (mediaId: string) => webFile(contents, mediaId, a.viewer);
  const full = (mediaId: string) => fullFile(contents, mediaId);

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
