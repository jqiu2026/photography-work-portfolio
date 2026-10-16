import { getDb, schema } from "@jerryqiu/db";
import * as gal from "@jerryqiu/db/galleries";
import { safeName } from "@jerryqiu/media";
import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { guardedRoute } from "@/lib/route-guard";
import { originalsStore } from "@/lib/storage";

const body = z.object({
  galleryId: z.string().uuid(),
  filename: z.string().trim().min(1).max(200),
  size: z
    .number()
    .int()
    .min(1)
    .max(60 * 1024 * 1024),
  type: z.enum(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif", "image/tiff"]),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  albumId: z.string().uuid().optional(),
});

/**
 * Step 1 of a gallery upload. Exact duplicates (same SHA-256) are not uploaded again: if the photograph already exists it is
 * simply added to this gallery. Otherwise returns how to send the file: a signed PUT (local development) or Vercel Blob's
 * client upload (production). Nothing is trusted yet; the bytes are validated again in step 2.
 */
export const POST = guardedRoute(
  "studio.access",
  async (req) => {
    const parsed = body.safeParse(await req.json().catch(() => null));
    if (!parsed.success)
      return NextResponse.json(
        { error: "Unsupported file. Use a JPEG, PNG, WebP, AVIF, GIF or TIFF under 60 MB." },
        { status: 400 },
      );
    const { galleryId, filename, type, sha256, albumId } = parsed.data;
    const db = getDb();
    if (!db) return NextResponse.json({ error: "No database." }, { status: 503 });
    const [g] = await db
      .select({ id: schema.studioGalleries.id })
      .from(schema.studioGalleries)
      .where(and(eq(schema.studioGalleries.id, galleryId), isNull(schema.studioGalleries.deletedAt)));
    if (!g) return NextResponse.json({ error: "Unknown gallery." }, { status: 404 });
    const [same] = await db
      .select({ id: schema.media.id })
      .from(schema.media)
      .where(and(eq(schema.media.sha256, sha256), isNull(schema.media.deletedAt)))
      .limit(1);
    if (same) {
      const already = await db
        .select()
        .from(schema.studioGalleryItems)
        .where(and(eq(schema.studioGalleryItems.galleryId, galleryId), eq(schema.studioGalleryItems.mediaId, same.id)));
      if (!already.length) await gal.addItems(db, galleryId, [same.id], albumId ?? null);
      return NextResponse.json({ duplicate: true, added: !already.length, mediaId: same.id });
    }
    const id = crypto.randomUUID();
    const key = `orig/${id}/${safeName(filename)}`;
    if ((process.env.STORAGE_DRIVER ?? "local") === "blob")
      return NextResponse.json({ mode: "blob", id, key, contentType: type });
    const uploadUrl = await originalsStore().getSignedUrl(key, { expiresIn: 600, method: "PUT", contentType: type });
    return NextResponse.json({ mode: "signed", id, key, uploadUrl, contentType: type });
  },
  { limit: 600 },
);
