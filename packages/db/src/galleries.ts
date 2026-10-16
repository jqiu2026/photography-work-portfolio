import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import type { Database } from "./client";
import { StudioError } from "./errors";
import { getPolicies } from "./forms";
import { extendGallery, galleryState } from "./gallery-expiry";
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
export async function createAlbum(db: Database, galleryId: string, name: string) {
  if (name.trim().length < 2) throw new StudioError("Name the album.");
  const [{ n }] = await db
    .select({ n: sql<number>`coalesce(max(${s.studioAlbums.sort}), -1) + 1` })
    .from(s.studioAlbums)
    .where(eq(s.studioAlbums.galleryId, galleryId));
  const [row] = await db
    .insert(s.studioAlbums)
    .values({ galleryId, name: name.trim().slice(0, 60), sort: Number(n) })
    .returning();
  return row;
}
export async function deleteAlbum(db: Database, galleryId: string, albumId: string) {
  await db
    .update(s.studioGalleryItems)
    .set({ albumId: null })
    .where(and(eq(s.studioGalleryItems.galleryId, galleryId), eq(s.studioGalleryItems.albumId, albumId)));
  await db.delete(s.studioAlbums).where(and(eq(s.studioAlbums.id, albumId), eq(s.studioAlbums.galleryId, galleryId)));
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
