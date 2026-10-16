import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getDb, schema } from "@jerryqiu/db";
import { galleryState } from "@jerryqiu/db/gallery-expiry";
import { tokenSecrets } from "@jerryqiu/protect";
import { and, eq, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { accountSession } from "@/lib/account-session";
import { portalSession, viewerId } from "@/lib/portal";

/** Who is looking at which gallery: a passcode session (that gallery only) or a signed-in portal account (its own galleries). */
export type GalleryAccess = {
  gallery: typeof schema.studioGalleries.$inferSelect;
  viewer: string;
  via: "passcode" | "account";
  state: ReturnType<typeof galleryState>;
  clientId: string | null;
};

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
    return { gallery: row.g, viewer: me.viewer, via: "account", state: galleryState(row.g), clientId: me.client.id };
  }
  const session = await portalSession();
  if (!session) return null;
  const [g] = await db
    .select()
    .from(schema.studioGalleries)
    .where(and(eq(schema.studioGalleries.id, session.g), isNull(schema.studioGalleries.deletedAt)));
  if (!g || (g.status !== "published" && g.status !== "archived")) return null;
  return { gallery: g, viewer: viewerId(session), via: "passcode", state: galleryState(g), clientId: null };
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
