import { type Database, getDb, schema } from "@jerryqiu/db";
import { ImageError, ingestImage, safeName } from "@jerryqiu/media";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { writeAudit } from "@jerryqiu/db";
import { guardedRoute } from "@/lib/route-guard";
import { touch } from "@/lib/revalidate";
import { derivativesStore, originalsStore } from "@/lib/storage";

export const maxDuration = 60;

const body = z.object({
  id: z.string().uuid(),
  filename: z.string().trim().min(1).max(200),
  replace: z.boolean().optional(),
});

/**
 * Step 2: the browser has put the file in private storage. Read it back, validate the real bytes (format, size, pixel
 * count), create derivatives with GPS/personal EXIF stripped, and record it. On any failure the stray original is deleted.
 */
export const POST = guardedRoute(
  "media.write",
  async (req, _ctx, user) => {
    const parsed = body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Bad request." }, { status: 400 });
    const { id, filename, replace } = parsed.data;
    const db = getDb() as Database;
    const key = `orig/${id}/${safeName(filename)}`;
    const obj = await originalsStore().get(key);
    if (!obj) return NextResponse.json({ error: "The upload didn't arrive. Try again." }, { status: 400 });
    if (replace) {
      const [exists] = await db
        .select({ id: schema.media.id })
        .from(schema.media)
        .where(eq(schema.media.id, id))
        .limit(1);
      if (!exists) return NextResponse.json({ error: "Nothing to replace." }, { status: 404 });
    }
    try {
      const r = await ingestImage({
        db,
        originals: originalsStore(),
        publicStore: derivativesStore(),
        filename,
        bytes: Buffer.from(obj.body),
        user: user.email,
        id,
        replaceId: replace ? id : undefined,
        originalKey: key,
      });
      await writeAudit(db, {
        actor: user.email,
        action: replace ? "media.replace" : "media.upload",
        entity: "media",
        entityId: r.id,
        summary: `${replace ? "Replaced" : "Uploaded"} ${safeName(filename)}`,
      });
      touch(["media"]);
      return NextResponse.json({ id: r.id, similarTo: r.similarTo ?? null });
    } catch (e) {
      if (!replace)
        await originalsStore()
          .delete(key)
          .catch(() => {});
      if (e instanceof ImageError) return NextResponse.json({ error: e.message }, { status: 422 });
      throw e;
    }
  },
  { limit: 120 },
);
