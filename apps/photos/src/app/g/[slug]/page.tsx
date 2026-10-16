import { createHash } from "node:crypto";
import { getDb } from "@jerryqiu/db";
import { galleryBySlug } from "@jerryqiu/db/gallery-shop";
import { notFound, redirect } from "next/navigation";
import { Gallery } from "@/components/gallery/Gallery";
import { GalleryGuard } from "@/components/portal/GalleryGuard";
import { Shell } from "@/components/Shell";
import { currentLock, galleryAccess } from "@/lib/client-gallery";
import { loadClientGallery } from "@/lib/client-gallery-data";
import { portalSession } from "@/lib/portal";

export const dynamic = "force-dynamic";
export const metadata = { title: "Gallery", robots: { index: false, follow: false } };

/** A gallery's own address: /g/<slug>. Anyone with the link can view it and shop; the client's passcode adds proofing. */
export default async function GalleryByLink({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = getDb();
  const g = db ? await galleryBySlug(db, slug) : null;
  if (!db || !g) notFound();
  const session = await portalSession();
  if (!session || session.g !== g.id) redirect(`/g/${slug}/enter`);
  const access = await galleryAccess();
  if (!access) redirect((await currentLock()) ? "/client?locked=1" : `/g/${slug}/enter`);
  const data = await loadClientGallery(db, access);
  return (
    <Shell cinema>
      <GalleryGuard
        security={access.security}
        galleryId={data.galleryId}
        code={`${data.title.slice(0, 12)} · ${createHash("sha256").update(access.viewer).digest("hex").slice(0, 8)}`}
      />
      <Gallery data={data} />
    </Shell>
  );
}
