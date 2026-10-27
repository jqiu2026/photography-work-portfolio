import { getDb } from "@jerryqiu/db";
import * as m from "@jerryqiu/db/music";
import { previewPdf } from "@jerryqiu/scores";
import { NextResponse } from "next/server";
import { allow } from "@/lib/public-action";
import { scoreStore } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The first pages of a published piece's score, marked PREVIEW. The rest of the file never leaves the server. */
export async function GET(_req: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params;
  if (!UUID.test(fileId)) return new NextResponse(null, { status: 404 });
  if (!(await allow("preview", 120, 3600))) return new NextResponse("Too many requests", { status: 429 });
  const db = getDb();
  if (!db) return new NextResponse(null, { status: 404 });
  const file = await m.previewFile(db, fileId);
  if (!file) return new NextResponse(null, { status: 404 });
  const stored = await scoreStore().get(file.storageKey);
  if (!stored) return new NextResponse(null, { status: 404 });
  const bytes = await previewPdf(stored.body, file.previewPages);
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="preview.pdf"',
      "Cache-Control": "public, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
