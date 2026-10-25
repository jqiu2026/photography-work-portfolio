import { getDb } from "@jerryqiu/db";
import { listWatermarks } from "@jerryqiu/db/gallery-extras";
import { guardedRoute } from "@/lib/route-guard";
import { originalsStore } from "@/lib/storage";

export const dynamic = "force-dynamic";

/** The PNG of an image watermark, for the studio's preview (never public). */
export const GET = guardedRoute("studio.access", async (_req, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const db = getDb();
  if (!db || !/^[0-9a-f-]{36}$/i.test(id)) return new Response(null, { status: 404 });
  const mark = (await listWatermarks(db)).find((m) => m.id === id);
  const obj = mark?.imageKey ? await originalsStore().get(mark.imageKey) : null;
  if (!obj) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(obj.body), {
    headers: { "Content-Type": "image/png", "Cache-Control": "private, max-age=60", "X-Robots-Tag": "noindex" },
  });
});
