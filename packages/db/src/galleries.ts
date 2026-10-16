import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import type { Database } from "./client";
import { StudioError } from "./errors";
import { getPolicies } from "./forms";
import { extendGallery, galleryState } from "./gallery-expiry";
import { freeSlug } from "./gallery-link";
import * as s from "./schema";
import { createInvoice, sendInvoice } from "./studio";
import { hashPasscode, verifyPasscode } from "./studio-crypto";

/** Client galleries v2: settings, albums, ordering, proofing, selections, download rules and the log, expiry and reactivation. */
export { extendGallery, galleryState };

const ACCENT = /^#[0-9a-fA-F]{6}$/;

/* ---------- settings ---------- */
export type GallerySettings = {
  title?: string;
  welcome?: string;
  accent?: string;
  downloadPolicy?: "none" | "preview" | "web" | "full";
  /** Months of access from now (0 = no expiry date). */
  accessMonths?: number;
  selectionLimit?: number | null;
  allowComments?: boolean;
  allowRatings?: boolean;
  watermark?: boolean;
  layout?: "grid" | "masonry" | "rows" | "story" | "mosaic";
  theme?: "dark" | "light" | "paper" | "slate";
  density?: "small" | "medium" | "large";
  /** ISO time to publish at, or null to clear. */
  publishAt?: string | null;
  notes?: string;
};
export async function updateGallery(db: Database, id: string, p: GallerySettings, by?: string, now = new Date()) {
  const set: Partial<typeof s.studioGalleries.$inferInsert> = { updatedAt: now, updatedBy: by };
  if (p.title !== undefined) {
    if (p.title.trim().length < 2) throw new StudioError("Give the gallery a title.");
    set.title = p.title.trim().slice(0, 120);
  }
  if (p.welcome !== undefined) set.welcome = p.welcome.trim().slice(0, 600) || null;
  if (p.accent !== undefined) {
    if (p.accent && !ACCENT.test(p.accent)) throw new StudioError("The accent colour is a hex value like #cc3322.");
    set.accent = p.accent || null;
  }
  if (p.downloadPolicy) set.downloadPolicy = p.downloadPolicy;
  if (p.accessMonths !== undefined) {
    if (!Number.isInteger(p.accessMonths) || p.accessMonths < 0 || p.accessMonths > 120)
      throw new StudioError("Access is 0 to 120 months.");
    const e = new Date(now.getTime());
    e.setUTCMonth(e.getUTCMonth() + p.accessMonths);
    set.expiresAt = p.accessMonths ? e : null;
    set.expiryReminderAt = null;
  }
  if (p.selectionLimit !== undefined) {
    if (
      p.selectionLimit !== null &&
      (!Number.isInteger(p.selectionLimit) || p.selectionLimit < 1 || p.selectionLimit > 5000)
    )
      throw new StudioError("The selection limit is 1 to 5000.");
    set.selectionLimit = p.selectionLimit;
  }
  if (p.allowComments !== undefined) set.allowComments = p.allowComments;
  if (p.allowRatings !== undefined) set.allowRatings = p.allowRatings;
  if (p.watermark !== undefined) set.watermark = p.watermark;
  if (p.layout) set.layout = p.layout;
  if (p.theme) set.theme = p.theme;
  if (p.density) set.density = p.density;
  if (p.notes !== undefined) set.notes = p.notes.trim().slice(0, 2000) || null;
  if (p.publishAt !== undefined) {
    if (p.publishAt === null) set.publishAt = null;
    else {
      const at = new Date(p.publishAt);
      if (Number.isNaN(at.getTime())) throw new StudioError("Enter a valid publish date and time.");
      set.publishAt = at;
    }
  }
  const [row] = await db.update(s.studioGalleries).set(set).where(eq(s.studioGalleries.id, id)).returning();
  if (!row) throw new StudioError("Unknown gallery.");
  return row;
}

export async function setPasscode(db: Database, id: string, passcode: string) {
  if (passcode.trim().length < 6) throw new StudioError("A passcode needs at least 6 characters.");
  const all = await db
    .select({ id: s.studioGalleries.id, h: s.studioGalleries.passcodeHash })
    .from(s.studioGalleries)
    .where(isNull(s.studioGalleries.deletedAt));
  for (const g of all)
    if (g.id !== id && (await verifyPasscode(passcode, g.h))) throw new StudioError("That passcode is already used.");
  await db
    .update(s.studioGalleries)
    .set({ passcodeHash: await hashPasscode(passcode), updatedAt: new Date() })
    .where(eq(s.studioGalleries.id, id));
}

/** The download PIN is optional; clear it with an empty string. */
export async function setDownloadPin(db: Database, id: string, pin: string) {
  if (pin && !/^\d{4,8}$/.test(pin)) throw new StudioError("A PIN is 4 to 8 digits.");
  await db
    .update(s.studioGalleries)
    .set({ downloadPinHash: pin ? await hashPasscode(pin) : null, updatedAt: new Date() })
    .where(eq(s.studioGalleries.id, id));
}
export async function checkDownloadPin(g: Pick<s.StudioGallery, "downloadPinHash">, pin: string) {
  return !g.downloadPinHash || (await verifyPasscode(pin, g.downloadPinHash));
}

/* ---------- items and albums ---------- */
export async function addItems(db: Database, galleryId: string, mediaIds: string[], albumId?: string | null) {
  if (!mediaIds.length) return 0;
  const [{ n }] = await db
    .select({ n: sql<number>`coalesce(max(${s.studioGalleryItems.sort}), -1) + 1` })
    .from(s.studioGalleryItems)
    .where(eq(s.studioGalleryItems.galleryId, galleryId));
  await db
    .insert(s.studioGalleryItems)
    .values(mediaIds.map((mediaId, i) => ({ galleryId, mediaId, sort: Number(n) + i, albumId: albumId ?? null })))
    .onConflictDoNothing();
  return mediaIds.length;
}
export async function removeItem(db: Database, galleryId: string, mediaId: string) {
  await db
    .delete(s.studioGalleryItems)
    .where(and(eq(s.studioGalleryItems.galleryId, galleryId), eq(s.studioGalleryItems.mediaId, mediaId)));
  await db
    .delete(s.studioFavorites)
    .where(and(eq(s.studioFavorites.galleryId, galleryId), eq(s.studioFavorites.mediaId, mediaId)));
}
export async function setCover(db: Database, galleryId: string, mediaId: string) {
  await db.update(s.studioGalleries).set({ coverMediaId: mediaId }).where(eq(s.studioGalleries.id, galleryId));
}
export async function setHidden(db: Database, galleryId: string, mediaId: string, hidden: boolean) {
  await db
    .update(s.studioGalleryItems)
    .set({ hidden })
    .where(and(eq(s.studioGalleryItems.galleryId, galleryId), eq(s.studioGalleryItems.mediaId, mediaId)));
}
export async function createAlbum(db: Database, galleryId: string, name: string, parentId?: string | null) {
  if (name.trim().length < 2) throw new StudioError("Name the album.");
  if (parentId) {
    const [p] = await db
      .select()
      .from(s.studioAlbums)
      .where(and(eq(s.studioAlbums.id, parentId), eq(s.studioAlbums.galleryId, galleryId)));
    if (!p) throw new StudioError("That parent album is not in this gallery.");
    if (p.parentId) throw new StudioError("Albums nest one level: choose a top-level album as the parent.");
  }
  const [{ n }] = await db
    .select({ n: sql<number>`coalesce(max(${s.studioAlbums.sort}), -1) + 1` })
    .from(s.studioAlbums)
    .where(eq(s.studioAlbums.galleryId, galleryId));
  const [row] = await db
    .insert(s.studioAlbums)
    .values({ galleryId, name: name.trim().slice(0, 60), sort: Number(n), parentId: parentId ?? null })
    .returning();
  return row;
}
export type AlbumPatch = {
  name?: string;
  description?: string;
  hidden?: boolean;
  parentId?: string | null;
  coverMediaId?: string | null;
  /** A passcode locks the album; "" removes the lock; undefined leaves it as it is. */
  passcode?: string;
};
export async function updateAlbum(db: Database, galleryId: string, albumId: string, p: AlbumPatch) {
  const [cur] = await db
    .select()
    .from(s.studioAlbums)
    .where(and(eq(s.studioAlbums.id, albumId), eq(s.studioAlbums.galleryId, galleryId)));
  if (!cur) throw new StudioError("Unknown album.");
  const set: Partial<typeof s.studioAlbums.$inferInsert> = {};
  if (p.name !== undefined) {
    if (p.name.trim().length < 2) throw new StudioError("Name the album.");
    set.name = p.name.trim().slice(0, 60);
  }
  if (p.description !== undefined) set.description = p.description.trim().slice(0, 400) || null;
  if (p.hidden !== undefined) set.hidden = p.hidden;
  if (p.coverMediaId !== undefined) set.coverMediaId = p.coverMediaId;
  if (p.parentId !== undefined) {
    if (p.parentId === albumId) throw new StudioError("An album cannot sit inside itself.");
    if (p.parentId) {
      const [par] = await db
        .select()
        .from(s.studioAlbums)
        .where(and(eq(s.studioAlbums.id, p.parentId), eq(s.studioAlbums.galleryId, galleryId)));
      if (!par) throw new StudioError("That parent album is not in this gallery.");
      if (par.parentId) throw new StudioError("Albums nest one level: choose a top-level album as the parent.");
      const kids = await db
        .select({ id: s.studioAlbums.id })
        .from(s.studioAlbums)
        .where(eq(s.studioAlbums.parentId, albumId));
      if (kids.length) throw new StudioError("This album has sub-albums, so it cannot become one itself.");
    }
    set.parentId = p.parentId;
  }
  if (p.passcode !== undefined) {
    const code = p.passcode.trim();
    if (code && code.length < 4) throw new StudioError("An album passcode needs at least 4 characters.");
    set.passcodeHash = code ? await hashPasscode(code) : null;
  }
  if (Object.keys(set).length) await db.update(s.studioAlbums).set(set).where(eq(s.studioAlbums.id, albumId));
}
export async function deleteAlbum(db: Database, galleryId: string, albumId: string) {
  const [cur] = await db
    .select()
    .from(s.studioAlbums)
    .where(and(eq(s.studioAlbums.id, albumId), eq(s.studioAlbums.galleryId, galleryId)));
  if (!cur) return;
  // photographs and sub-albums move up one level; nothing is deleted with the album
  await db
    .update(s.studioGalleryItems)
    .set({ albumId: cur.parentId })
    .where(and(eq(s.studioGalleryItems.galleryId, galleryId), eq(s.studioGalleryItems.albumId, albumId)));
  await db.update(s.studioAlbums).set({ parentId: cur.parentId }).where(eq(s.studioAlbums.parentId, albumId));
  await db.delete(s.studioAlbums).where(and(eq(s.studioAlbums.id, albumId), eq(s.studioAlbums.galleryId, galleryId)));
}
/** Puts the albums in the given order (ids not listed keep their place after them). */
export async function sortAlbums(db: Database, galleryId: string, orderedIds: string[]) {
  let i = 0;
  for (const id of orderedIds)
    await db
      .update(s.studioAlbums)
      .set({ sort: i++ })
      .where(and(eq(s.studioAlbums.id, id), eq(s.studioAlbums.galleryId, galleryId)));
}
export async function checkAlbumPasscode(album: Pick<s.StudioAlbum, "passcodeHash">, passcode: string) {
  return album.passcodeHash ? verifyPasscode(passcode, album.passcodeHash) : true;
}
export async function moveToAlbum(db: Database, galleryId: string, mediaIds: string[], albumId: string | null) {
  if (!mediaIds.length) return;
  await db
    .update(s.studioGalleryItems)
    .set({ albumId })
    .where(and(eq(s.studioGalleryItems.galleryId, galleryId), inArray(s.studioGalleryItems.mediaId, mediaIds)));
}
export async function listAlbums(db: Database, galleryId: string) {
  return db
    .select()
    .from(s.studioAlbums)
    .where(eq(s.studioAlbums.galleryId, galleryId))
    .orderBy(asc(s.studioAlbums.sort));
}

/** Items with their media rows, in order. `includeHidden` is for the owner; clients never see hidden ones. */
export async function galleryContents(db: Database, galleryId: string, opts: { includeHidden?: boolean } = {}) {
  const rows = await db
    .select({ item: s.studioGalleryItems, media: s.media })
    .from(s.studioGalleryItems)
    .innerJoin(s.media, eq(s.media.id, s.studioGalleryItems.mediaId))
    .where(
      and(
        eq(s.studioGalleryItems.galleryId, galleryId),
        opts.includeHidden ? undefined : eq(s.studioGalleryItems.hidden, false),
        isNull(s.media.deletedAt),
      ),
    )
    .orderBy(asc(s.studioGalleryItems.sort), asc(s.media.filename));
  return rows;
}

/* ---------- proofing ---------- */
const inGallery = async (db: Database, galleryId: string, mediaId: string) => {
  const [r] = await db
    .select()
    .from(s.studioGalleryItems)
    .where(
      and(
        eq(s.studioGalleryItems.galleryId, galleryId),
        eq(s.studioGalleryItems.mediaId, mediaId),
        eq(s.studioGalleryItems.hidden, false),
      ),
    );
  if (!r) throw new StudioError("That photograph is not in this gallery.");
};
const lockedCheck = async (db: Database, galleryId: string) => {
  const [g] = await db.select().from(s.studioGalleries).where(eq(s.studioGalleries.id, galleryId));
  if (!g) throw new StudioError("Unknown gallery.");
  return g;
};

async function upsertProof(
  db: Database,
  galleryId: string,
  mediaId: string,
  kind: "rating" | "approval",
  values: { rating?: number | null; decision?: string | null },
) {
  const [existing] = await db
    .select()
    .from(s.studioProofs)
    .where(
      and(eq(s.studioProofs.galleryId, galleryId), eq(s.studioProofs.mediaId, mediaId), eq(s.studioProofs.kind, kind)),
    );
  if (existing)
    await db
      .update(s.studioProofs)
      .set({ ...values, createdAt: new Date() })
      .where(eq(s.studioProofs.id, existing.id));
  else await db.insert(s.studioProofs).values({ galleryId, mediaId, kind, ...values });
}
export async function rate(db: Database, galleryId: string, mediaId: string, rating: number | null) {
  const g = await lockedCheck(db, galleryId);
  if (!g.allowRatings) throw new StudioError("Ratings are off for this gallery.");
  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5))
    throw new StudioError("Rate from 1 to 5.");
  await inGallery(db, galleryId, mediaId);
  await upsertProof(db, galleryId, mediaId, "rating", { rating });
}
export async function decide(
  db: Database,
  galleryId: string,
  mediaId: string,
  decision: "approved" | "rejected" | null,
) {
  const g = await lockedCheck(db, galleryId);
  if (g.selectionSentAt) throw new StudioError("You already sent your selection. Message me if you want to change it.");
  await inGallery(db, galleryId, mediaId);
  await upsertProof(db, galleryId, mediaId, "approval", { decision });
}
export async function comment(
  db: Database,
  galleryId: string,
  mediaId: string,
  body: string,
  author: "client" | "studio" = "client",
) {
  const g = await lockedCheck(db, galleryId);
  if (author === "client" && !g.allowComments) throw new StudioError("Comments are off for this gallery.");
  const text = body.trim();
  if (text.length < 2) throw new StudioError("Write a comment first.");
  if (text.length > 1000) throw new StudioError("Keep a comment under 1000 characters.");
  await inGallery(db, galleryId, mediaId);
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(s.studioProofs)
    .where(and(eq(s.studioProofs.galleryId, galleryId), eq(s.studioProofs.kind, "comment")));
  if (Number(n) >= 2000) throw new StudioError("This gallery has too many comments.");
  const [row] = await db
    .insert(s.studioProofs)
    .values({ galleryId, mediaId, kind: "comment", body: text, author })
    .returning();
  return row;
}
export async function proofsFor(db: Database, galleryId: string) {
  return db
    .select()
    .from(s.studioProofs)
    .where(eq(s.studioProofs.galleryId, galleryId))
    .orderBy(asc(s.studioProofs.createdAt));
}

/** A summary for the owner: what the client picked, rated, approved, rejected and said. */
export async function proofSummary(db: Database, galleryId: string) {
  const [favs, proofs, [g]] = await Promise.all([
    db.select().from(s.studioFavorites).where(eq(s.studioFavorites.galleryId, galleryId)),
    proofsFor(db, galleryId),
    db.select().from(s.studioGalleries).where(eq(s.studioGalleries.id, galleryId)),
  ]);
  const ratings = proofs.filter((p) => p.kind === "rating" && p.rating);
  return {
    favourites: favs.map((f) => f.mediaId),
    ratings: Object.fromEntries(ratings.map((p) => [p.mediaId, p.rating as number])),
    approved: proofs.filter((p) => p.kind === "approval" && p.decision === "approved").map((p) => p.mediaId),
    rejected: proofs.filter((p) => p.kind === "approval" && p.decision === "rejected").map((p) => p.mediaId),
    comments: proofs
      .filter((p) => p.kind === "comment")
      .map((p) => ({ id: p.id, mediaId: p.mediaId, body: p.body ?? "", author: p.author, at: p.createdAt })),
    selectionSentAt: g?.selectionSentAt ?? null,
    selectionLimit: g?.selectionLimit ?? null,
  };
}

/** "Send selection": locks the picks and tells the owner. The caller sends the email. */
export async function sendSelection(db: Database, galleryId: string, now = new Date()) {
  const g = await lockedCheck(db, galleryId);
  if (g.selectionSentAt) throw new StudioError("You already sent your selection.");
  const favs = await db.select().from(s.studioFavorites).where(eq(s.studioFavorites.galleryId, galleryId));
  if (!favs.length) throw new StudioError("Pick at least one photograph first.");
  const rows = await db
    .update(s.studioGalleries)
    .set({ selectionSentAt: now, updatedAt: now })
    .where(and(eq(s.studioGalleries.id, galleryId), isNull(s.studioGalleries.selectionSentAt)))
    .returning();
  if (!rows.length) throw new StudioError("You already sent your selection.");
  return { gallery: rows[0], count: favs.length };
}
export async function reopenSelection(db: Database, galleryId: string) {
  await db.update(s.studioGalleries).set({ selectionSentAt: null }).where(eq(s.studioGalleries.id, galleryId));
}

/* ---------- downloads ---------- */
export type DownloadKind = "web" | "full";
/** none: nothing; preview: nothing (protected previews only); web: web size; full: web size and full resolution. */
export function downloadAllowed(g: Pick<s.StudioGallery, "downloadPolicy">, kind: DownloadKind): boolean {
  if (g.downloadPolicy === "full") return true;
  if (g.downloadPolicy === "web") return kind === "web";
  return false;
}
export async function logDownload(
  db: Database,
  e: {
    galleryId: string;
    mediaId?: string | null;
    kind: string;
    part?: number;
    viewer?: string;
    ipHash?: string;
    bytes?: number;
  },
) {
  await db.insert(s.studioDownloadEvents).values({
    galleryId: e.galleryId,
    mediaId: e.mediaId ?? null,
    kind: e.kind,
    part: e.part ?? null,
    viewer: e.viewer ?? null,
    ipHash: e.ipHash ?? null,
    bytes: e.bytes ?? null,
  });
}
export async function downloadLog(db: Database, galleryId: string, limit = 100) {
  return db
    .select()
    .from(s.studioDownloadEvents)
    .where(eq(s.studioDownloadEvents.galleryId, galleryId))
    .orderBy(desc(s.studioDownloadEvents.at))
    .limit(limit);
}

/* ---------- expiry and reactivation ---------- */
/** Finds a gallery by its passcode, expired or not, so an expired one can offer an extension. */
export async function findGalleryByPasscode(db: Database, passcode: string) {
  const rows = await db
    .select()
    .from(s.studioGalleries)
    .where(and(isNull(s.studioGalleries.deletedAt), inArray(s.studioGalleries.status, ["published", "archived"])));
  for (const g of rows) {
    if (g.accessMode === "magic-link") continue;
    if (await verifyPasscode(passcode, g.passcodeHash)) return g;
  }
  return null;
}

/**
 * An invoice for more gallery time (the policy's extension fee and period). Paying it extends that gallery, and brings an
 * archived or expired one back. One open extension invoice per gallery at a time.
 */
export async function createExtensionInvoice(db: Database, galleryId: string, now = new Date()) {
  const [g] = await db.select().from(s.studioGalleries).where(eq(s.studioGalleries.id, galleryId));
  if (!g) throw new StudioError("Unknown gallery.");
  const p = await getPolicies(db);
  const open = await db
    .select()
    .from(s.studioInvoices)
    .where(
      and(
        eq(s.studioInvoices.galleryId, galleryId),
        eq(s.studioInvoices.kind, "extension"),
        inArray(s.studioInvoices.status, ["sent", "viewed", "partial"]),
      ),
    );
  const invoice =
    open[0] ??
    (await (async () => {
      if (p.extensionFeeIsSample)
        throw new StudioError("The extension fee has not been set yet (Forms, Gallery and cancellation policies).");
      if (p.extensionFeeCents < 100) throw new StudioError("Set an extension fee of at least one dollar first.");
      const inv = await createInvoice(
        db,
        {
          jobId: g.jobId,
          lines: [
            {
              description: `Gallery access: ${g.title} (${p.extensionMonths} months)`,
              amountCents: p.extensionFeeCents,
            },
          ],
        },
        undefined,
        now,
      );
      await db.update(s.studioInvoices).set({ kind: "extension", galleryId }).where(eq(s.studioInvoices.id, inv.id));
      return inv;
    })());
  const { token } = await sendInvoice(db, invoice.id, now);
  return { invoice, token, months: p.extensionMonths, cents: p.extensionFeeCents };
}

/* ---------- the studio's gallery tools ---------- */
const PASSCODE_CHARS = "abcdefghjkmnpqrstuvwxyz23456789";
/** A readable random passcode (no look-alike characters), unique among live galleries. */
export async function freshPasscode(db: Database, length = 8): Promise<string> {
  const { randomInt } = await import("node:crypto");
  const all = await db
    .select({ h: s.studioGalleries.passcodeHash })
    .from(s.studioGalleries)
    .where(isNull(s.studioGalleries.deletedAt));
  for (let tries = 0; tries < 20; tries++) {
    const code = Array.from({ length }, () => PASSCODE_CHARS[randomInt(PASSCODE_CHARS.length)]).join("");
    let clash = false;
    for (const g of all) if (g.h && (await verifyPasscode(code, g.h))) clash = true;
    if (!clash) return code;
  }
  throw new StudioError("Could not make a unique passcode. Try again.");
}

/** A new draft with the same settings, albums and photographs. Returns the passcode (shown once). */
export async function duplicateGallery(db: Database, id: string, by?: string) {
  const [g] = await db
    .select()
    .from(s.studioGalleries)
    .where(and(eq(s.studioGalleries.id, id), isNull(s.studioGalleries.deletedAt)));
  if (!g) throw new StudioError("Unknown gallery.");
  const passcode = await freshPasscode(db);
  const {
    id: _id,
    createdAt: _c,
    updatedAt: _u,
    passcodeHash: _p,
    status: _s,
    selectionSentAt: _sel,
    deliveredAt: _d,
    expiryReminderAt: _r,
    reactivatedAt: _re,
    publishAt: _pa,
    ...keep
  } = g;
  const [copy] = await db
    .insert(s.studioGalleries)
    .values({
      ...keep,
      slug: await freeSlug(db, `${g.title} copy`),
      title: `${g.title} (copy)`.slice(0, 120),
      status: "draft",
      passcodeHash: await hashPasscode(passcode),
      updatedBy: by,
    })
    .returning();
  const albums = await listAlbums(db, id);
  const map = new Map<string, string>();
  for (const a of albums) {
    const [n] = await db.insert(s.studioAlbums).values({ galleryId: copy.id, name: a.name, sort: a.sort }).returning();
    map.set(a.id, n.id);
  }
  const items = await db.select().from(s.studioGalleryItems).where(eq(s.studioGalleryItems.galleryId, id));
  if (items.length)
    await db.insert(s.studioGalleryItems).values(
      items.map((i) => ({
        galleryId: copy.id,
        mediaId: i.mediaId,
        sort: i.sort,
        hidden: i.hidden,
        albumId: i.albumId ? (map.get(i.albumId) ?? null) : null,
      })),
    );
  return { gallery: copy, passcode };
}

/** Moves a gallery to the trash (the photographs stay in the media library). */
export async function deleteGallery(db: Database, id: string, by?: string, now = new Date()) {
  const [row] = await db
    .update(s.studioGalleries)
    .set({ deletedAt: now, updatedAt: now, updatedBy: by })
    .where(and(eq(s.studioGalleries.id, id), isNull(s.studioGalleries.deletedAt)))
    .returning();
  if (!row) throw new StudioError("Unknown gallery.");
  return row;
}

export type SortMode = "name" | "newest" | "oldest";
/** Rewrites the manual order from a rule: filename, or when the photograph was added. */
export async function sortItems(db: Database, galleryId: string, mode: SortMode) {
  const rows = await galleryContents(db, galleryId, { includeHidden: true });
  const sorted = [...rows].sort((a, b) =>
    mode === "name"
      ? a.media.filename.localeCompare(b.media.filename, undefined, { numeric: true })
      : mode === "newest"
        ? b.media.createdAt.getTime() - a.media.createdAt.getTime()
        : a.media.createdAt.getTime() - b.media.createdAt.getTime(),
  );
  for (const [i, r] of sorted.entries())
    await db
      .update(s.studioGalleryItems)
      .set({ sort: i })
      .where(and(eq(s.studioGalleryItems.galleryId, galleryId), eq(s.studioGalleryItems.mediaId, r.media.id)));
  return sorted.length;
}

/** Puts the chosen photographs first, in the order given (the rest keep their order after them). */
export async function moveToFront(db: Database, galleryId: string, mediaIds: string[]) {
  const rows = await galleryContents(db, galleryId, { includeHidden: true });
  const first = mediaIds.filter((m) => rows.some((r) => r.media.id === m));
  const order = [...first, ...rows.map((r) => r.media.id).filter((m) => !first.includes(m))];
  for (const [i, m] of order.entries())
    await db
      .update(s.studioGalleryItems)
      .set({ sort: i })
      .where(and(eq(s.studioGalleryItems.galleryId, galleryId), eq(s.studioGalleryItems.mediaId, m)));
}

export async function setHiddenMany(db: Database, galleryId: string, mediaIds: string[], hidden: boolean) {
  if (!mediaIds.length) return;
  await db
    .update(s.studioGalleryItems)
    .set({ hidden })
    .where(and(eq(s.studioGalleryItems.galleryId, galleryId), inArray(s.studioGalleryItems.mediaId, mediaIds)));
}
export async function removeMany(db: Database, galleryId: string, mediaIds: string[]) {
  if (!mediaIds.length) return;
  await db
    .delete(s.studioGalleryItems)
    .where(and(eq(s.studioGalleryItems.galleryId, galleryId), inArray(s.studioGalleryItems.mediaId, mediaIds)));
}

/** The studio previewing its own photographs is not a client view. */
const notStaff = sql`${s.studioViewEvents.viewer} not like 'staff.%'`;

export type GalleryStats = { photos: number; favourites: number; downloads: number; views: number; viewers: number };
/** Counts per gallery for the list: photographs, favourites, downloads, and views of its photographs (and distinct viewers). */
export async function galleryStats(db: Database, ids: string[]): Promise<Map<string, GalleryStats>> {
  const out = new Map<string, GalleryStats>(
    ids.map((i) => [i, { photos: 0, favourites: 0, downloads: 0, views: 0, viewers: 0 }]),
  );
  if (!ids.length) return out;
  const photos = await db
    .select({ id: s.studioGalleryItems.galleryId, n: sql<number>`count(*)::int` })
    .from(s.studioGalleryItems)
    .where(inArray(s.studioGalleryItems.galleryId, ids))
    .groupBy(s.studioGalleryItems.galleryId);
  for (const r of photos) out.get(r.id)!.photos = r.n;
  const favs = await db
    .select({ id: s.studioFavorites.galleryId, n: sql<number>`count(*)::int` })
    .from(s.studioFavorites)
    .where(inArray(s.studioFavorites.galleryId, ids))
    .groupBy(s.studioFavorites.galleryId);
  for (const r of favs) out.get(r.id)!.favourites = r.n;
  const dls = await db
    .select({ id: s.studioDownloadEvents.galleryId, n: sql<number>`count(*)::int` })
    .from(s.studioDownloadEvents)
    .where(inArray(s.studioDownloadEvents.galleryId, ids))
    .groupBy(s.studioDownloadEvents.galleryId);
  for (const r of dls) out.get(r.id)!.downloads = r.n;
  const views = await db
    .select({
      id: s.studioGalleryItems.galleryId,
      n: sql<number>`count(*)::int`,
      v: sql<number>`count(distinct ${s.studioViewEvents.viewer})::int`,
    })
    .from(s.studioViewEvents)
    .innerJoin(s.studioGalleryItems, eq(s.studioGalleryItems.mediaId, s.studioViewEvents.mediaId))
    .where(and(inArray(s.studioGalleryItems.galleryId, ids), notStaff))
    .groupBy(s.studioGalleryItems.galleryId);
  for (const r of views) {
    const o = out.get(r.id)!;
    o.views = r.n;
    o.viewers = r.v;
  }
  return out;
}

/** Drafts whose publish time has passed. The caller publishes and emails each (so the email logic stays in one place). */
export async function dueToPublish(db: Database, now = new Date()) {
  return db
    .select()
    .from(s.studioGalleries)
    .where(
      and(
        eq(s.studioGalleries.status, "draft"),
        isNull(s.studioGalleries.deletedAt),
        sql`${s.studioGalleries.publishAt} is not null and ${s.studioGalleries.publishAt} <= ${now.toISOString()}`,
      ),
    );
}

/** Views of this gallery's photographs: totals, the latest few, and how often each photograph was opened. */
export async function viewSummary(db: Database, galleryId: string, limit = 40) {
  const rows = await db
    .select({ at: s.studioViewEvents.at, viewer: s.studioViewEvents.viewer, mediaId: s.studioViewEvents.mediaId })
    .from(s.studioViewEvents)
    .innerJoin(s.studioGalleryItems, eq(s.studioGalleryItems.mediaId, s.studioViewEvents.mediaId))
    .where(and(eq(s.studioGalleryItems.galleryId, galleryId), notStaff))
    .orderBy(desc(s.studioViewEvents.at))
    .limit(2000);
  const perPhoto: Record<string, number> = {};
  for (const r of rows) perPhoto[r.mediaId] = (perPhoto[r.mediaId] ?? 0) + 1;
  return {
    total: rows.length,
    viewers: new Set(rows.map((r) => r.viewer)).size,
    last: rows[0]?.at ?? null,
    recent: rows.slice(0, limit),
    perPhoto,
  };
}
