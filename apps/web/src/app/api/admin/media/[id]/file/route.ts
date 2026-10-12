import { getDb, schema } from "@jerryqiu/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { guardedRoute } from "@/lib/route-guard";
import { derivativesStore } from "@/lib/storage";

/** Admin-only preview of a derivative (nearest width at or above `w`, WebP). Public pages use signed tokens instead. */
export const GET = guardedRoute("content.write", async (req, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) return new NextResponse(null, { status: 404 });
  const w = Number(new URL(req.url).searchParams.get("w") ?? 960);
  const db = getDb();
  const [m] = db
    ? await db
        .select({ derivatives: schema.media.derivatives })
        .from(schema.media)
        .where(eq(schema.media.id, id))
        .limit(1)
    : [];
  if (!m) return new NextResponse(null, { status: 404 });
  const webp = m.derivatives.filter((d) => d.format === "webp").sort((a, b) => a.width - b.width);
  const pick = webp.find((d) => d.width >= w) ?? webp[webp.length - 1];
  const obj = pick ? await derivativesStore().get(pick.key) : null;
  if (!obj) return new NextResponse(null, { status: 404 });
  return new NextResponse(Buffer.from(obj.body), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
