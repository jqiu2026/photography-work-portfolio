"use server";

import { getDb, hitRateLimit, schema } from "@jerryqiu/db";
import * as gal from "@jerryqiu/db/galleries";
import * as shop from "@jerryqiu/db/gallery-shop";
import { StudioError } from "@jerryqiu/db/studio";
import { and, eq } from "drizzle-orm";
import { verifyPasscode } from "@jerryqiu/db/studio-crypto";
import { z } from "zod";
import { galleryAccess, unlockAlbum } from "@/lib/client-gallery";
import { requestIpHash, startPortalSession } from "@/lib/portal";

export type GResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };
const no = (error: string) => ({ ok: false as const, error });
const uuid = z.string().uuid();

/** Opens a locked album in this browser for 8 hours when the passcode is right. Rate limited per address and album. */
export async function unlockAlbumAction(input: {
  galleryId?: string;
  albumId: string;
  passcode: string;
}): Promise<GResult> {
  const db = getDb();
  const a = await galleryAccess(input.galleryId);
  if (!db || !a || !uuid.safeParse(input.albumId).success) return no("Open the gallery again to continue.");
  const ip = await requestIpHash();
  if (!(await hitRateLimit(db, `album:${ip}:${input.albumId}`, 8, 900)).allowed)
    return no("Too many tries. Wait a few minutes.");
  const [album] = await db
    .select()
    .from(schema.studioAlbums)
    .where(and(eq(schema.studioAlbums.id, input.albumId), eq(schema.studioAlbums.galleryId, a.gallery.id)));
  if (!album?.passcodeHash) return no("That album is not locked.");
  if (!(await gal.checkAlbumPasscode(album, input.passcode))) return no("That passcode is not right.");
  await unlockAlbum(a.gallery.id, album.id);
  return { ok: true };
}

const cartSchema = z.object({
  galleryId: z.string().uuid().optional(),
  lines: z
    .array(
      z.object({
        productId: z.string().uuid(),
        mediaId: z.string().uuid().nullish(),
        qty: z.number().int().min(1).max(50),
      }),
    )
    .min(1)
    .max(60),
  buyer: z.object({ name: z.string().max(120), email: z.string().max(200) }),
  ship: z
    .object({
      name: z.string().max(120),
      line1: z.string().max(160),
      line2: z.string().max(160).optional(),
      city: z.string().max(80),
      region: z.string().max(40),
      postalCode: z.string().max(20),
      country: z.string().max(2),
    })
    .nullish(),
});

/**
 * Turns the cart into an order and returns where to pay. The price comes from the studio's price list, not from here. The
 * session decides the gallery (a visitor of the public link or the client), so a cart cannot be placed on another gallery.
 */
export async function checkoutAction(input: unknown): Promise<GResult<{ url: string }>> {
  const db = getDb();
  const p = cartSchema.safeParse(input);
  if (!p.success) return no("Check your cart and details.");
  const a = await galleryAccess(p.data.galleryId);
  if (!db || !a) return no("Open the gallery again to continue.");
  if (a.state !== "live" && a.state !== "expiring") return no("This gallery is not open for orders.");
  const ip = await requestIpHash();
  if (!(await hitRateLimit(db, `checkout:${ip}`, 12, 900)).allowed) return no("Too many orders. Wait a few minutes.");
  try {
    const r = await shop.placeOrder(db, {
      galleryId: a.gallery.id,
      lines: p.data.lines,
      buyer: p.data.buyer,
      ship: p.data.ship ?? null,
    });
    return { ok: true, url: `/client/pay/${r.payToken}` };
  } catch (e) {
    return no(e instanceof StudioError ? e.message : "Could not start your order.");
  }
}

const PASS_LIMIT = () => Number(process.env.PORTAL_PASSCODE_LIMIT) || 8;

/**
 * The one way in for a client: the passcode, on the gallery's own page. It opens THIS gallery only (never a search across
 * galleries), starts the client's session (proofing, selection, their downloads), and is rate limited per address.
 */
export async function enterGalleryAction(input: { slug: string; passcode: string }): Promise<GResult> {
  const db = getDb();
  if (!db || !/^[a-z0-9-]{2,48}$/.test(input.slug)) return no("This gallery is not available.");
  const code = input.passcode.trim();
  if (!code) return no("Enter your passcode.");
  const ip = await requestIpHash();
  if (!(await hitRateLimit(db, `portal:${ip}`, PASS_LIMIT(), 600)).allowed)
    return no("Too many tries. Wait a few minutes and try again.");
  const [g] = await db
    .select()
    .from(schema.studioGalleries)
    .where(and(eq(schema.studioGalleries.slug, input.slug)));
  if (
    !g ||
    g.deletedAt ||
    (g.status !== "published" && g.status !== "archived") ||
    !(await verifyPasscode(code, g.passcodeHash))
  )
    return no("That passcode doesn't match this gallery.");
  await startPortalSession(g.id, "client");
  return { ok: true };
}
