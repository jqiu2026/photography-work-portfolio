"use server";

import { getDb, hitRateLimit, schema } from "@jerryqiu/db";
import { notify } from "@jerryqiu/db/automation";
import * as gal from "@jerryqiu/db/galleries";
import { StudioError } from "@jerryqiu/db/studio";
import { sendTemplate } from "@jerryqiu/email";
import { getSite } from "@jerryqiu/sites";
import { eq } from "drizzle-orm";
import { galleryAccess, unlockDownloads } from "@/lib/client-gallery";
import { requestIpHash } from "@/lib/portal";

export type GalleryResult = { ok: true; message?: string; url?: string } | { ok: false; error: string };
const no = (error: string): GalleryResult => ({ ok: false, error });

async function ctx(galleryId: string | undefined, bucket: string, max: number) {
  const db = getDb();
  const a = await galleryAccess(galleryId);
  if (!db || !a) return null;
  if (a.state === "expired" || a.state === "archived") return null;
  const ip = await requestIpHash();
  if (!(await hitRateLimit(db, `${bucket}:${ip}`, max, 600)).allowed) return null;
  return { db, a };
}

export async function rateAction(input: {
  galleryId?: string;
  mediaId: string;
  rating: number | null;
}): Promise<GalleryResult> {
  const c = await ctx(input.galleryId, "proof", 300);
  if (!c) return no("Open your gallery again to continue.");
  try {
    await gal.rate(c.db, c.a.gallery.id, input.mediaId, input.rating);
    return { ok: true };
  } catch (e) {
    return no(e instanceof StudioError ? e.message : "Could not save your rating.");
  }
}

export async function decideAction(input: {
  galleryId?: string;
  mediaId: string;
  decision: "approved" | "rejected" | null;
}): Promise<GalleryResult> {
  const c = await ctx(input.galleryId, "proof", 300);
  if (!c) return no("Open your gallery again to continue.");
  try {
    await gal.decide(c.db, c.a.gallery.id, input.mediaId, input.decision);
    return { ok: true };
  } catch (e) {
    return no(e instanceof StudioError ? e.message : "Could not save your choice.");
  }
}

export async function commentAction(input: {
  galleryId?: string;
  mediaId: string;
  body: string;
}): Promise<GalleryResult> {
  const c = await ctx(input.galleryId, "comment", 60);
  if (!c) return no("Open your gallery again to continue.");
  try {
    await gal.comment(c.db, c.a.gallery.id, input.mediaId, input.body, "client");
    await notify(c.db, {
      kind: "gallery",
      title: `New comment in ${c.a.gallery.title}`,
      body: input.body.slice(0, 200),
      link: `/studio/gallery/${c.a.gallery.id}`,
    });
    return { ok: true, message: "Comment added" };
  } catch (e) {
    return no(e instanceof StudioError ? e.message : "Could not add the comment.");
  }
}

/** Locks the picks and emails the studio the list. */
export async function sendSelectionAction(galleryId?: string): Promise<GalleryResult> {
  const c = await ctx(galleryId, "selection", 10);
  if (!c) return no("Open your gallery again to continue.");
  try {
    const r = await gal.sendSelection(c.db, c.a.gallery.id);
    await notify(c.db, {
      kind: "selection",
      title: `Selection sent: ${r.gallery.title}`,
      body: `${r.count} photographs`,
      link: `/studio/gallery/${r.gallery.id}`,
    });
    const favs = await c.db
      .select({ m: schema.studioFavorites.mediaId })
      .from(schema.studioFavorites)
      .where(eq(schema.studioFavorites.galleryId, c.a.gallery.id));
    const media = await c.db.select({ id: schema.media.id, filename: schema.media.filename }).from(schema.media);
    const names = new Map(media.map((m) => [m.id, m.filename]));
    const owner = process.env.CONTACT_TO_EMAIL?.trim();
    if (owner || process.env.NODE_ENV !== "production")
      await sendTemplate(
        c.db,
        owner || "owner@photo.invalid",
        "client-message",
        {
          title: `Selection sent: ${r.gallery.title}`,
          summary: `${r.count} photographs chosen`,
          detail: favs.map((f) => names.get(f.m) ?? f.m).join("\n"),
          link: `${getSite("photos").url}/studio/gallery/${r.gallery.id}`,
          linkLabel: "Open the gallery",
        },
        { related: { type: "gallery", id: r.gallery.id } },
      );
    return { ok: true, message: `Sent. You chose ${r.count} photograph${r.count === 1 ? "" : "s"}.` };
  } catch (e) {
    return no(e instanceof StudioError ? e.message : "Could not send your selection.");
  }
}

export async function unlockDownloadsAction(input: { galleryId?: string; pin: string }): Promise<GalleryResult> {
  const db = getDb();
  const a = await galleryAccess(input.galleryId);
  if (!db || !a) return no("Open your gallery again to continue.");
  const ip = await requestIpHash();
  if (!(await hitRateLimit(db, `pin:${ip}:${a.gallery.id}`, 8, 900)).allowed)
    return no("Too many tries. Wait a few minutes.");
  if (!(await gal.checkDownloadPin(a.gallery, input.pin.trim()))) return no("That PIN is not right.");
  await unlockDownloads(a.gallery.id);
  return { ok: true, message: "Downloads unlocked for an hour." };
}

/** An expired or archived gallery: make (or reuse) the extension invoice and return its pay link. */
export async function reactivateAction(galleryId?: string): Promise<GalleryResult> {
  const db = getDb();
  const a = await galleryAccess(galleryId);
  if (!db || !a) return no("Open your gallery again to continue.");
  const ip = await requestIpHash();
  if (!(await hitRateLimit(db, `reactivate:${ip}`, 10, 900)).allowed) return no("Too many tries. Wait a few minutes.");
  try {
    const r = await gal.createExtensionInvoice(db, a.gallery.id);
    return { ok: true, url: `/client/pay/${r.token}` };
  } catch (e) {
    return no(
      e instanceof StudioError
        ? "Extending is not set up yet. Please message me and I will sort it out."
        : "Could not start the extension.",
    );
  }
}
