import { getDb, writeAudit } from "@jerryqiu/db";
import * as mk from "@jerryqiu/db/make";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { z } from "zod";
import { guardedRoute } from "@/lib/route-guard";
import { safeKeyName } from "@/lib/safe-name";
import { imageStore, uploadStore } from "@/lib/storage";

export const maxDuration = 60;

const body = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  filename: z.string().trim().min(1).max(200),
});

/**
 * Step 2: read the upload back, check it really is an image, re-encode it (width at most 1800, metadata removed: no GPS,
 * camera or software tags), keep only the re-encoded copy, and add it to the project as NOT yet checked: it stays hidden
 * until someone marks it checked in the studio.
 */
export const POST = guardedRoute(
  "studio.access",
  async (req, _ctx, user) => {
    const parsed = body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Bad request." }, { status: 400 });
    const { id, projectId, filename } = parsed.data;
    const db = getDb();
    if (!db) return NextResponse.json({ error: "No database." }, { status: 503 });
    const key = `shots/${id}/${safeKeyName(filename)}`;
    const obj = await uploadStore().get(key);
    if (!obj) return NextResponse.json({ error: "The upload didn't arrive. Try again." }, { status: 400 });
    try {
      const out = await sharp(Buffer.from(obj.body), { limitInputPixels: 80_000_000 })
        .rotate()
        .resize({ width: 1800, withoutEnlargement: true })
        .webp({ quality: 86 })
        .toBuffer({ resolveWithObject: true });
      const outKey = `make/${id}.webp`;
      await imageStore().put(outKey, new Uint8Array(out.data), { contentType: "image/webp" });
      const img = await mk.addImage(db, projectId, {
        storageKey: outKey,
        mime: "image/webp",
        width: out.info.width,
        height: out.info.height,
        alt: "",
      });
      await writeAudit(db, {
        actor: user.email,
        action: "make.image.add",
        entity: "make_image",
        entityId: img.id,
        site: "all",
        summary: "Uploaded a screenshot (not yet checked)",
      });
      revalidateTag("make", { expire: 0 });
      return NextResponse.json({ imageId: img.id });
    } catch {
      return NextResponse.json({ error: "That file could not be read as an image." }, { status: 422 });
    } finally {
      await uploadStore()
        .delete(key)
        .catch(() => {});
    }
  },
  { limit: 300 },
);
