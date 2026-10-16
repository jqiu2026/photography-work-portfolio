import { getDb } from "@jerryqiu/db";
import { saveWatermark } from "@jerryqiu/db/gallery-extras";
import { StudioError } from "@jerryqiu/db/studio";
import { NextResponse } from "next/server";
import { guardedRoute } from "@/lib/route-guard";
import { originalsStore } from "@/lib/storage";

export const dynamic = "force-dynamic";

/** Saves a watermark: multipart with `name`, `kind` (text or image), `text` or a PNG `file`, position, opacity and size. */
export const POST = guardedRoute(
  "studio.access",
  async (req) => {
    const db = getDb();
    if (!db) return NextResponse.json({ error: "No database." }, { status: 503 });
    const f = await req.formData().catch(() => null);
    if (!f) return NextResponse.json({ error: "Bad request." }, { status: 400 });
    const file = f.get("file");
    let imageKey: string | undefined;
    try {
      if (file instanceof File && file.size) {
        if (file.type !== "image/png" || file.size > 4 * 1024 * 1024)
          throw new StudioError("A watermark image is a PNG under 4 MB (transparent works best).");
        imageKey = `watermark/${crypto.randomUUID()}.png`;
        await originalsStore().put(imageKey, new Uint8Array(await file.arrayBuffer()), { contentType: "image/png" });
      }
      const id = await saveWatermark(db, {
        id: String(f.get("id") ?? "") || undefined,
        name: String(f.get("name") ?? ""),
        kind: f.get("kind") === "image" ? "image" : "text",
        text: String(f.get("text") ?? ""),
        imageKey,
        position: String(f.get("position") ?? ""),
        opacity: Number(f.get("opacity") ?? 45),
        sizePct: Number(f.get("sizePct") ?? 22),
      });
      return NextResponse.json({ ok: true, id });
    } catch (e) {
      if (e instanceof StudioError) return NextResponse.json({ error: e.message }, { status: 400 });
      throw e;
    }
  },
  { limit: 60 },
);
