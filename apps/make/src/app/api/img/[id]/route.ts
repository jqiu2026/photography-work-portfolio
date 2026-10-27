import { getDb } from "@jerryqiu/db";
import * as mk from "@jerryqiu/db/make";
import { NextResponse } from "next/server";
import { imageStore } from "@/lib/storage";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A screenshot, but only one that was marked checked and belongs to a published project. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return new NextResponse(null, { status: 404 });
  const db = getDb();
  if (!db) return new NextResponse(null, { status: 404 });
  const img = await mk.publicImage(db, id);
  if (!img) return new NextResponse(null, { status: 404 });
  const stored = await imageStore().get(img.storageKey);
  if (!stored) return new NextResponse(null, { status: 404 });
  return new NextResponse(Buffer.from(stored.body), {
    headers: { "Content-Type": img.mime, "Cache-Control": "public, max-age=300", "X-Content-Type-Options": "nosniff" },
  });
}
