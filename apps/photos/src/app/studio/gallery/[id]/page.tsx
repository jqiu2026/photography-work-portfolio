import { getDb, schema } from "@jerryqiu/db";
import * as gal from "@jerryqiu/db/galleries";
import { and, eq, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/auth";
import { Shell } from "@/components/Shell";
import { GalleryManager } from "@/components/studio/GalleryManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Gallery", robots: { index: false, follow: false } };

const when = (d: Date | null) => (d ? d.toISOString().slice(0, 16).replace("T", " ") : null);

export default async function GalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePageUser("studio.access", `/studio/gallery/${id}`);
  const db = getDb();
  if (!db || !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [row] = await db
    .select({ g: schema.studioGalleries, job: schema.studioJobs })
    .from(schema.studioGalleries)
    .innerJoin(schema.studioJobs, eq(schema.studioJobs.id, schema.studioGalleries.jobId))
    .where(and(eq(schema.studioGalleries.id, id), isNull(schema.studioGalleries.deletedAt)));
  if (!row) notFound();
  const [contents, albums, proofs, downloads] = await Promise.all([
    gal.galleryContents(db, id, { includeHidden: true }),
    gal.listAlbums(db, id),
    gal.proofSummary(db, id),
    gal.downloadLog(db, id, 60),
  ]);
  const name = new Map(contents.map((c) => [c.media.id, c.media.filename]));
  const g = row.g;
  return (
    <Shell>
      <GalleryManager
        user={user.name ?? user.email ?? "owner"}
        data={{
          id,
          title: g.title,
          jobTitle: row.job.title,
          status: g.status,
          state: gal.galleryState(g),
          expiresAt: g.expiresAt?.toISOString().slice(0, 10) ?? null,
          welcome: g.welcome ?? "",
          accent: g.accent ?? "",
          downloadPolicy: g.downloadPolicy,
          selectionLimit: g.selectionLimit,
          allowComments: g.allowComments,
          allowRatings: g.allowRatings,
          watermark: g.watermark,
          hasPin: Boolean(g.downloadPinHash),
          selectionSentAt: when(g.selectionSentAt),
          albums: albums.map((a) => ({ id: a.id, name: a.name })),
          items: contents.map((c) => ({
            mediaId: c.media.id,
            filename: c.media.filename,
            albumId: c.item.albumId,
            hidden: c.item.hidden,
            cover: g.coverMediaId === c.media.id,
            width: c.media.width ?? 1200,
            height: c.media.height ?? 800,
            color: c.media.color,
            blur: c.media.blur,
            rating: proofs.ratings[c.media.id] ?? null,
            approved: proofs.approved.includes(c.media.id),
            rejected: proofs.rejected.includes(c.media.id),
            favourite: proofs.favourites.includes(c.media.id),
          })),
          comments: proofs.comments.map((c) => ({
            id: c.id,
            mediaId: c.mediaId,
            filename: name.get(c.mediaId) ?? "photograph",
            body: c.body,
            author: c.author,
            at: when(c.at) ?? "",
          })),
          downloads: downloads.map((d) => ({
            id: d.id,
            kind: d.kind,
            part: d.part,
            file: d.mediaId ? (name.get(d.mediaId) ?? null) : null,
            at: when(d.at) ?? "",
            bytes: d.bytes,
          })),
          counts: {
            favourites: proofs.favourites.length,
            approved: proofs.approved.length,
            rejected: proofs.rejected.length,
          },
        }}
      />
    </Shell>
  );
}
