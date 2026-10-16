import { createHash } from "node:crypto";
import { getDb, schema, writeAudit } from "@jerryqiu/db";
import * as gal from "@jerryqiu/db/galleries";
import { ImageError, ingestImage, safeName } from "@jerryqiu/media";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { guardedRoute } from "@/lib/route-guard";
import { derivativesStore, originalsStore } from "@/lib/storage";

export const maxDuration = 60;

const body = z.object({
  id: z.string().uuid(),
  galleryId: z.string().uuid(),
  filename: z.string().trim().min(1).max(200),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  albumId: z.string().uuid().optional(),
});

/**
 * Step 2: the browser has put the file in private storage. Read it back, check it is the file that was announced (SHA-256),
 * validate the real bytes (format, size, pixel count), create the four sizes with GPS and personal EXIF stripped, keep the
 * original private, and add the photograph to the gallery. On any failure the stray original is deleted.
 */
export const POST = guardedRoute(
  "studio.access",
  async (req, _ctx, user) => {
    const parsed = body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Bad request." }, { status: 400 });
    const { id, galleryId, filename, sha256, albumId } = parsed.data;
    const db = getDb();
    if (!db) return NextResponse.json({ error: "No database." }, { status: 503 });
    const key = `orig/${id}/${safeName(filename)}`;
    const obj = await originalsStore().get(key);
    if (!obj) return NextResponse.json({ error: "The upload didn't arrive. Try again." }, { status: 400 });
    const bytes = Buffer.from(obj.body);
    try {
      if (createHash("sha256").update(bytes).digest("hex") !== sha256)
        throw new ImageError("The file changed during upload. Try again.");
      const r = await ingestImage({
        db,
        originals: originalsStore(),
        publicStore: derivativesStore(),
        filename,
        bytes,
        user: user.email,
        id,
        originalKey: key,
      });
      await db.update(schema.media).set({ sha256 }).where(eq(schema.media.id, r.id));
      await gal.addItems(db, galleryId, [r.id], albumId ?? null);
      await writeAudit(db, {
        actor: user.email,
        action: "studio.gallery.upload",
        entity: "media",
        entityId: r.id,
        site: "photos",
        summary: `Uploaded ${safeName(filename)} to a gallery`,
      });
      return NextResponse.json({ mediaId: r.id, similarTo: r.similarTo ?? null });
    } catch (e) {
      await originalsStore()
        .delete(key)
        .catch(() => {});
      if (e instanceof ImageError) return NextResponse.json({ error: e.message }, { status: 422 });
      throw e;
    }
  },
  { limit: 600 },
);
