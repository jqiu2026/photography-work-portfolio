import { getDb } from "@jerryqiu/db";
import { handleTokenRequest } from "@jerryqiu/media";
import { clientGalleryViewer } from "@/lib/portal";
import { resolveStatic } from "@/lib/static-images";
import { derivativesStore } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleTokenRequest(request, {
    db: getDb(),
    store: derivativesStore(),
    site: "photos",
    resolveStatic,
    studioViewer: (_req, id) => clientGalleryViewer(id),
  });
}
