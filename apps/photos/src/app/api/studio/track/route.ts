import { createHash } from "node:crypto";
import { getDb } from "@jerryqiu/db";
import { addTrack, listTracks } from "@jerryqiu/db/gallery-extras";
import { assertPlan } from "@jerryqiu/db/plan";
import { StudioError } from "@jerryqiu/db/studio";
import { safeName } from "@jerryqiu/media";
import { NextResponse } from "next/server";
import { guardedRoute } from "@/lib/route-guard";
import { originalsStore } from "@/lib/storage";

export const dynamic = "force-dynamic";
const MAX = 40 * 1024 * 1024;

/**
 * Adds a music track: a multipart POST with `file` and `title` (the studio only). Audio is kept with the private originals,
 * under its SHA-256, so the same file is never stored twice: adding it again answers with the track that has it.
 */
export const POST = guardedRoute(
  "settings.write",
  async (req) => {
    const db = getDb();
    if (!db) return NextResponse.json({ error: "No database." }, { status: 503 });
    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose an audio file." }, { status: 400 });
    if (file.size < 1 || file.size > MAX)
      return NextResponse.json({ error: "Audio files are up to 40 MB." }, { status: 400 });
    try {
      await assertPlan(db, "music");
      const bytes = new Uint8Array(await file.arrayBuffer());
      const sha = createHash("sha256").update(bytes).digest("hex");
      const same = (await listTracks(db)).find((t) => t.storageKey?.startsWith(`audio/${sha}/`));
      if (same) throw new StudioError(`This file is already in your music, as “${same.title}”.`);
      const key = `audio/${sha}/${safeName(file.name || "track.mp3")}`;
      const mime = file.type || "audio/mpeg";
      const title = String(form?.get("title") ?? "").trim() || file.name.replace(/\.[^.]+$/, "");
      // validate before writing anything
      const track = await addTrack(db, {
        title,
        artist: String(form?.get("artist") ?? ""),
        storageKey: key,
        mime,
        bytes: file.size,
      });
      await originalsStore().put(key, bytes, { contentType: mime });
      return NextResponse.json({ ok: true, id: track.id });
    } catch (e) {
      if (e instanceof StudioError) return NextResponse.json({ error: e.message }, { status: 400 });
      throw e;
    }
  },
  { limit: 30 },
);
