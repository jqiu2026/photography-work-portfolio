import { getDb, writeAudit } from "@jerryqiu/db";
import * as m from "@jerryqiu/db/music";
import { pdfPageCount } from "@jerryqiu/scores";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { guardedRoute } from "@/lib/route-guard";
import { safeKeyName } from "@/lib/safe-name";
import { scoreStore } from "@/lib/storage";

export const maxDuration = 60;

const MIME: Record<string, string> = {
  pdf: "application/pdf",
  mid: "audio/midi",
  midi: "audio/midi",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  musicxml: "application/vnd.recordare.musicxml+xml",
  mxl: "application/vnd.recordare.musicxml",
  zip: "application/zip",
};

const body = z.object({
  id: z.string().uuid(),
  workId: z.string().uuid(),
  filename: z.string().trim().min(1).max(200),
  kind: z.enum(["full-score", "parts", "piano-reduction", "midi", "practice-audio", "other"]),
  label: z.string().trim().min(1).max(80),
  previewPages: z.number().int().min(0).max(10).default(2),
});

/**
 * Step 2: the file is in private storage. Read it back, work out the type from the extension (never from the browser's
 * claim), count the pages of a PDF, and add it to the piece. A stray upload is deleted on failure.
 */
export const POST = guardedRoute(
  "studio.access",
  async (req, _ctx, user) => {
    const parsed = body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Bad request." }, { status: 400 });
    const { id, workId, filename, kind, label, previewPages } = parsed.data;
    const db = getDb();
    if (!db) return NextResponse.json({ error: "No database." }, { status: 503 });
    const key = `scores/${id}/${safeKeyName(filename)}`;
    const obj = await scoreStore().get(key);
    if (!obj) return NextResponse.json({ error: "The upload didn't arrive. Try again." }, { status: 400 });
    const ext = filename.includes(".") ? filename.slice(filename.lastIndexOf(".") + 1).toLowerCase() : "";
    const mime = MIME[ext];
    if (!mime) {
      await scoreStore()
        .delete(key)
        .catch(() => {});
      return NextResponse.json({ error: "Use a PDF, MIDI, MusicXML, MP3, WAV, M4A or ZIP file." }, { status: 422 });
    }
    let pages: number | null = null;
    if (mime === "application/pdf") {
      pages = await pdfPageCount(obj.body);
      if (!pages) {
        await scoreStore()
          .delete(key)
          .catch(() => {});
        return NextResponse.json(
          { error: "That PDF could not be read. Is it damaged or password protected?" },
          { status: 422 },
        );
      }
    }
    const file = await m.addScoreFile(db, workId, {
      kind,
      label,
      filename: safeKeyName(filename),
      mime,
      storageKey: key,
      bytes: obj.body.byteLength,
      pages,
      previewPages: mime === "application/pdf" && kind === "full-score" ? previewPages : 0,
    });
    await writeAudit(db, {
      actor: user.email,
      action: "music.file.add",
      entity: "music_score_file",
      entityId: file.id,
      site: "music",
      summary: `Added ${label} (${safeKeyName(filename)})`,
    });
    revalidateTag("music", { expire: 0 });
    return NextResponse.json({ fileId: file.id, pages });
  },
  { limit: 300 },
);
