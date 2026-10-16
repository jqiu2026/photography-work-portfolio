import { getDb } from "@jerryqiu/db";
import { galleryBySlug } from "@jerryqiu/db/gallery-shop";
import { NextResponse } from "next/server";
import { portalSession, startPortalSession } from "@/lib/portal";

export const dynamic = "force-dynamic";

/**
 * Opens a gallery's public link: starts a visitor session for THAT gallery (view and shop; proofing stays with the client's
 * passcode), then goes back to the page. A client already inside this gallery keeps their own session.
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = getDb();
  const g = db ? await galleryBySlug(db, slug) : null;
  const to = new URL(`/g/${slug}`, request.url);
  if (!g) return NextResponse.redirect(to, 303);
  if (g.visibility === "link") {
    const s = await portalSession();
    if (!s || s.g !== g.id) await startPortalSession(g.id, "visitor");
  }
  return NextResponse.redirect(to, 303);
}
