import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { type Database, getDb, schema } from "@jerryqiu/db";
import { galleryState } from "@jerryqiu/db/gallery-expiry";
import { type GallerySecurity, lockedUntil, readSecurity } from "@jerryqiu/db/gallery-security";
import { tokenSecrets } from "@jerryqiu/protect";
import { and, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { accountSession } from "@/lib/account-session";
import { portalSession, requestIpHash, viewerId } from "@/lib/portal";

/** Who is looking at which gallery: a passcode session (that gallery only) or a signed-in portal account (its own galleries). */
export type GalleryAccess = {
  gallery: typeof schema.studioGalleries.$inferSelect;
  viewer: string;
  via: "passcode" | "account";
  /** client: the person the gallery was delivered to (proofing, selections, their downloads). visitor: opened the public link (view, shop). */
  role: "client" | "visitor";
  state: ReturnType<typeof galleryState>;
  clientId: string | null;
  security: GallerySecurity;
};

/** When this viewer (or their network address) was locked out of the gallery for capture attempts, if still in force. */
async function lockOf(galleryId: string, viewer: string) {
  const db = getDb();
  return db ? lockedUntil(db, galleryId, { viewer, ipHash: await requestIpHash() }) : null;
}

/** For the /client page: is the current passcode session locked out? */
export async function currentLock(): Promise<Date | null> {
  const session = await portalSession();
  return session ? lockOf(session.g, viewerId(session)) : null;
}

export async function galleryAccess(galleryId?: string): Promise<GalleryAccess | null> {
  const db = getDb();
  if (!db) return null;
  if (galleryId) {
    if (!/^[0-9a-f-]{36}$/i.test(galleryId)) return null;
    const me = await accountSession();
    if (!me) return null;
    const [row] = await db
      .select({ g: schema.studioGalleries, job: schema.studioJobs })
      .from(schema.studioGalleries)
      .innerJoin(schema.studioJobs, eq(schema.studioJobs.id, schema.studioGalleries.jobId))
      .where(and(eq(schema.studioGalleries.id, galleryId), isNull(schema.studioGalleries.deletedAt)));
    if (!row || row.job.clientId !== me.client.id || (row.g.status !== "published" && row.g.status !== "archived"))
      return null;
    if (await lockOf(row.g.id, me.viewer)) return null;
    return {
      gallery: row.g,
      viewer: me.viewer,
      via: "account",
      role: "client",
      state: galleryState(row.g),
      clientId: me.client.id,
      security: readSecurity(row.g.security),
    };
  }
  const session = await portalSession();
  if (!session) return null;
  const [g] = await db
    .select()
    .from(schema.studioGalleries)
    .where(and(eq(schema.studioGalleries.id, session.g), isNull(schema.studioGalleries.deletedAt)));
  if (!g || (g.status !== "published" && g.status !== "archived")) return null;
  if (await lockOf(g.id, viewerId(session))) return null;
  return {
    gallery: g,
    viewer: viewerId(session),
    via: "passcode",
    role: session.r === "v" ? "visitor" : "client",
    state: galleryState(g),
    clientId: null,
    security: readSecurity(g.security),
  };
}

/** Signed one-hour cookie that remembers the download PIN was entered for this gallery. */
const COOKIE = "hl_dl";
const mac = (secret: string, body: string) => createHmac("sha256", secret).update(body).digest("base64url");
export async function unlockDownloads(galleryId: string) {
  const secret = tokenSecrets()[0];
  if (!secret) throw new Error("No signing secret configured");
  const e = Math.floor(Date.now() / 1000) + 3600;
  const body = Buffer.from(JSON.stringify({ g: galleryId, e })).toString("base64url");
  (await cookies()).set(COOKIE, `${body}.${mac(secret, body)}`, {
    path: "/",
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 3600,
  });
}
export async function downloadsUnlocked(galleryId: string): Promise<boolean> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return false;
  const [body, sig] = raw.split(".");
  if (!body || !sig) return false;
  const ok = tokenSecrets().some((s) => {
    const want = Buffer.from(mac(s, body));
    const got = Buffer.from(sig);
    return want.length === got.length && timingSafeEqual(want, got);
  });
  if (!ok) return false;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { g: string; e: number };
    return p.g === galleryId && p.e * 1000 > Date.now();
  } catch {
    return false;
  }
}

/** Signed cookie holding which locked albums this browser has opened, per gallery (8 hours). */
const ALBUMS = "hl_alb";
export async function unlockAlbum(galleryId: string, albumId: string) {
  const secret = tokenSecrets()[0];
  if (!secret) throw new Error("No signing secret configured");
  const have = await unlockedAlbums(galleryId);
  const e = Math.floor(Date.now() / 1000) + 8 * 3600;
  const body = Buffer.from(
    JSON.stringify({ g: galleryId, a: [...new Set([...have, albumId])].slice(-40), e }),
  ).toString("base64url");
  (await cookies()).set(ALBUMS, `${body}.${mac(secret, body)}`, {
    path: "/",
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 8 * 3600,
  });
}
export async function unlockedAlbums(galleryId: string): Promise<string[]> {
  const raw = (await cookies()).get(ALBUMS)?.value;
  if (!raw || raw.length > 2000) return [];
  const [body, sig] = raw.split(".");
  if (!body || !sig) return [];
  const ok = tokenSecrets().some((s) => {
    const want = Buffer.from(mac(s, body));
    const got = Buffer.from(sig);
    return want.length === got.length && timingSafeEqual(want, got);
  });
  if (!ok) return [];
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { g: string; a: string[]; e: number };
    return p.g === galleryId && p.e * 1000 > Date.now() && Array.isArray(p.a)
      ? p.a.filter((x) => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

/** Photographs in locked albums that this browser has not opened: kept out of the page, the downloads and the image tokens. */
export async function lockedMediaIds(db: Database, galleryId: string): Promise<Set<string>> {
  const locked = await db
    .select({ id: schema.studioAlbums.id })
    .from(schema.studioAlbums)
    .where(and(eq(schema.studioAlbums.galleryId, galleryId), isNotNull(schema.studioAlbums.passcodeHash)));
  if (!locked.length) return new Set();
  const open = new Set(await unlockedAlbums(galleryId));
  const shut = locked.map((l) => l.id).filter((id) => !open.has(id));
  if (!shut.length) return new Set();
  const rows = await db
    .select({ m: schema.studioGalleryItems.mediaId })
    .from(schema.studioGalleryItems)
    .where(and(eq(schema.studioGalleryItems.galleryId, galleryId), inArray(schema.studioGalleryItems.albumId, shut)));
  return new Set(rows.map((r) => r.m));
}
