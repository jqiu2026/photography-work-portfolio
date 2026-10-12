import { type Database, schema } from "@jerryqiu/db";
import { eq, sql } from "drizzle-orm";

export type Usage = { kind: string; title: string; href: string };

/** Everywhere a media item is referenced, so "delete" can refuse while it is in use. */
export async function mediaUsage(db: Database, id: string): Promise<Usage[]> {
  const out: Usage[] = [];
  const marker = `%${id}%`;
  for (const p of await db
    .select({ id: schema.posts.id, title: schema.posts.title })
    .from(schema.posts)
    .where(
      sql`${schema.posts.deletedAt} is null and (${schema.posts.coverMediaId} = ${id} or ${schema.posts.body} ilike ${marker})`,
    ))
    out.push({ kind: "Post", title: p.title, href: `/admin/posts/${p.id}` });
  for (const p of await db
    .select({ id: schema.projects.id, title: schema.projects.title })
    .from(schema.projects)
    .where(
      sql`${schema.projects.deletedAt} is null and (${schema.projects.coverMediaId} = ${id} or ${schema.projects.blocks}::text ilike ${marker})`,
    ))
    out.push({ kind: "Project", title: p.title, href: `/admin/projects/${p.id}` });
  for (const g of await db
    .select({ id: schema.galleries.id, title: schema.galleries.title })
    .from(schema.galleries)
    .where(sql`${schema.galleries.deletedAt} is null and ${schema.galleries.coverMediaId} = ${id}`))
    out.push({ kind: "Gallery cover", title: g.title, href: `/admin/galleries/${g.id}` });
  for (const g of await db
    .select({ id: schema.galleries.id, title: schema.galleries.title })
    .from(schema.galleryItems)
    .innerJoin(schema.galleries, eq(schema.galleries.id, schema.galleryItems.galleryId))
    .where(sql`${schema.galleryItems.mediaId} = ${id} and ${schema.galleries.deletedAt} is null`))
    out.push({ kind: "Gallery", title: g.title, href: `/admin/galleries/${g.id}` });
  for (const m of await db
    .select({ id: schema.musicItems.id, title: schema.musicItems.title })
    .from(schema.musicItems)
    .where(
      sql`${schema.musicItems.deletedAt} is null and (${schema.musicItems.audioMediaId} = ${id} or ${schema.musicItems.coverMediaId} = ${id})`,
    ))
    out.push({ kind: "Music", title: m.title, href: `/admin/music/${m.id}` });
  for (const f of await db
    .select({ id: schema.flightEntries.id, title: schema.flightEntries.title })
    .from(schema.flightEntries)
    .where(sql`${schema.flightEntries.deletedAt} is null and ${schema.flightEntries.photoMediaId} = ${id}`))
    out.push({ kind: "Flight log", title: f.title, href: `/admin/flying/${f.id}` });
  return out;
}
