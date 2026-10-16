import { GuardScope, ProtectedImage } from "@halation/ui/media";
import { getDb, schema } from "@jerryqiu/db";
import * as st from "@jerryqiu/db/studio";
import { mintAllWidths, tokenSecrets } from "@jerryqiu/protect";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PortalFrame } from "@/components/portal/PortalFrame";
import { FavoriteButton } from "@/components/studio/ClientForms";
import { requireAccount } from "@/lib/portal-page";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your gallery", robots: { index: false, follow: false } };

/** A gallery opened from the signed-in portal: the same protected, viewer-bound images as the passcode gallery. */
export default async function PortalGallery({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { me, unread } = await requireAccount();
  const db = getDb();
  if (!db || !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [row] = await db
    .select({ g: schema.studioGalleries, job: schema.studioJobs })
    .from(schema.studioGalleries)
    .innerJoin(schema.studioJobs, eq(schema.studioJobs.id, schema.studioGalleries.jobId))
    .where(and(eq(schema.studioGalleries.id, id), isNull(schema.studioGalleries.deletedAt)));
  if (
    !row ||
    row.job.clientId !== me.client.id ||
    row.g.status !== "published" ||
    (row.g.expiresAt && row.g.expiresAt < new Date())
  )
    notFound();
  const items = await st.galleryItems(db, id);
  const ids = items.map((i) => i.mediaId);
  const rows = ids.length ? await db.select().from(schema.media).where(inArray(schema.media.id, ids)) : [];
  const byId = new Map(rows.map((m) => [m.id, m]));
  const favs = new Set(await st.favorites(db, id));
  const secrets = tokenSecrets();
  return (
    <PortalFrame current="home" name={me.client.name} unread={unread}>
      <GuardScope level="strict" />
      <h1 className="st-title">{row.g.title}</h1>
      <p className="st-note">
        These photographs are protected previews. Heart the ones you like; to use or download a photograph, ask me about
        delivery.
      </p>
      <ul className="st-photos" aria-label="Photographs">
        {items.map((it, i) => {
          const m = byId.get(it.mediaId);
          if (!m) return null;
          const label = m.alt || `Photograph ${i + 1}`;
          return (
            <li key={m.id}>
              <ProtectedImage
                asset={{
                  id: m.id,
                  width: m.width ?? 1200,
                  height: m.height ?? 800,
                  color: m.color ?? undefined,
                  blur: m.blur ?? undefined,
                  files: [],
                }}
                alt={label}
                tokens={mintAllWidths({ id: m.id, viewer: me.viewer, secrets })}
              />
              <FavoriteButton mediaId={m.id} label={label} initial={favs.has(m.id)} galleryId={id} />
            </li>
          );
        })}
      </ul>
      <p className="st-note" role="status">
        {favs.size} favourite{favs.size === 1 ? "" : "s"} chosen.
      </p>
    </PortalFrame>
  );
}
