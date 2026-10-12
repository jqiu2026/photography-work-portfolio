import { Container, Section } from "@halation/ui";
import { GuardScope, ProtectedImage } from "@halation/ui/media";
import { getDb, schema } from "@jerryqiu/db";
import * as st from "@jerryqiu/db/studio";
import { mintAllWidths, tokenSecrets } from "@jerryqiu/protect";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Shell } from "@/components/Shell";
import { FavoriteButton, LeaveButton } from "@/components/studio/ClientForms";
import { portalSession } from "@/lib/portal";
import "@/components/studio/studio.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your gallery", robots: { index: false, follow: false } };

/** The client's gallery: strict-tier protected images with tokens bound to this session, favourites, and status of the job's paperwork. */
export default async function ClientGallery() {
  const session = await portalSession();
  const db = getDb();
  if (!session || !db) redirect("/client");
  const [g] = await db
    .select()
    .from(schema.studioGalleries)
    .where(and(eq(schema.studioGalleries.id, session.g), isNull(schema.studioGalleries.deletedAt)));
  if (!g || g.status !== "published" || (g.expiresAt && g.expiresAt < new Date())) redirect("/client");
  const items = await st.galleryItems(db, g.id);
  const ids = items.map((i) => i.mediaId);
  const rows = ids.length ? await db.select().from(schema.media).where(inArray(schema.media.id, ids)) : [];
  const byId = new Map(rows.map((m) => [m.id, m]));
  const favs = new Set(await st.favorites(db, g.id));
  const secrets = tokenSecrets();
  return (
    <Shell cinema>
      <GuardScope level="strict" />
      <div className="st-wrap">
        <p className="hl-eyebrow">Your gallery</p>
        <h1 className="st-title">{g.title}</h1>
        <p className="st-note">
          These photographs are protected previews. Heart the ones you like; to use or download a photograph, ask me
          about delivery.
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
                  tokens={mintAllWidths({ id: m.id, viewer: session.v, secrets })}
                />
                <FavoriteButton mediaId={m.id} label={label} initial={favs.has(m.id)} />
              </li>
            );
          })}
        </ul>
        <p className="st-note" role="status">
          {favs.size} favourite{favs.size === 1 ? "" : "s"} chosen.
        </p>
        <Section style={{ paddingInline: 0 }}>
          <LeaveButton />
        </Section>
      </div>
    </Shell>
  );
}
