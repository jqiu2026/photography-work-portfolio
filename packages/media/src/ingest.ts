import { type Database, schema } from "@jerryqiu/db";
import type { StorageProvider } from "@jerryqiu/storage";
import { createHash } from "node:crypto";
import { and, eq, isNotNull, isNull, ne } from "drizzle-orm";
import { ImageError, type Processed, contentTypeFor, hamming, processImage, safeName } from "./process";

export type Ingested = {
  id: string;
  similarTo?: { id: string; filename: string; distance: number };
  replaced: boolean;
  /** true when an exact copy was already in the library: `id` is that photograph and nothing was stored */
  duplicate?: boolean;
};

/**
 * Turns an original (already in the private store, or passed as bytes) into a media row with public derivatives.
 *  - New: random id, original at `orig/<id>/<name>` (private), derivatives at `img/<id>/<width>.<format>` (public).
 *  - Replace-in-place (`replaceId`): same id, new original and derivatives, so every page that uses it updates.
 *  - Exact duplicates (same SHA-256) are not stored again; see `duplicate`.
 *  - People: images are flagged `needs_review` with contains_people when `defaultReview` is set (used for imported
 *    school-event photos, per docs/project/11-legal-and-compliance.md).
 */
export async function ingestImage(opts: {
  db: Database;
  originals: StorageProvider;
  publicStore: StorageProvider;
  filename: string;
  bytes: Buffer;
  user: string;
  id?: string;
  replaceId?: string;
  originalKey?: string;
  defaultReview?: boolean;
  alt?: string;
}): Promise<Ingested> {
  // the same file is never stored twice: an exact copy (same SHA-256) answers with the photograph already in the library,
  // and a staged original the caller already put in storage is removed
  const sha256 = createHash("sha256").update(opts.bytes).digest("hex");
  if (!opts.replaceId) {
    const [same] = await opts.db
      .select({ id: schema.media.id })
      .from(schema.media)
      .where(and(eq(schema.media.sha256, sha256), isNull(schema.media.deletedAt)))
      .limit(1);
    if (same) {
      if (opts.originalKey) await opts.originals.delete(opts.originalKey).catch(() => {});
      return { id: same.id, replaced: false, duplicate: true };
    }
  }
  const processed: Processed = await processImage(opts.bytes, { owner: "Jerry Qiu" });
  const id = opts.replaceId ?? opts.id ?? crypto.randomUUID();
  const name = safeName(opts.filename);
  const originalKey = opts.originalKey ?? `orig/${id}/${name}`;
  if (!opts.originalKey)
    await opts.originals.put(originalKey, new Uint8Array(opts.bytes), {
      contentType: contentTypeFor(processed.format),
    });

  const stored: { width: number; format: string; key: string }[] = [];
  for (const d of processed.derivatives) {
    const key = `img/${id}/${d.width}.${d.format}`;
    await opts.publicStore.put(key, new Uint8Array(d.buffer), {
      contentType: d.format === "avif" ? "image/avif" : "image/webp",
    });
    stored.push({ width: d.width, format: d.format, key });
  }

  let similarTo: Ingested["similarTo"];
  const candidates = await opts.db
    .select({ id: schema.media.id, filename: schema.media.filename, phash: schema.media.phash })
    .from(schema.media)
    .where(and(isNotNull(schema.media.phash), isNull(schema.media.deletedAt), ne(schema.media.id, id)));
  for (const c of candidates) {
    const distance = hamming(processed.phash, c.phash as string);
    if (distance <= 3 && (!similarTo || distance < similarTo.distance))
      similarTo = { id: c.id, filename: c.filename, distance };
  }

  const row = {
    kind: "image" as const,
    filename: name,
    mime: contentTypeFor(processed.format),
    bytes: opts.bytes.length,
    width: processed.width,
    height: processed.height,
    color: processed.color,
    blur: processed.blur,
    phash: processed.phash,
    sha256,
    originalKey,
    derivatives: stored,
    exif: processed.exif,
    updatedAt: new Date(),
    updatedBy: opts.user,
  };
  if (opts.replaceId) {
    const [old] = await opts.db
      .select({ derivatives: schema.media.derivatives })
      .from(schema.media)
      .where(eq(schema.media.id, id))
      .limit(1);
    await opts.db.update(schema.media).set(row).where(eq(schema.media.id, id));
    // remove derivatives that no longer exist (e.g. fewer widths for a smaller image)
    const keep = new Set(stored.map((s) => s.key));
    for (const o of old?.derivatives ?? []) if (!keep.has(o.key)) await opts.publicStore.delete(o.key);
    return { id, similarTo, replaced: true };
  }
  await opts.db.insert(schema.media).values({
    id,
    ...row,
    alt: opts.alt ?? null,
    createdBy: opts.user,
    reviewStatus: opts.defaultReview ? "needs_review" : "ok",
    containsPeople: Boolean(opts.defaultReview),
  });
  return { id, similarTo, replaced: false };
}

export { ImageError };
