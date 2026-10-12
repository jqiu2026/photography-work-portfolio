import { getDb } from "@jerryqiu/db";
import { serveImage } from "@jerryqiu/media";
import { derivativesStore } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const db = getDb();
  if (!db) return new Response(null, { status: 404 });
  return serveImage(request, (await ctx.params).id, { db, store: derivativesStore(), site: "hub" });
}
export const HEAD = GET;
