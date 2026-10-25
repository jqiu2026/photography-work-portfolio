import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import type { Database } from "./client";
import { StudioError } from "./errors";
import * as s from "./schema";
import { hashPasscode, verifyPasscode } from "./studio-crypto";

/* ======================================================================================================================
 * Visitors: people who gave their email address before viewing a gallery.
 * ==================================================================================================================== */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export async function registerVisitor(
  db: Database,
  galleryId: string,
  input: { email: string; name?: string },
  now = new Date(),
) {
  const email = input.email.trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 200) throw new StudioError("Enter a valid email address.");
  const name = input.name?.trim().slice(0, 120) || null;
  const [row] = await db
    .insert(s.studioVisitors)
    .values({ galleryId, email, name, firstAt: now, lastAt: now })
    .onConflictDoUpdate({
      target: [s.studioVisitors.galleryId, s.studioVisitors.email],
      set: { visits: sql`${s.studioVisitors.visits} + 1`, lastAt: now, ...(name ? { name } : {}) },
    })
    .returning();
  return row;
}
export async function listVisitors(db: Database, galleryId?: string) {
  return db
    .select({ visitor: s.studioVisitors, gallery: s.studioGalleries })
    .from(s.studioVisitors)
    .innerJoin(s.studioGalleries, eq(s.studioGalleries.id, s.studioVisitors.galleryId))
    .where(galleryId ? eq(s.studioVisitors.galleryId, galleryId) : sql`true`)
    .orderBy(desc(s.studioVisitors.lastAt));
}

/* ======================================================================================================================
 * Watermarks (visible marks put on delivered copies) and the free-download rules that use them.
 * ==================================================================================================================== */
export const POSITIONS = ["center", "bottom-right", "bottom-left", "top-right", "top-left", "tile"] as const;
export async function listWatermarks(db: Database) {
  return db
    .select()
    .from(s.studioWatermarks)
    .where(isNull(s.studioWatermarks.deletedAt))
    .orderBy(asc(s.studioWatermarks.createdAt));
}
export async function saveWatermark(
  db: Database,
  input: {
    id?: string;
    name: string;
    kind?: "text" | "image";
    text?: string;
    imageKey?: string;
    position?: string;
    opacity?: number;
    sizePct?: number;
  },
) {
  const name = input.name.trim().slice(0, 60);
  if (name.length < 2) throw new StudioError("Name the watermark.");
  const kind = input.kind ?? "text";
  if (kind === "text" && !(input.text ?? "").trim()) throw new StudioError("Type the words for the watermark.");
  if (kind === "image" && !input.imageKey && !input.id) throw new StudioError("Upload a PNG for the watermark.");
  const position = POSITIONS.find((p) => p === input.position) ?? "bottom-right";
  const opacity = Math.min(100, Math.max(5, Math.round(input.opacity ?? 45)));
  const sizePct = Math.min(80, Math.max(5, Math.round(input.sizePct ?? 22)));
  const values = {
    name,
    kind,
    text: kind === "text" ? (input.text ?? "").trim().slice(0, 80) : null,
    ...(input.imageKey ? { imageKey: input.imageKey } : {}),
    position,
    opacity,
    sizePct,
    updatedAt: new Date(),
  };
  if (input.id) {
    await db.update(s.studioWatermarks).set(values).where(eq(s.studioWatermarks.id, input.id));
    return input.id;
  }
  const first = (await listWatermarks(db)).length === 0;
  const [row] = await db
    .insert(s.studioWatermarks)
    .values({ ...values, isDefault: first })
    .returning();
  return row.id;
}
export async function setDefaultWatermark(db: Database, id: string) {
  await db.update(s.studioWatermarks).set({ isDefault: false });
  await db.update(s.studioWatermarks).set({ isDefault: true }).where(eq(s.studioWatermarks.id, id));
}
export async function deleteWatermark(db: Database, id: string) {
  await db.update(s.studioDownloadRules).set({ watermarkId: null }).where(eq(s.studioDownloadRules.watermarkId, id));
  await db
    .update(s.studioWatermarks)
    .set({ deletedAt: new Date(), isDefault: false })
    .where(eq(s.studioWatermarks.id, id));
}

export {
  DEFAULT_PREVIEW_TEXT,
  DOWNLOAD_PRESETS,
  type DownloadPreset,
  PREVIEW_MAX_PX,
  SOCIAL_MAX_PX,
  ruleSizeLabel,
  ruleTargetSize,
} from "./download-presets";
import { DOWNLOAD_PRESETS, DEFAULT_PREVIEW_TEXT } from "./download-presets";

export type RuleInput = {
  id?: string;
  galleryId: string;
  albumId?: string | null;
  name: string;
  preset?: string;
  previewText?: string;
  maxPx?: number | null;
  perVisitor?: number | null;
  watermarkId?: string | null;
  /** A PIN to require ("" removes it; undefined keeps it). */
  pin?: string;
  printRelease?: string;
  showAll?: boolean;
};
export async function listRules(db: Database, galleryId: string) {
  return db
    .select()
    .from(s.studioDownloadRules)
    .where(eq(s.studioDownloadRules.galleryId, galleryId))
    .orderBy(asc(s.studioDownloadRules.sort), asc(s.studioDownloadRules.createdAt));
}
export async function saveRule(db: Database, input: RuleInput) {
  const name = input.name.trim().slice(0, 80);
  if (name.length < 2) throw new StudioError("Name the rule: visitors see this name.");
  const preset = input.preset ?? "custom";
  if (!DOWNLOAD_PRESETS.some((p) => p.id === preset)) throw new StudioError("Pick a size for the download.");
  const maxPx = preset === "custom" ? (input.maxPx ?? null) : null;
  if (maxPx !== null && (!Number.isInteger(maxPx) || maxPx < 200 || maxPx > 12000))
    throw new StudioError("A size is 200 to 12000 pixels on the longest side.");
  const per = input.perVisitor ?? null;
  if (per !== null && (!Number.isInteger(per) || per < 1 || per > 10000))
    throw new StudioError("The download limit is 1 to 10000 per visitor.");
  if (input.albumId) {
    const [a] = await db
      .select()
      .from(s.studioAlbums)
      .where(and(eq(s.studioAlbums.id, input.albumId), eq(s.studioAlbums.galleryId, input.galleryId)));
    if (!a) throw new StudioError("That album is not in this gallery.");
  }
  let pinHash: string | null | undefined;
  if (input.pin !== undefined) {
    const pin = input.pin.trim();
    if (pin && !/^[A-Za-z0-9]{4,12}$/.test(pin)) throw new StudioError("A PIN is 4 to 12 letters or digits.");
    pinHash = pin ? await hashPasscode(pin) : null;
  }
  const values = {
    galleryId: input.galleryId,
    albumId: input.albumId ?? null,
    name,
    preset,
    maxPx,
    previewText: preset === "preview" ? input.previewText?.trim().slice(0, 40) || DEFAULT_PREVIEW_TEXT : null,
    perVisitor: per,
    watermarkId: input.watermarkId ?? null,
    printRelease: input.printRelease?.trim().slice(0, 7500) || null,
    showAll: input.showAll ?? true,
    ...(pinHash !== undefined ? { pinHash } : {}),
  };
  if (input.id) {
    await db
      .update(s.studioDownloadRules)
      .set(values)
      .where(and(eq(s.studioDownloadRules.id, input.id), eq(s.studioDownloadRules.galleryId, input.galleryId)));
    return input.id;
  }
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(s.studioDownloadRules)
    .where(eq(s.studioDownloadRules.galleryId, input.galleryId));
  if (n >= 12) throw new StudioError("A gallery can have 12 download rules.");
  const [row] = await db
    .insert(s.studioDownloadRules)
    .values({ ...values, sort: n })
    .returning();
  return row.id;
}
export async function deleteRule(db: Database, galleryId: string, id: string) {
  await db
    .delete(s.studioDownloadRules)
    .where(and(eq(s.studioDownloadRules.id, id), eq(s.studioDownloadRules.galleryId, galleryId)));
}
/** The rules that apply to a photograph: its album's rules when it has any, otherwise the gallery-wide ones. */
export function rulesForAlbum(rules: s.StudioDownloadRule[], albumId: string | null) {
  const inAlbum = albumId ? rules.filter((r) => r.albumId === albumId) : [];
  return inAlbum.length ? inAlbum : rules.filter((r) => !r.albumId);
}
export const checkRulePin = (r: Pick<s.StudioDownloadRule, "pinHash">, pin: string) =>
  r.pinHash ? verifyPasscode(pin, r.pinHash) : Promise.resolve(true);

/* ======================================================================================================================
 * Music: tracks the studio uploads once and any gallery can play (a free add-on here).
 * ==================================================================================================================== */
export async function listTracks(db: Database) {
  return db
    .select()
    .from(s.studioTracks)
    .where(isNull(s.studioTracks.deletedAt))
    .orderBy(asc(s.studioTracks.createdAt));
}
export async function addTrack(
  db: Database,
  input: { title: string; artist?: string; storageKey: string; mime: string; bytes: number },
) {
  const title = input.title.trim().slice(0, 100);
  if (title.length < 2) throw new StudioError("Give the track a title.");
  if (!/^audio\/(mpeg|mp3|mp4|aac|x-m4a|ogg|wav|x-wav|webm)$/.test(input.mime))
    throw new StudioError("Upload an MP3, M4A, AAC, OGG or WAV file.");
  const [row] = await db
    .insert(s.studioTracks)
    .values({
      title,
      artist: input.artist?.trim().slice(0, 100) || null,
      storageKey: input.storageKey,
      mime: input.mime,
      bytes: input.bytes,
    })
    .returning();
  return row;
}
/** A track that plays from a link to an audio file (https://.../song.mp3) instead of an upload. */
export async function addTrackLink(db: Database, input: { title: string; artist?: string; url: string }) {
  let u: URL;
  try {
    u = new URL(input.url.trim());
  } catch {
    throw new StudioError("Paste the full link to an audio file, starting with https://");
  }
  if (u.protocol !== "https:") throw new StudioError("The link must start with https://");
  if (!/\.(mp3|m4a|aac|ogg|oga|wav|webm)$/i.test(u.pathname))
    throw new StudioError(
      "That link is not a direct audio file (it should end in .mp3, .m4a, .ogg or .wav). Streaming pages such as YouTube or Spotify cannot be played here.",
    );
  const ext = u.pathname.split(".").pop()?.toLowerCase();
  const mime =
    ext === "m4a" || ext === "aac"
      ? "audio/mp4"
      : ext === "ogg" || ext === "oga"
        ? "audio/ogg"
        : ext === "wav"
          ? "audio/wav"
          : ext === "webm"
            ? "audio/webm"
            : "audio/mpeg";
  return addTrack(db, {
    title: input.title || decodeURIComponent(u.pathname.split("/").pop() ?? "Track").replace(/\.[^.]+$/, ""),
    artist: input.artist,
    storageKey: `url:${u.toString()}`,
    mime,
    bytes: 0,
  });
}
export async function deleteTrack(db: Database, id: string) {
  await db.update(s.studioTracks).set({ deletedAt: new Date() }).where(eq(s.studioTracks.id, id));
}
export async function tracksByIds(db: Database, ids: string[]) {
  if (!ids.length) return [];
  const rows = await db
    .select()
    .from(s.studioTracks)
    .where(and(inArray(s.studioTracks.id, ids), isNull(s.studioTracks.deletedAt)));
  return ids.map((id) => rows.find((r) => r.id === id)).filter((r): r is s.StudioTrack => Boolean(r));
}
