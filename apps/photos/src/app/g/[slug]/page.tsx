import { createHash } from "node:crypto";
import { getDb } from "@jerryqiu/db";
import { galleryBySlug } from "@jerryqiu/db/gallery-shop";
import { notFound, redirect } from "next/navigation";
import { Gallery } from "@/components/gallery/Gallery";
import { GalleryGate } from "@/components/gallery/GalleryGate";
import { GalleryGuard } from "@/components/portal/GalleryGuard";
import { Shell } from "@/components/Shell";
import { currentLock, galleryAccess } from "@/lib/client-gallery";
import { loadClientGallery } from "@/lib/client-gallery-data";
import { portalSession } from "@/lib/portal";

export const dynamic = "force-dynamic";
export const metadata = { title: "Gallery", robots: { index: false, follow: false } };

/**
 * A gallery's own address: /g/<slug>, the single link to share. Open galleries are for anyone with the link (view and shop);
 * private ones ask for the passcode right here. The passcode also turns on proofing for the client.
 */
export default async function GalleryByLink({
  params,
  searchParams,
}: { params: Promise<{ slug: string }>; searchParams: Promise<{ locked?: string; idle?: string }> }) {
  const { slug } = await params;
  const q = await searchParams;
  const db = getDb();
  const g = db ? await galleryBySlug(db, slug) : null;
  if (!db || !g) notFound();
  const session = await portalSession();
  const mine = session && session.g === g.id;
  if (!mine) {
    if (g.visibility === "link") redirect(`/g/${slug}/enter`);
    return (
      <Shell bare>
        <GalleryGate slug={slug} title={g.title} locked={Boolean(q.locked)} idle={Boolean(q.idle)} />
      </Shell>
    );
  }
  const access = await galleryAccess();
  if (!access) {
    const lockedNow = await currentLock();
    return (
      <Shell bare>
        <GalleryGate slug={slug} title={g.title} locked={Boolean(lockedNow) || Boolean(q.locked)} idle={false} />
      </Shell>
    );
  }
  const data = await loadClientGallery(db, access);
  return (
    <Shell bare>
      <GalleryGuard
        security={access.security}
        galleryId={data.galleryId}
        slug={slug}
        code={`${data.title.slice(0, 12)} · ${createHash("sha256").update(access.viewer).digest("hex").slice(0, 8)}`}
      />
      <Gallery data={data} />
    </Shell>
  );
}
