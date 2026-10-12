import { getDb } from "@jerryqiu/db";
import { serveCached } from "@jerryqiu/shootproof";
import { derivativesStore } from "@/lib/storage";

export const dynamic = "force-dynamic";

/** Temporary ShootProof imports. Always token-gated (see packages/shootproof). */
export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const db = getDb();
  if (!db) return new Response(null, { status: 404 });
  return serveCached(request, (await ctx.params).id, { db, store: derivativesStore() });
}
