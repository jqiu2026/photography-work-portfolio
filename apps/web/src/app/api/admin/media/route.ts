import { getDb, schema } from "@jerryqiu/db";
import { and, desc, eq, ilike, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { guardedRoute } from "@/lib/route-guard";

/** Library listing for the media picker. */
export const GET = guardedRoute("content.write", async (req) => {
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind") === "audio" ? "audio" : "image";
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 80);
  const db = getDb();
  if (!db) return NextResponse.json({ items: [] });
  const items = await db
    .select({
      id: schema.media.id,
      filename: schema.media.filename,
      alt: schema.media.alt,
      width: schema.media.width,
      height: schema.media.height,
    })
    .from(schema.media)
    .where(
      and(
        isNull(schema.media.deletedAt),
        eq(schema.media.kind, kind),
        q ? ilike(schema.media.filename, `%${q.replace(/[%_]/g, "")}%`) : undefined,
      ),
    )
    .orderBy(desc(schema.media.createdAt))
    .limit(60);
  return NextResponse.json({ items });
});
