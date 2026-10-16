import { getDb } from "@jerryqiu/db";
import { serveImage } from "@jerryqiu/media";
import { derivativesStore } from "@/lib/storage";
import { resolveStatic } from "@/lib/static-images";

export const dynamic = "force-dynamic";

/** Every photograph on the photo site is served here, with a signed token (see packages/media/src/serve.ts). */
export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return serveImage(request, (await ctx.params).id, {
    db: getDb(),
    store: derivativesStore(),
    site: "photos",
    resolveStatic,
  });
}
export const HEAD = GET;
