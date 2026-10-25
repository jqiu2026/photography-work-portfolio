import { portfolioSubjects } from "@jerryqiu/db/business";
import { canSeeSection } from "@/components/studio/sections";
import { getDb, schema } from "@jerryqiu/db";
import * as gal from "@jerryqiu/db/galleries";
import { lockedUntil, readSecurity, readStyle, securityLog } from "@jerryqiu/db/gallery-security";
import { freeSlug, listOrders, listSheets, readShop } from "@jerryqiu/db/gallery-shop";
import { listRules, listTracks, listWatermarks } from "@jerryqiu/db/gallery-extras";
import { and, eq, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/auth";
import { StudioShell as Shell } from "@/components/studio/StudioShell";
import { GalleryManager } from "@/components/studio/GalleryManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Gallery", robots: { index: false, follow: false } };

const when = (d: Date | null) => (d ? d.toISOString().slice(0, 16).replace("T", " ") : null);

export default async function GalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePageUser("studio.access", `/studio/gallery/${id}`);
  if (!canSeeSection(user.role, "galleries")) notFound();
  const db = getDb();
  if (!db || !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [row] = await db
    .select({ g: schema.studioGalleries, job: schema.studioJobs })
    .from(schema.studioGalleries)
    .innerJoin(schema.studioJobs, eq(schema.studioJobs.id, schema.studioGalleries.jobId))
    .where(and(eq(schema.studioGalleries.id, id), isNull(schema.studioGalleries.deletedAt)));
  if (!row) notFound();
  const g0 = row.g;
  const [contents, albums, proofs, downloads, views, stats, events] = await Promise.all([
    gal.galleryContents(db, id, { includeHidden: true }),
    gal.listAlbums(db, id),
    gal.proofSummary(db, id),
    gal.downloadLog(db, id, 60),
    gal.viewSummary(db, id),
    gal.galleryStats(db, [id]),
    securityLog(db, id, 60),
  ]);
  void lockedUntil;
  const [owner] = await db
    .select({ client: schema.studioClients })
    .from(schema.studioJobs)
    .innerJoin(schema.studioClients, eq(schema.studioClients.id, schema.studioJobs.clientId))
    .where(eq(schema.studioJobs.id, g0.jobId));
  const name = new Map(contents.map((c) => [c.media.id, c.media.filename]));
  const orders = await listOrders(db, id);
  const [rules, watermarks, tracks, sheets] = await Promise.all([
    listRules(db, id),
    listWatermarks(db),
    listTracks(db),
    listSheets(db),
  ]);
  const shopCfg = readShop(g0.shop);
  const suggestedSlug = g0.slug ?? (await freeSlug(db, g0.title, id));
  const g = row.g;
  return (
    <Shell>
      <GalleryManager
        user={user.name ?? user.email ?? "owner"}
        data={{
          portfolioSubjects: user.role === "owner" ? await portfolioSubjects(db) : [],
          id,
          title: g.title,
          jobTitle: row.job.title,
          status: g.status,
          state: gal.galleryState(g),
          expiresAt: g.expiresAt?.toISOString().slice(0, 10) ?? null,
          clientName: owner?.client.name ?? "",
          clientEmail: owner?.client.email ?? "",
          layout: g.layout,
          theme: g.theme,
          density: g.density,
          publishAt: g.publishAt?.toISOString().slice(0, 16) ?? "",
          notes: g.notes ?? "",
          stats: stats.get(id) ?? { photos: 0, favorites: 0, downloads: 0, views: 0, viewers: 0 },
          views: {
            total: views.total,
            viewers: views.viewers,
            last: when(views.last),
            recent: views.recent.map((v, i) => ({
              id: `${i}`,
              at: when(v.at) ?? "",
              viewer: v.viewer,
              file: name.get(v.mediaId) ?? "photograph",
            })),
          },
          security: readSecurity(g.security),
          style: readStyle(g.style),
          lockedNow: events.some((e) => e.kind === "lock" && e.until && e.until > new Date()),
          securityEvents: events.map((e) => ({
            id: e.id,
            kind: e.kind,
            combo: e.combo,
            action: e.action,
            viewer: e.viewer.slice(-8),
            via: e.via ?? "",
            device: e.device ?? "",
            at: when(e.at) ?? "",
          })),
          welcome: g.welcome ?? "",
          accent: g.accent ?? "",
          downloadPolicy: g.downloadPolicy,
          selectionLimit: g.selectionLimit,
          allowComments: g.allowComments,
          accessMode: g.accessMode,
          allowRatings: g.allowRatings,
          watermark: g.watermark,
          hasPin: Boolean(g.downloadPinHash),
          selectionSentAt: when(g.selectionSentAt),
          albums: albums.map((a) => ({ id: a.id, name: a.name })),
          albumList: albums.map((a) => ({
            id: a.id,
            name: a.name,
            description: a.description ?? "",
            parentId: a.parentId,
            locked: Boolean(a.passcodeHash),
            hidden: a.hidden,
            coverMediaId: a.coverMediaId,
          })),
          slug: suggestedSlug,
          visibility: g.visibility,
          shop: {
            enabled: shopCfg.enabled,
            listed: shopCfg.listed,
            sellDigital: shopCfg.sellDigital,
            sellPrints: shopCfg.sellPrints,
            note: shopCfg.note,
            priceSheetId: shopCfg.priceSheetId,
            minOrder: shopCfg.minOrderCents ? (shopCfg.minOrderCents / 100).toFixed(2) : "",
            abandonedCart: shopCfg.abandonedCart,
            checkoutMessage: shopCfg.checkoutMessage,
            printRelease: shopCfg.printRelease,
          },
          sheets: sheets.map((x) => ({ id: x.id, name: x.name, isDefault: x.isDefault })),
          shootDate: g.shootDate ?? "",
          orderDueDate: g.orderDueDate ?? "",
          emailRequired: g.emailRequired,
          autoArchive: g.autoArchive,
          rules: rules.map((r) => ({
            id: r.id,
            albumId: r.albumId,
            name: r.name,
            preset: r.preset,
            previewText: r.previewText ?? "",
            maxPx: r.maxPx,
            perVisitor: r.perVisitor,
            watermarkId: r.watermarkId,
            hasPin: Boolean(r.pinHash),
            printRelease: r.printRelease ?? "",
            showAll: r.showAll,
          })),
          watermarks: watermarks.map((w) => ({ id: w.id, name: w.name })),
          tracks: tracks.map((t) => ({ id: t.id, title: t.title, artist: t.artist ?? "" })),
          orders: orders.slice(0, 40).map((o) => ({
            id: o.order.id,
            number: o.order.number,
            status: o.order.status,
            buyer: o.order.buyerName,
            totalCents: o.order.totalCents,
            at: when(o.order.createdAt) ?? "",
            items: o.items.length,
          })),
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
            views: views.perPhoto[c.media.id] ?? 0,
            rating: proofs.ratings[c.media.id] ?? null,
            approved: proofs.approved.includes(c.media.id),
            rejected: proofs.rejected.includes(c.media.id),
            favorite: proofs.favorites.includes(c.media.id),
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
            favorites: proofs.favorites.length,
            approved: proofs.approved.length,
            rejected: proofs.rejected.length,
          },
        }}
      />
    </Shell>
  );
}
