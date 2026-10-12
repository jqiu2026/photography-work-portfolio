import { getDb, schema } from "@jerryqiu/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { guardedRoute } from "@/lib/route-guard";
import { originalsStore } from "@/lib/storage";

/** Owner-only download of the private original (never linked from public pages). */
export const GET = guardedRoute("settings.write", async (_req, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) return new NextResponse(null, { status: 404 });
  const db = getDb();
  const [m] = db
    ? await db
        .select({ key: schema.media.originalKey, name: schema.media.filename, mime: schema.media.mime })
        .from(schema.media)
        .where(eq(schema.media.id, id))
        .limit(1)
    : [];
  const obj = m ? await originalsStore().get(m.key) : null;
  if (!m || !obj) return new NextResponse(null, { status: 404 });
  return new NextResponse(Buffer.from(obj.body), {
    headers: {
      "Content-Type": m.mime,
      "Content-Disposition": `attachment; filename="${m.name.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
