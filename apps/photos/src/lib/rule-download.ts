import "server-only";
import type { Database } from "@jerryqiu/db";
import { schema } from "@jerryqiu/db";
import * as gal from "@jerryqiu/db/galleries";
import { rulesForAlbum } from "@jerryqiu/db/gallery-extras";
import { zipStream } from "@jerryqiu/media";
import { and, eq, gte, or, sql } from "drizzle-orm";
import type { GalleryAccess } from "@/lib/client-gallery";
import { unlockedRules } from "@/lib/client-gallery";
import { baseName, zipPlan } from "@/lib/downloads";
import { ruleFile, sizeTag } from "@/lib/gallery-files";

type Contents = Awaited<ReturnType<typeof gal.galleryContents>>;

const deny = (status: number, error: string) =>
  Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });

/**
 * A visitor's free download under one of the gallery's rules: only a rule that applies to the photograph (its album's rules,
 * otherwise the gallery-wide ones), only after its PIN was entered, only within its limit, and resized and watermarked as the
 * rule says. One photograph, or a ZIP of every photograph the rule covers.
 */
export async function ruleDownload(opts: {
  db: Database;
  a: GalleryAccess;
  url: URL;
  contents: Contents;
  ip: string;
  headers: Record<string, string>;
}) {
  const { db, a, url, contents, ip, headers } = opts;
  const g = a.gallery;
  const ruleId = url.searchParams.get("rule") ?? "";
  const rules = await db
    .select()
    .from(schema.studioDownloadRules)
    .where(eq(schema.studioDownloadRules.galleryId, g.id));
  const rule = rules.find((r) => r.id === ruleId);
  if (!rule) return deny(404, "That download is not offered.");
  if (rule.pinHash && !(await unlockedRules(g.id)).includes(rule.id))
    return deny(403, "Enter the PIN for this download first.");
  const [wm] = rule.watermarkId
    ? await db.select().from(schema.studioWatermarks).where(eq(schema.studioWatermarks.id, rule.watermarkId))
    : [];
  const kind = `rule:${rule.id}`;
  const used = async () => {
    const [{ n }] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.studioDownloadEvents)
      .where(
        and(
          eq(schema.studioDownloadEvents.galleryId, g.id),
          eq(schema.studioDownloadEvents.kind, kind),
          or(eq(schema.studioDownloadEvents.viewer, a.viewer), eq(schema.studioDownloadEvents.ipHash, ip)),
          gte(schema.studioDownloadEvents.at, new Date(Date.now() - 24 * 3600_000)),
        ),
      );
    return n;
  };
  const watermark = wm ?? null;
  const covers = (albumId: string | null) => rulesForAlbum(rules, albumId).some((r) => r.id === rule.id);

  if (url.searchParams.get("zip") === "1") {
    if (!rule.showAll) return deny(403, "This rule does not offer a ZIP.");
    const mine = contents.filter((c) => covers(c.item.albumId));
    const left = rule.perVisitor ? Math.max(0, rule.perVisitor - (await used())) : Number.POSITIVE_INFINITY;
    if (rule.perVisitor && left < mine.length) return deny(429, "This ZIP would pass your download limit.");
    const parts = zipPlan(
      mine.map((c) => ({ mediaId: c.media.id, filename: c.media.filename, bytes: c.media.bytes })),
      "web",
    );
    const part = Number(url.searchParams.get("part") ?? "1");
    if (!Number.isInteger(part) || part < 1 || part > parts.length) return deny(404, "No such part.");
    const names = new Map(mine.map((c) => [c.media.id, c.media.filename]));
    await gal.logDownload(db, { galleryId: g.id, kind, part, viewer: a.viewer, ipHash: ip });
    const stream = zipStream(
      parts[part - 1].map((it) => ({
        name: `${baseName(names.get(it.mediaId) ?? it.filename)}-${rule.preset === "custom" ? (rule.maxPx ? `${rule.maxPx}px` : "original") : (sizeTag[rule.preset] ?? "original")}.jpg`,
        read: async () => {
          const f = await ruleFile(contents, it.mediaId, rule, watermark, a.viewer);
          return f ? new Uint8Array(f.bytes) : new Uint8Array();
        },
      })),
    );
    return new Response(stream, {
      headers: {
        ...headers,
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${baseName(g.title).replace(/[^A-Za-z0-9._-]/g, "-") || "gallery"}-part-${part}-of-${parts.length}.zip"`,
      },
    });
  }

  const mediaId = url.searchParams.get("m") ?? "";
  const item = contents.find((c) => c.media.id === mediaId);
  if (!item || !covers(item.item.albumId)) return deny(404, "That photograph is not part of this download.");
  if (rule.perVisitor && (await used()) >= rule.perVisitor)
    return deny(429, `You have used the ${rule.perVisitor} downloads this rule allows.`);
  const f = await ruleFile(contents, mediaId, rule, watermark, a.viewer);
  if (!f) return deny(404, "That photograph is not available.");
  await gal.logDownload(db, { galleryId: g.id, mediaId, kind, viewer: a.viewer, ipHash: ip, bytes: f.bytes.length });
  return new Response(new Uint8Array(f.bytes), {
    headers: {
      ...headers,
      "Content-Type": "image/jpeg",
      "Content-Disposition": `attachment; filename="${f.name.replace(/"/g, "")}"`,
      "Content-Length": String(f.bytes.length),
    },
  });
}
