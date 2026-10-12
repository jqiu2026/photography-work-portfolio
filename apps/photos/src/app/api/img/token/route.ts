import { getDb } from "@jerryqiu/db";
import { handleTokenRequest } from "@jerryqiu/media";
import { derivativesStore } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const db = getDb();
  if (!db) return Response.json({ error: "unavailable" }, { status: 503 });
  return handleTokenRequest(request, { db, store: derivativesStore(), site: "photos" });
}
