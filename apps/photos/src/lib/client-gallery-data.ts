import "server-only";
import { type Database, schema } from "@jerryqiu/db";
import * as gal from "@jerryqiu/db/galleries";
import { getBrand, publicBrand } from "@jerryqiu/db/brand";
import { listRules, tracksByIds } from "@jerryqiu/db/gallery-extras";
import { type GalleryStyle, readStyle } from "@jerryqiu/db/gallery-security";
import { type GalleryShop, listProducts, readShop } from "@jerryqiu/db/gallery-shop";
import { MOCK_CATALOG } from "@jerryqiu/prints";
import { eq } from "drizzle-orm";
import type { GalleryAccess } from "@/lib/client-gallery";
import { downloadsUnlocked, lockedMediaIds, unlockedAlbums, unlockedRules } from "@/lib/client-gallery";
import { zipPlan } from "@/lib/downloads";

export type ClientGalleryData = {
  /** client: the person the gallery was delivered to (proofing, selections). visitor: the public link (view and shop). */
  role: "client" | "visitor";
  slug: string | null;
  brand: { name: string; website: string; instagram: string; email: string; phone: string; address: string };
  shop: {
    enabled: boolean;
    sellDigital: boolean;
    sellPrints: boolean;
    freeDownloads: GalleryShop["freeDownloads"];
    note: string;
    checkoutMessage: string;
    minOrderCents: number;
    shipCountries: string[];
    products: {
      id: string;
      kind: string;
      name: string;
      description: string;
      priceCents: number;
      sample: boolean;
      /** Print size in inches (long side, short side), for the resolution check. */
      size: [number, number] | null;
    }[];
  };
  /** Present only for a portal account (the passcode session already knows its gallery). */
  galleryId?: string;
  title: string;
  welcome: string;
  accent: string;
  layout: string;
  theme: string;
  density: string;
  style: GalleryStyle;
  coverMediaId: string | null;
  state: string;
  expiresAt: string | null;
  allowRatings: boolean;
  allowComments: boolean;
  limit: number | null;
  sent: boolean;
  /** Free-download rules a visitor may use (the client has their own downloads, below). */
  rules: {
    id: string;
    name: string;
    albumId: string | null;
    maxPx: number | null;
    perVisitor: number | null;
    hasPin: boolean;
    unlocked: boolean;
    printRelease: string;
    showAll: boolean;
    watermarked: boolean;
  }[];
  tracks: { id: string; title: string; artist: string }[];
  downloads: { web: boolean; full: boolean; pin: boolean; unlocked: boolean; webParts: number; fullParts: number };
  albums: {
    id: string;
    name: string;
    description: string;
    parentId: string | null;
    locked: boolean;
    /** Locked and not yet opened in this browser: its photographs are not in `items`. */
    closed: boolean;
    count: number;
    coverMediaId: string | null;
  }[];
  items: {
    mediaId: string;
    filename: string;
    width: number;
    height: number;
    color: string | null;
    blur: string | null;
    albumId: string | null;
    favorite: boolean;
    rating: number | null;
    decision: "approved" | "rejected" | null;
    comments: { body: string; author: string; at: string }[];
  }[];
};

export async function loadClientGallery(db: Database, a: GalleryAccess): Promise<ClientGalleryData> {
  const g = a.gallery;
  const [allContents, albums, proofs, shut, open] = await Promise.all([
    gal.galleryContents(db, g.id),
    gal.listAlbums(db, g.id),
    gal.proofSummary(db, g.id),
    lockedMediaIds(db, g.id),
    unlockedAlbums(g.id),
  ]);
  // photographs in locked albums that this browser has not opened never reach the page
  const contents = allContents.filter((c) => !shut.has(c.media.id));
  const shopCfg = readShop(a.gallery.shop);
  const products = shopCfg.enabled
    ? await listProducts(db, { activeOnly: true, sheetId: shopCfg.priceSheetId || undefined })
    : [];
  const ruleRows = a.role === "visitor" ? await listRules(db, g.id) : [];
  const openRules = ruleRows.length ? await unlockedRules(g.id) : [];
  const trackRows = await tracksByIds(db, readStyle(g.style).playlist);
  const fav = new Set(proofs.favorites);
  const live = a.state === "live" || a.state === "expiring";
  const plan = (size: "web" | "full") =>
    zipPlan(
      contents.map((c) => ({ mediaId: c.media.id, filename: c.media.filename, bytes: c.media.bytes })),
      size,
    ).length;
  const [g2] = await db.select().from(schema.studioGalleries).where(eq(schema.studioGalleries.id, g.id));
  const countIn = (id: string) => allContents.filter((c) => c.item.albumId === id).length;
  const hasRules = ruleRows.length > 0;
  return {
    role: a.role,
    rules: ruleRows.map((r) => ({
      id: r.id,
      name: r.name,
      albumId: r.albumId,
      maxPx: r.maxPx,
      perVisitor: r.perVisitor,
      hasPin: Boolean(r.pinHash),
      unlocked: !r.pinHash || openRules.includes(r.id),
      printRelease: r.printRelease ?? "",
      showAll: r.showAll,
      watermarked: Boolean(r.watermarkId),
    })),
    tracks: trackRows.map((t) => ({ id: t.id, title: t.title, artist: t.artist ?? "" })),
    slug: g2?.slug ?? null,
    brand: publicBrand(await getBrand(db)),
    shop: {
      enabled: shopCfg.enabled,
      sellDigital: shopCfg.sellDigital,
      sellPrints: shopCfg.sellPrints,
      freeDownloads: shopCfg.freeDownloads,
      note: shopCfg.note,
      checkoutMessage: shopCfg.checkoutMessage,
      minOrderCents: shopCfg.minOrderCents,
      shipCountries: shopCfg.shipCountries,
      products: products.map((p) => ({
        id: p.id,
        kind: p.kind,
        name: p.name,
        description: p.description ?? "",
        priceCents: p.priceCents,
        sample: p.sample,
        size: (() => {
          const c = MOCK_CATALOG.find((x) => x.sku === p.sku);
          return c ? ([Math.max(c.widthIn, c.heightIn), Math.min(c.widthIn, c.heightIn)] as [number, number]) : null;
        })(),
      })),
    },
    galleryId: a.via === "account" ? g.id : undefined,
    title: g.title,
    welcome: g.welcome ?? "",
    accent: g.accent ?? "",
    layout: g2?.layout ?? "grid",
    theme: g2?.theme ?? "dark",
    density: g2?.density ?? "medium",
    style: readStyle(g2?.style),
    coverMediaId: g2?.coverMediaId ?? null,
    state: a.state,
    expiresAt: g.expiresAt?.toISOString().slice(0, 10) ?? null,
    allowRatings: g.allowRatings,
    allowComments: g.allowComments,
    limit: g.selectionLimit,
    sent: Boolean(g2?.selectionSentAt),
    downloads: {
      web: live && (a.role === "visitor" ? hasRules || shopCfg.freeDownloads === "web" : gal.downloadAllowed(g, "web")),
      full: live && a.role === "client" && gal.downloadAllowed(g, "full"),
      pin: a.role === "client" && Boolean(g.downloadPinHash),
      unlocked: a.role === "visitor" || !g.downloadPinHash || (await downloadsUnlocked(g.id)),
      webParts: plan("web"),
      fullParts: plan("full"),
    },
    albums: albums
      .filter((x) => !x.hidden)
      .map((x) => ({
        id: x.id,
        name: x.name,
        description: x.description ?? "",
        parentId: x.parentId,
        locked: Boolean(x.passcodeHash),
        closed: Boolean(x.passcodeHash) && !open.includes(x.id),
        count: countIn(x.id),
        coverMediaId: x.passcodeHash && !open.includes(x.id) ? null : x.coverMediaId,
      })),
    items: live
      ? contents.map((c) => ({
          mediaId: c.media.id,
          filename: c.media.filename,
          width: c.media.width ?? 1200,
          height: c.media.height ?? 800,
          color: c.media.color,
          blur: c.media.blur,
          albumId: c.item.albumId,
          favorite: fav.has(c.media.id),
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
