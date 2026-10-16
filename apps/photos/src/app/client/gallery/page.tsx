import { getDb, schema } from "@jerryqiu/db";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { portalSession } from "@/lib/portal";

export const dynamic = "force-dynamic";

/** Old address of the passcode gallery: send the visitor to the gallery's own link. */
export default async function OldClientGallery() {
  const db = getDb();
  const s = await portalSession();
  if (db && s) {
    const [g] = await db
      .select({ slug: schema.studioGalleries.slug })
      .from(schema.studioGalleries)
      .where(eq(schema.studioGalleries.id, s.g));
    if (g?.slug) redirect(`/g/${g.slug}`);
  }
  redirect("/");
}
