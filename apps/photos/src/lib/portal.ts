import { lockedUntil } from "@jerryqiu/db/gallery-security";
import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { can } from "@jerryqiu/auth";
import { currentUser } from "@/auth";
import { clientIpHash, tokenSecrets } from "@jerryqiu/protect";
import { getDb, schema } from "@jerryqiu/db";
import { and, eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { accountSession } from "@/lib/account-session";

/**
 * Client portal session: a signed, httpOnly, host-only cookie holding the gallery the visitor opened with its passcode.
 * Separate from the staff session (Auth.js). Host-only, SameSite=Strict, 8 hours; sent on `/` so the image token endpoint can recognise the session. The `viewer` id binds image
 * tokens to this session so a leaked token is useless elsewhere.
 */
const COOKIE = "hl_client";
const TTL_SEC = 8 * 60 * 60;

export type PortalSession = { g: string; v: string; e: number };

const b64 = (s: string) => Buffer.from(s).toString("base64url");
const mac = (secret: string, body: string) => createHmac("sha256", secret).update(body).digest("base64url");

export function signSession(s: PortalSession, secret = tokenSecrets()[0]): string {
  if (!secret) throw new Error("No signing secret configured");
  const body = b64(JSON.stringify(s));
  return `${body}.${mac(secret, body)}`;
}

export function readSessionValue(
  value: string | undefined,
  secrets = tokenSecrets(),
  now = Date.now(),
): PortalSession | null {
  if (!value || value.length > 500) return null;
  const [body, sig, extra] = value.split(".");
  if (!body || !sig || extra !== undefined) return null;
  const got = Buffer.from(sig);
  if (
    !secrets.some((s) => {
      const want = Buffer.from(mac(s, body));
      return want.length === got.length && timingSafeEqual(want, got);
    })
  )
    return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as PortalSession;
    if (typeof p.g !== "string" || typeof p.v !== "string" || typeof p.e !== "number" || p.e * 1000 < now) return null;
    return p;
  } catch {
    return null;
  }
}

export async function startPortalSession(galleryId: string): Promise<void> {
  const e = Math.floor(Date.now() / 1000) + TTL_SEC;
  (await cookies()).set(COOKIE, signSession({ g: galleryId, v: randomBytes(8).toString("hex"), e }), {
    path: "/",
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: TTL_SEC,
  });
}

export async function portalSession(): Promise<PortalSession | null> {
  return readSessionValue((await cookies()).get(COOKIE)?.value);
}

export async function endPortalSession(): Promise<void> {
  (await cookies()).delete({ name: COOKIE, path: "/" });
}

export async function requestIpHash(): Promise<string> {
  return clientIpHash(await headers());
}

/** The viewer id baked into image tokens and the invisible watermark: gallery plus session, so a leak traces to both. */
export const viewerId = (s: PortalSession) => `${s.g}.${s.v}`;

/**
 * For the image token endpoint: the viewer id when this request may see this client photograph, either through a gallery
 * passcode session (that one gallery) or a portal account session (any published gallery of that client's jobs).
 */
export async function clientGalleryViewer(mediaId: string): Promise<string | null> {
  const db = getDb();
  if (!db) return null;
  const session = await portalSession();
  if (session) {
    const [row] = await db
      .select({ n: schema.studioGalleryItems.mediaId })
      .from(schema.studioGalleryItems)
      .innerJoin(schema.studioGalleries, eq(schema.studioGalleries.id, schema.studioGalleryItems.galleryId))
      .where(
        and(
          eq(schema.studioGalleryItems.galleryId, session.g),
          eq(schema.studioGalleryItems.mediaId, mediaId),
          eq(schema.studioGalleries.status, "published"),
        ),
      )
      .limit(1);
    if (row) {
      // a viewer locked out for capture attempts gets no more photographs
      const locked = await lockedUntil(db, session.g, { viewer: viewerId(session), ipHash: await requestIpHash() });
      return locked ? null : viewerId(session);
    }
  }
  const me = await accountSession();
  if (!me) return staffViewer(mediaId);
  const [row] = await db
    .select({ n: schema.studioGalleryItems.mediaId })
    .from(schema.studioGalleryItems)
    .innerJoin(schema.studioGalleries, eq(schema.studioGalleries.id, schema.studioGalleryItems.galleryId))
    .innerJoin(schema.studioJobs, eq(schema.studioJobs.id, schema.studioGalleries.jobId))
    .where(
      and(
        eq(schema.studioGalleryItems.mediaId, mediaId),
        eq(schema.studioGalleries.status, "published"),
        eq(schema.studioJobs.clientId, me.client.id),
      ),
    )
    .limit(1);
  return row ? me.viewer : staffViewer(mediaId);
}

/**
 * The studio owner looking at client photographs in the studio: the same protected, viewer-bound delivery (with the
 * invisible watermark), for photographs that are in some client gallery.
 */
async function staffViewer(mediaId: string): Promise<string | null> {
  const db = getDb();
  if (!db) return null;
  let user: Awaited<ReturnType<typeof currentUser>> | null = null;
  try {
    user = await currentUser();
  } catch {
    return null;
  }
  if (!user || !can(user.role, "studio.access")) return null;
  const [row] = await db
    .select({ n: schema.studioGalleryItems.mediaId })
    .from(schema.studioGalleryItems)
    .where(eq(schema.studioGalleryItems.mediaId, mediaId))
    .limit(1);
  return row
    ? `staff.${createHash("sha256")
        .update(user.email ?? "owner")
        .digest("hex")
        .slice(0, 12)}`
    : null;
}
