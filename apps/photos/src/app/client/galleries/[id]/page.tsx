import { GuardScope } from "@halation/ui/media";
import { getDb } from "@jerryqiu/db";
import { notFound } from "next/navigation";
import { GalleryClient } from "@/components/portal/GalleryClient";
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
      <GuardScope level="strict" />
      <GalleryClient data={data} />
    </PortalFrame>
  );
}
