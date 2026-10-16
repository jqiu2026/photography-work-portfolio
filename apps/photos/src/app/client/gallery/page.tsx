import { GuardScope } from "@halation/ui/media";
import { getDb } from "@jerryqiu/db";
import { redirect } from "next/navigation";
import { GalleryClient } from "@/components/portal/GalleryClient";
import { LeaveButton } from "@/components/studio/ClientForms";
import { Shell } from "@/components/Shell";
import { galleryAccess } from "@/lib/client-gallery";
import { loadClientGallery } from "@/lib/client-gallery-data";
import "@/components/studio/studio.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your gallery", robots: { index: false, follow: false } };

/** The client's gallery opened with a passcode: protected, viewer-bound photographs, proofing, selections and downloads. */
export default async function ClientGallery() {
  const db = getDb();
  const access = await galleryAccess();
  if (!db || !access || access.state === "draft") redirect("/client");
  const data = await loadClientGallery(db, access);
  return (
    <Shell cinema>
      <GuardScope level="strict" />
      <div className="st-wrap">
        <p className="hl-eyebrow">Your gallery</p>
        <GalleryClient data={data} />
        <div style={{ marginTop: "2rem" }}>
          <LeaveButton />
        </div>
      </div>
    </Shell>
  );
}
