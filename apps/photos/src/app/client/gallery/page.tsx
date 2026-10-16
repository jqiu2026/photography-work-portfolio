import { createHash } from "node:crypto";
import { getDb } from "@jerryqiu/db";
import { redirect } from "next/navigation";
import { Gallery } from "@/components/gallery/Gallery";
import { LeaveButton } from "@/components/studio/ClientForms";
import { Shell } from "@/components/Shell";
import { GalleryGuard } from "@/components/portal/GalleryGuard";
import { currentLock, galleryAccess } from "@/lib/client-gallery";
import { loadClientGallery } from "@/lib/client-gallery-data";
import "@/components/studio/studio.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your gallery", robots: { index: false, follow: false } };

/** The client's gallery opened with a passcode: protected, viewer-bound photographs, proofing, selections and downloads. */
export default async function ClientGallery() {
  const db = getDb();
  const access = await galleryAccess();
  if (!db || !access || access.state === "draft") redirect((await currentLock()) ? "/client?locked=1" : "/client");
  const data = await loadClientGallery(db, access);
  return (
    <Shell bare>
      <GalleryGuard
        security={access.security}
        galleryId={data.galleryId}
        code={`${data.title.slice(0, 12)} · ${createHash("sha256").update(access.viewer).digest("hex").slice(0, 8)}`}
      />
      <Gallery data={data} />
      <div className="st-wrap" style={{ paddingTop: 0 }}>
        <LeaveButton />
      </div>
    </Shell>
  );
}
