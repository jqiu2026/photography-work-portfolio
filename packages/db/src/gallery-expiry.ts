import { eq } from "drizzle-orm";
import type { Database } from "./client";
import * as s from "./schema";

export type GalleryState = "draft" | "live" | "expiring" | "expired" | "archived";

/** What a client sees: live, expiring within `soonDays`, expired (offer an extension), or archived by the owner. */
export function galleryState(
  g: Pick<s.StudioGallery, "status" | "expiresAt">,
  now = new Date(),
  soonDays = 14,
): GalleryState {
  if (g.status === "draft") return "draft";
  if (g.status === "archived") return "archived";
  if (g.expiresAt && g.expiresAt <= now) return "expired";
  if (g.expiresAt && g.expiresAt.getTime() - now.getTime() <= soonDays * 86_400_000) return "expiring";
  return "live";
}

const addMonthsTo = (d: Date, months: number) => {
  const out = new Date(d.getTime());
  out.setUTCMonth(out.getUTCMonth() + months);
  return out;
};

/**
 * Extends access: from the current end date when it is still in the future, otherwise from today (so an expired gallery gets
 * a full extra period). An archived gallery is published again. Idempotency is the caller's job (payments dedupe by provider ref).
 */
export async function extendGallery(db: Database, galleryId: string, months: number, now = new Date()) {
  const [g] = await db.select().from(s.studioGalleries).where(eq(s.studioGalleries.id, galleryId));
  if (!g) return null;
  const from = g.expiresAt && g.expiresAt > now ? g.expiresAt : now;
  const [row] = await db
    .update(s.studioGalleries)
    .set({
      expiresAt: addMonthsTo(from, months),
      status: g.status === "archived" ? "published" : g.status,
      reactivatedAt: g.expiresAt && g.expiresAt <= now ? now : g.reactivatedAt,
      expiryReminderAt: null,
      updatedAt: now,
    })
    .where(eq(s.studioGalleries.id, galleryId))
    .returning();
  return row;
}
