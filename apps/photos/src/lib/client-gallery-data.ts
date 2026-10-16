import "server-only";
import { type Database, schema } from "@jerryqiu/db";
import * as gal from "@jerryqiu/db/galleries";
import { eq } from "drizzle-orm";
import type { GalleryAccess } from "@/lib/client-gallery";
import { downloadsUnlocked } from "@/lib/client-gallery";
import { zipPlan } from "@/lib/downloads";

export type ClientGalleryData = {
  /** Present only for a portal account (the passcode session already knows its gallery). */
  galleryId?: string;
  title: string;
  welcome: string;
  accent: string;
  layout: string;
  theme: string;
  density: string;
  state: string;
  expiresAt: string | null;
  allowRatings: boolean;
  allowComments: boolean;
  limit: number | null;
  sent: boolean;
  downloads: { web: boolean; full: boolean; pin: boolean; unlocked: boolean; webParts: number; fullParts: number };
  albums: { id: string; name: string }[];
  items: {
    mediaId: string;
    filename: string;
    width: number;
    height: number;
    color: string | null;
    blur: string | null;
    albumId: string | null;
    favourite: boolean;
    rating: number | null;
    decision: "approved" | "rejected" | null;
    comments: { body: string; author: string; at: string }[];
  }[];
};

export async function loadClientGallery(db: Database, a: GalleryAccess): Promise<ClientGalleryData> {
  const g = a.gallery;
  const [contents, albums, proofs] = await Promise.all([
    gal.galleryContents(db, g.id),
    gal.listAlbums(db, g.id),
    gal.proofSummary(db, g.id),
  ]);
  const fav = new Set(proofs.favourites);
  const live = a.state === "live" || a.state === "expiring";
  const plan = (size: "web" | "full") =>
    zipPlan(
      contents.map((c) => ({ mediaId: c.media.id, filename: c.media.filename, bytes: c.media.bytes })),
      size,
    ).length;
  const [g2] = await db.select().from(schema.studioGalleries).where(eq(schema.studioGalleries.id, g.id));
  return {
    galleryId: a.via === "account" ? g.id : undefined,
    title: g.title,
    welcome: g.welcome ?? "",
    accent: g.accent ?? "",
    layout: g2?.layout ?? "grid",
    theme: g2?.theme ?? "dark",
    density: g2?.density ?? "medium",
    state: a.state,
    expiresAt: g.expiresAt?.toISOString().slice(0, 10) ?? null,
    allowRatings: g.allowRatings,
    allowComments: g.allowComments,
    limit: g.selectionLimit,
    sent: Boolean(g2?.selectionSentAt),
    downloads: {
      web: live && gal.downloadAllowed(g, "web"),
      full: live && gal.downloadAllowed(g, "full"),
      pin: Boolean(g.downloadPinHash),
      unlocked: !g.downloadPinHash || (await downloadsUnlocked(g.id)),
      webParts: plan("web"),
      fullParts: plan("full"),
    },
    albums: albums.map((x) => ({ id: x.id, name: x.name })),
    items: live
      ? contents.map((c) => ({
          mediaId: c.media.id,
          filename: c.media.filename,
          width: c.media.width ?? 1200,
          height: c.media.height ?? 800,
          color: c.media.color,
          blur: c.media.blur,
          albumId: c.item.albumId,
          favourite: fav.has(c.media.id),
          rating: proofs.ratings[c.media.id] ?? null,
          decision: proofs.approved.includes(c.media.id)
            ? "approved"
            : proofs.rejected.includes(c.media.id)
              ? "rejected"
              : null,
          comments: proofs.comments
            .filter((x) => x.mediaId === c.media.id)
            .map((x) => ({ body: x.body, author: x.author, at: x.at.toISOString().slice(0, 10) })),
        }))
      : [],
  };
}
