import { and, desc, eq, gt, gte, inArray, ne, or, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "./client";
import { StudioError } from "./errors";
import * as s from "./schema";

/**
 * Per-gallery protection and look. Stored as JSON on the gallery, always read through these schemas so a missing or odd value
 * becomes the default. The protection is a deterrent that logs and traces (docs/project/05-security-and-image-protection.md):
 * a browser cannot truly stop a screenshot, and these settings say so in the studio.
 */
export const securitySchema = z.object({
  /** off | light (no right-click or drag) | strict (also screenshot, save, print, devtools keys; hides media on focus loss). */
  level: z.enum(["off", "light", "strict"]).default("strict"),
  /** What a trigger does: only log it, warn the viewer, or warn and lock them out after `strikes` triggers. */
  onTrigger: z.enum(["log", "warn", "lock"]).default("warn"),
  strikes: z.number().int().min(1).max(20).default(3),
  lockMinutes: z.number().int().min(1).max(1440).default(30),
  blurOnLeave: z.boolean().default(true),
  blockSelection: z.boolean().default(true),
  blockContextMenu: z.boolean().default(true),
  blockPrint: z.boolean().default(true),
  detectDevtools: z.boolean().default(false),
  /** Photographs stay blurred until the viewer holds the pointer (or Shift) down. */
  holdToView: z.boolean().default(false),
  /** A faint tiled viewer code over the page, so a photographed or recorded screen traces back to the session. */
  viewerOverlay: z.boolean().default(false),
  overlayOpacity: z.number().min(0.04).max(0.4).default(0.12),
  /** Close the gallery after this many idle minutes (0 = never). */
  idleMinutes: z.number().int().min(0).max(240).default(0),
  /** Most downloads (single files or ZIP parts) one viewer may make per day (0 = unlimited). */
  maxDownloadsPerDay: z.number().int().min(0).max(1000).default(0),
  /** Your own wording for the reminder shown on a capture attempt (empty = the standard text). */
  protectTitle: z.string().trim().max(80).default(""),
  protectMessage: z.string().trim().max(1000).default(""),
  /** On touch screens half of each photograph stays blurred; pressing and holding moves the blur away. */
  mobileHalfBlur: z.boolean().default(false),
  /** Add an entry to the studio activity feed on the first trigger and when someone is locked out. */
  notifyOwner: z.boolean().default(true),
});
export type GallerySecurity = z.infer<typeof securitySchema>;
export const readSecurity = (raw: unknown): GallerySecurity => {
  const r = securitySchema.safeParse(raw ?? {});
  return r.success ? r.data : securitySchema.parse({});
};

/** Typeface keys (the studio shows a name for each; the gallery loads the font only when it is chosen). */
export const GALLERY_FONTS = [
  "sans",
  "modern",
  "serif",
  "editorial",
  "classic",
  "display",
  "mono",
  "inter",
  "figtree",
  "sora",
  "urbanist",
  "montserrat",
  "raleway",
  "lato",
  "roboto",
  "cabin",
  "quicksand",
  "lora",
  "merriweather",
  "spectral",
  "oswald",
  "bebas",
  "caveat",
  "dancing",
] as const;
const hex = z
  .string()
  .trim()
  .regex(/^(#[0-9a-fA-F]{6})?$/, "Colours are hex values like #101010.")
  .default("");
export const styleSchema = z.object({
  font: z.enum(GALLERY_FONTS).default("sans"),
  /** How the gallery opens: a full-bleed cover with the title over it, a cover beside the title, or just the title. */
  header: z.enum(["cinematic", "split", "minimal"]).default("cinematic"),
  /** With albums: tabs above the photographs, or a page of album cards first. */
  albumView: z.enum(["tabs", "cards"]).default("cards"),
  gap: z.enum(["tight", "normal", "wide"]).default("normal"),
  corners: z.enum(["square", "soft", "round"]).default("soft"),
  showFilenames: z.boolean().default(false),
  /** Legacy: cover above the photographs (the header setting replaces it). */
  heroCover: z.boolean().default(false),
  /** Small line above the title (for example your studio name). */
  brandLine: z.string().trim().max(60).default(""),
  /** Closing line under the photographs (contact details, a thank-you). */
  footer: z.string().trim().max(300).default(""),
  /** Page background colour (hex); empty keeps the theme. */
  background: z
    .string()
    .trim()
    .regex(/^(#[0-9a-fA-F]{6})?$/, "The background is a hex colour like #101010.")
    .default(""),
  /** Colours: primary drives buttons and the active tab (the gallery accent is the same setting), secondary the links. */
  primary: hex,
  secondary: hex,
  /** The cover page a visitor sees first, with a View Gallery button. */
  introPage: z.boolean().default(true),
  /** A message shown once per visit before the photographs (rules, a thank-you). Plain text with **bold**, *italic*, [links](https://...) and "- " lists. */
  introHeadline: z.string().trim().max(60).default("Rules"),
  introMessage: z.string().trim().max(3000).default(""),
  /** A line across the top of every page (a call to action). */
  bannerEnabled: z.boolean().default(false),
  bannerText: z.string().trim().max(120).default(""),
  bannerLink: z
    .string()
    .trim()
    .max(300)
    .refine((v) => v === "" || /^https?:\/\//i.test(v), "A banner link starts with https://")
    .default(""),
  bannerExpires: z.string().trim().max(10).default(""),
  /** About tab text, shown above the brand's contact details. */
  aboutText: z.string().trim().max(1500).default(""),
  /** Navigation and actions. */
  allowSharing: z.boolean().default(true),
  showDownloadAll: z.boolean().default(true),
  hideAllPhotos: z.boolean().default(false),
  hideAlbumCount: z.boolean().default(false),
  hideAlbums: z.boolean().default(false),
  /** Music: ids of studio tracks, played in order. */
  playlist: z.array(z.string().uuid()).max(30).default([]),
  autoplay: z.boolean().default(false),
});
export type GalleryStyle = z.infer<typeof styleSchema>;
export const readStyle = (raw: unknown): GalleryStyle => {
  const r = styleSchema.safeParse(raw ?? {});
  return r.success ? r.data : styleSchema.parse({});
};

async function merged<T extends z.ZodTypeAny>(
  db: Database,
  id: string,
  column: "security" | "style",
  schema: T,
  patch: Record<string, unknown>,
): Promise<z.infer<T>> {
  const [g] = await db.select().from(s.studioGalleries).where(eq(s.studioGalleries.id, id));
  if (!g) throw new StudioError("Unknown gallery.");
  const r = schema.safeParse({ ...(g[column] as Record<string, unknown>), ...patch });
  if (!r.success) throw new StudioError(r.error.issues[0]?.message ?? "That setting is not valid.");
  await db
    .update(s.studioGalleries)
    .set({ [column]: r.data, updatedAt: new Date() })
    .where(eq(s.studioGalleries.id, id));
  return r.data;
}
export const saveSecurity = (db: Database, id: string, patch: Partial<GallerySecurity>) =>
  merged(db, id, "security", securitySchema, patch);
export const saveStyle = (db: Database, id: string, patch: Partial<GalleryStyle>) =>
  merged(db, id, "style", styleSchema, patch);

/* ---------- events, strikes and locks ---------- */
export const TRIGGER_KINDS = ["screenshot", "save", "print", "source", "devtools", "capture", "devtools-open"] as const;
const DAY = 86_400_000;

export type SecurityOutcome = {
  action: "logged" | "warned" | "locked";
  strikes: number;
  locked: boolean;
  until: Date | null;
};

/** The lock that applies to this viewer (or this address) right now, if any. */
export async function lockedUntil(
  db: Database,
  galleryId: string,
  who: { viewer: string; ipHash?: string | null },
  now = new Date(),
): Promise<Date | null> {
  const [row] = await db
    .select({ until: s.studioSecurityEvents.until })
    .from(s.studioSecurityEvents)
    .where(
      and(
        eq(s.studioSecurityEvents.galleryId, galleryId),
        eq(s.studioSecurityEvents.kind, "lock"),
        gt(s.studioSecurityEvents.until, now),
        or(
          eq(s.studioSecurityEvents.viewer, who.viewer),
          who.ipHash ? eq(s.studioSecurityEvents.ipHash, who.ipHash) : undefined,
        ),
      ),
    )
    .orderBy(desc(s.studioSecurityEvents.until))
    .limit(1);
  return row?.until ?? null;
}

/**
 * Records one trigger from the page guard and applies the gallery's rule: log it, warn, or lock the viewer out once they reach
 * the strike limit (strikes count over the last 24 hours). The owner gets an activity entry on the first trigger and on a lock.
 */
export async function recordSecurityEvent(
  db: Database,
  e: { galleryId: string; viewer: string; kind: string; combo?: string | null; ipHash?: string | null },
  now = new Date(),
): Promise<SecurityOutcome> {
  const kind = (TRIGGER_KINDS as readonly string[]).includes(e.kind) ? e.kind : "screenshot";
  const [g] = await db.select().from(s.studioGalleries).where(eq(s.studioGalleries.id, e.galleryId));
  if (!g) throw new StudioError("Unknown gallery.");
  const sec = readSecurity(g.security);
  const since = new Date(now.getTime() - DAY);
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(s.studioSecurityEvents)
    .where(
      and(
        eq(s.studioSecurityEvents.galleryId, e.galleryId),
        eq(s.studioSecurityEvents.viewer, e.viewer),
        ne(s.studioSecurityEvents.kind, "lock"),
        ne(s.studioSecurityEvents.kind, "idle"),
        gte(s.studioSecurityEvents.at, since),
      ),
    );
  const strikes = n + 1;
  const lock = sec.onTrigger === "lock" && strikes >= sec.strikes;
  const until = lock ? new Date(now.getTime() + sec.lockMinutes * 60_000) : null;
  const action = lock ? "locked" : sec.onTrigger === "log" ? "logged" : "warned";
  await db.insert(s.studioSecurityEvents).values({
    galleryId: e.galleryId,
    viewer: e.viewer,
    kind,
    combo: e.combo?.slice(0, 40) ?? null,
    action,
    ipHash: e.ipHash ?? null,
    at: now,
  });
  if (lock)
    await db.insert(s.studioSecurityEvents).values({
      galleryId: e.galleryId,
      viewer: e.viewer,
      kind: "lock",
      action: "locked",
      ipHash: e.ipHash ?? null,
      until,
      at: now,
    });
  if (sec.notifyOwner && (strikes === 1 || lock))
    await db
      .insert(s.studioNotifications)
      .values({
        kind: "security",
        title: lock ? `Locked a viewer out of "${g.title}"` : `Capture attempt on "${g.title}"`,
        body: lock
          ? `${strikes} triggers (last: ${e.combo ?? kind}). Closed for ${sec.lockMinutes} minutes.`
          : `${e.combo ?? kind}. Action: ${action}.`,
        link: `/studio/gallery/${g.id}#activity`,
      })
      .catch(() => {});
  return { action, strikes, locked: lock, until };
}

/** Closes the session politely after idle time; logged but not counted as a strike. */
export async function recordIdle(db: Database, galleryId: string, viewer: string, ipHash?: string | null) {
  await db
    .insert(s.studioSecurityEvents)
    .values({ galleryId, viewer, kind: "idle", action: "logged", ipHash: ipHash ?? null });
}

export async function securityLog(db: Database, galleryId: string, limit = 60) {
  return db
    .select()
    .from(s.studioSecurityEvents)
    .where(eq(s.studioSecurityEvents.galleryId, galleryId))
    .orderBy(desc(s.studioSecurityEvents.at))
    .limit(limit);
}

/** Lifts every lock on a gallery (the owner decided to let them back in). */
export async function clearLocks(db: Database, galleryId: string, now = new Date()) {
  const rows = await db
    .update(s.studioSecurityEvents)
    .set({ until: now })
    .where(
      and(
        eq(s.studioSecurityEvents.galleryId, galleryId),
        eq(s.studioSecurityEvents.kind, "lock"),
        gt(s.studioSecurityEvents.until, now),
      ),
    )
    .returning({ id: s.studioSecurityEvents.id });
  return rows.length;
}

/** Downloads this viewer made in the last 24 hours (for the daily cap). */
export async function downloadsInLastDay(db: Database, galleryId: string, viewer: string, now = new Date()) {
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(s.studioDownloadEvents)
    .where(
      and(
        eq(s.studioDownloadEvents.galleryId, galleryId),
        eq(s.studioDownloadEvents.viewer, viewer),
        gte(s.studioDownloadEvents.at, new Date(now.getTime() - DAY)),
      ),
    );
  return n;
}

export async function activeLockCount(db: Database, galleryIds: string[], now = new Date()) {
  if (!galleryIds.length) return 0;
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(s.studioSecurityEvents)
    .where(
      and(
        inArray(s.studioSecurityEvents.galleryId, galleryIds),
        eq(s.studioSecurityEvents.kind, "lock"),
        gt(s.studioSecurityEvents.until, now),
      ),
    );
  return n;
}
