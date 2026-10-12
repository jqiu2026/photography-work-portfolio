"use server";

import { schema } from "@jerryqiu/db";
import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { z } from "zod";
import type { ActionState } from "@/components/admin/form-kit";
import { blank, fdBool, fdStr, parseForm, slug as slugRule, slugify } from "@/lib/action-utils";
import { touch } from "@/lib/revalidate";
import { guarded } from "@/auth";

const gallerySchema = z.object({
  id: z.string().uuid().or(z.literal("")),
  title: z.string().trim().min(1, "Required").max(120),
  slug: slugRule,
  description: z.string().trim().max(1000),
  category: z.string().trim().max(60),
  protection: z.enum(["none", "light", "strict"]),
  coverMediaId: z.string().uuid().or(z.literal("")),
  sort: z.coerce.number().int().min(0).max(9999),
});

const refresh = () => touch(["galleries", "media"], ["/", "/portfolio"]);

export async function saveGallery(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const r = parseForm(gallerySchema, {
    id: fdStr(fd, "id"),
    title: fdStr(fd, "title"),
    slug: fdStr(fd, "slug") || slugify(fdStr(fd, "title")),
    description: fdStr(fd, "description"),
    category: fdStr(fd, "category"),
    protection: fdStr(fd, "protection") || "light",
    coverMediaId: fdStr(fd, "coverMediaId"),
    sort: fdStr(fd, "sort") || "0",
  });
  if (!r.ok) return r.state;
  const d = r.data;
  return guarded("content.publish", async ({ db, user, audit }) => {
    const dupe = await db
      .select({ id: schema.galleries.id })
      .from(schema.galleries)
      .where(
        and(
          eq(schema.galleries.site, "photos"),
          eq(schema.galleries.slug, d.slug),
          d.id ? ne(schema.galleries.id, d.id) : undefined,
        ),
      )
      .limit(1);
    if (dupe.length)
      return {
        ok: false as const,
        error: "Check the highlighted fields.",
        fieldErrors: { slug: "Another gallery already uses this URL" },
      };
    const values = {
      slug: d.slug,
      title: d.title,
      description: blank(d.description),
      category: blank(d.category),
      protection: d.protection,
      coverMediaId: d.coverMediaId || null,
      visible: fdBool(fd, "visible"),
      sort: d.sort,
      updatedAt: new Date(),
      updatedBy: user.email,
    };
    let id = d.id;
    if (id) await db.update(schema.galleries).set(values).where(eq(schema.galleries.id, id));
    else {
      const [row] = await db
        .insert(schema.galleries)
        .values({ site: "photos", ...values })
        .returning({ id: schema.galleries.id });
      id = row.id;
    }
    // Publishing images of minors without a release is allowed but called out.
    const flagged = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.galleryItems)
      .innerJoin(schema.media, eq(schema.media.id, schema.galleryItems.mediaId))
      .where(
        and(
          eq(schema.galleryItems.galleryId, id),
          eq(schema.media.minors, true),
          eq(schema.media.releaseOnFile, false),
        ),
      );
    const needs = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.galleryItems)
      .innerJoin(schema.media, eq(schema.media.id, schema.galleryItems.mediaId))
      .where(and(eq(schema.galleryItems.galleryId, id), eq(schema.media.reviewStatus, "needs_review")));
    await audit({
      action: d.id ? "gallery.update" : "gallery.create",
      entity: "gallery",
      entityId: id,
      site: "photos",
      summary: `${d.id ? "Updated" : "Created"} gallery “${d.title}”`,
    });
    refresh();
    const warn = flagged[0].n
      ? ` Note: ${flagged[0].n} image${flagged[0].n === 1 ? "" : "s"} include minors with no release on file.`
      : needs[0].n
        ? ` Note: ${needs[0].n} image${needs[0].n === 1 ? " needs" : "s need"} review (Media, Needs review).`
        : "";
    return { ok: true as const, message: `Saved.${warn}`, redirectTo: d.id ? undefined : `/admin/galleries/${id}`, id };
  });
}

export async function deleteGallery(id: string): Promise<ActionState> {
  return guarded("content.write", async ({ db, user, audit }) => {
    const [g] = await db
      .update(schema.galleries)
      .set({ deletedAt: new Date(), updatedBy: user.email })
      .where(eq(schema.galleries.id, id))
      .returning({ title: schema.galleries.title });
    await audit({
      action: "gallery.delete",
      entity: "gallery",
      entityId: id,
      site: "photos",
      summary: `Moved gallery “${g?.title}” to the trash`,
    });
    refresh();
    return { ok: true as const, message: "Moved to trash", redirectTo: "/admin/galleries" };
  });
}

/** Attach uploaded or picked media to the end of a gallery (ignores ones already in it). */
export async function addToGallery(galleryId: string, mediaIds: string[]): Promise<ActionState> {
  const ids = z.array(z.string().uuid()).max(200).safeParse(mediaIds);
  if (!ids.success) return { ok: false, error: "Bad request." };
  return guarded("content.write", async ({ db, audit }) => {
    const existing = await db
      .select({ mediaId: schema.galleryItems.mediaId })
      .from(schema.galleryItems)
      .where(eq(schema.galleryItems.galleryId, galleryId));
    const have = new Set(existing.map((e) => e.mediaId));
    const [last] = await db
      .select({ sort: schema.galleryItems.sort })
      .from(schema.galleryItems)
      .where(eq(schema.galleryItems.galleryId, galleryId))
      .orderBy(desc(schema.galleryItems.sort))
      .limit(1);
    let n = (last?.sort ?? -1) + 1;
    const fresh = ids.data.filter((i) => !have.has(i));
    for (const mediaId of fresh) await db.insert(schema.galleryItems).values({ galleryId, mediaId, sort: n++ });
    if (fresh.length)
      await audit({
        action: "gallery.add",
        entity: "gallery",
        entityId: galleryId,
        site: "photos",
        summary: `Added ${fresh.length} image${fresh.length === 1 ? "" : "s"}`,
      });
    refresh();
    return { ok: true as const, message: fresh.length ? `Added ${fresh.length}` : "Already in the gallery" };
  });
}

export async function reorderGallery(galleryId: string, orderedItemIds: string[]): Promise<ActionState> {
  const ids = z.array(z.string().uuid()).max(500).safeParse(orderedItemIds);
  if (!ids.success) return { ok: false, error: "Bad request." };
  return guarded("content.write", async ({ db, audit }) => {
    const rows = await db
      .select({ id: schema.galleryItems.id })
      .from(schema.galleryItems)
      .where(and(eq(schema.galleryItems.galleryId, galleryId), inArray(schema.galleryItems.id, ids.data)));
    const valid = new Set(rows.map((r) => r.id));
    let n = 0;
    for (const id of ids.data)
      if (valid.has(id)) await db.update(schema.galleryItems).set({ sort: n++ }).where(eq(schema.galleryItems.id, id));
    await audit({
      action: "gallery.reorder",
      entity: "gallery",
      entityId: galleryId,
      site: "photos",
      summary: "Reordered images",
    });
    refresh();
    return { ok: true as const, message: "Order saved" };
  });
}

const itemSchema = z.object({
  id: z.string().uuid(),
  caption: z.string().trim().max(300),
  alt: z.string().trim().max(300),
  hidden: z.boolean(),
});

export async function updateGalleryItem(input: {
  id: string;
  caption: string;
  alt: string;
  hidden: boolean;
}): Promise<ActionState> {
  const p = itemSchema.safeParse(input);
  if (!p.success) return { ok: false, error: "Bad request." };
  return guarded("content.write", async ({ db }) => {
    await db
      .update(schema.galleryItems)
      .set({ caption: blank(p.data.caption), alt: blank(p.data.alt), hidden: p.data.hidden })
      .where(eq(schema.galleryItems.id, p.data.id));
    refresh();
    return { ok: true as const, message: "" };
  });
}

export async function removeGalleryItem(itemId: string): Promise<ActionState> {
  if (!z.string().uuid().safeParse(itemId).success) return { ok: false, error: "Bad request." };
  return guarded("content.write", async ({ db, audit }) => {
    await db.delete(schema.galleryItems).where(eq(schema.galleryItems.id, itemId));
    await audit({
      action: "gallery.remove_item",
      entity: "gallery_item",
      entityId: itemId,
      site: "photos",
      summary: "Removed an image from a gallery",
    });
    refresh();
    return { ok: true as const, message: "Removed from the gallery (the image stays in the media library)" };
  });
}

export async function setGalleryCover(galleryId: string, mediaId: string): Promise<ActionState> {
  if (!z.string().uuid().safeParse(galleryId).success || !z.string().uuid().safeParse(mediaId).success)
    return { ok: false, error: "Bad request." };
  return guarded("content.write", async ({ db }) => {
    await db
      .update(schema.galleries)
      .set({ coverMediaId: mediaId, updatedAt: new Date() })
      .where(eq(schema.galleries.id, galleryId));
    refresh();
    return { ok: true as const, message: "Cover set" };
  });
}
