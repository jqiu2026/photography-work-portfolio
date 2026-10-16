import { createHash } from "node:crypto";
import { getDb } from "@jerryqiu/db";
import { notFound } from "next/navigation";
import { Gallery } from "@/components/gallery/Gallery";
import { GalleryGuard } from "@/components/portal/GalleryGuard";
import { PortalFrame } from "@/components/portal/PortalFrame";
import { galleryAccess } from "@/lib/client-gallery";
import { loadClientGallery } from "@/lib/client-gallery-data";
import { requireAccount } from "@/lib/portal-page";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your gallery", robots: { index: false, follow: false } };

/** A gallery opened from the signed-in portal: the same view as the passcode gallery. */
export default async function PortalGallery({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { me, unread } = await requireAccount();
  const db = getDb();
  const access = await galleryAccess(id);
  if (!db || !access || access.state === "draft") notFound();
  const data = await loadClientGallery(db, access);
  return (
    <PortalFrame current="home" name={me.client.name} unread={unread}>
      <GalleryGuard
        security={access.security}
        galleryId={id}
        code={`${data.title.slice(0, 12)} · ${createHash("sha256").update(access.viewer).digest("hex").slice(0, 8)}`}
      />
      <Gallery data={data} />
    </PortalFrame>
  );
}
