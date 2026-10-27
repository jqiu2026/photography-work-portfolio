import { getDb } from "@jerryqiu/db";
import * as mk from "@jerryqiu/db/make";
import { NextResponse } from "next/server";
import { requireUser } from "@/auth";
import { imageStore } from "@/lib/storage";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A screenshot as the studio sees it, checked or not. Staff only; never cached. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser("studio.access");
  } catch {
    return new NextResponse(null, { status: 401 });
  }
  const { id } = await params;
  const db = getDb();
  if (!UUID.test(id) || !db) return new NextResponse(null, { status: 404 });
  const img = await mk.getImageRow(db, id);
  const stored = img && !img.deletedAt ? await imageStore().get(img.storageKey) : null;
  if (!img || !stored) return new NextResponse(null, { status: 404 });
  return new NextResponse(Buffer.from(stored.body), {
    headers: { "Content-Type": img.mime, "Cache-Control": "private, no-store" },
  });
}
