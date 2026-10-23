import { and, asc, desc, eq, inArray, isNull, lte, or, sql } from "drizzle-orm";
import type { Database } from "./client";
import * as s from "./schema";
import { type PhotoSpecs, specsFromExif } from "./specs";

/**
 * The typed content layer the public sites read. Everything returned is plain JSON (dates are ISO strings), so apps can
 * cache it with `unstable_cache`. Only published, not-deleted, visible content is ever returned: drafts and trash can
 * never leak through here, whatever the caller does.
 */
type Site = "hub" | "photos" | "music" | "flying";

export type PublicAsset = {
  id: string;
  width: number;
  height: number;
  color?: string;
  blur?: string;
  alt?: string;
  caption?: string;
  specs?: PhotoSpecs;
  /** Responsive sources served by `/api/img/[id]`; `v` busts caches when an image is replaced in place. */
  files: { width: number; src: string }[];
  protectedLevel?: "off" | "light" | "strict";
};

type MediaRow = typeof s.media.$inferSelect;

export function mediaSrc(id: string, width: number, version: string | number): string {
  return `/api/img/${id}?w=${width}&v=${version}`;
}

export function toAsset(m: MediaRow, over?: { alt?: string | null; caption?: string | null }): PublicAsset {
  const version = Math.floor(m.updatedAt.getTime() / 1000);
  const widths = [...new Set((m.derivatives ?? []).map((d) => d.width))].sort((a, b) => a - b);
  return {
    id: m.id,
    width: m.width ?? widths.at(-1) ?? 1600,
    height: m.height ?? Math.round((widths.at(-1) ?? 1600) * 0.66),
    color: m.color ?? undefined,
    blur: m.blur ?? undefined,
    alt: over?.alt ?? m.alt ?? undefined,
    caption: over?.caption ?? m.caption ?? undefined,
    specs: specsFromExif(m.exif),
    files: widths.map((w) => ({ width: w, src: mediaSrc(m.id, w, version) })),
  };
}

async function assetsById(db: Database, ids: (string | null | undefined)[]): Promise<Map<string, MediaRow>> {
  const wanted = [...new Set(ids.filter((x): x is string => Boolean(x)))];
  if (!wanted.length) return new Map();
  const rows = await db
    .select()
    .from(s.media)
    .where(and(inArray(s.media.id, wanted), isNull(s.media.deletedAt)));
  return new Map(rows.map((r) => [r.id, r]));
}

const asset = (m: Map<string, MediaRow>, id: string | null | undefined) => {
  const row = id ? m.get(id) : undefined;
  return row ? toAsset(row) : null;
};

/* ---------- settings ---------- */

export async function getSettings(db: Database, site: Site | "all"): Promise<Record<string, unknown>> {
  const rows = await db.select().from(s.settings).where(eq(s.settings.site, site));
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

/* ---------- posts ---------- */

const liveNow = (publishAt: typeof s.posts.publishAt, status: typeof s.posts.status) =>
  or(
    and(eq(status, "published"), or(isNull(publishAt), lte(publishAt, sql`now()`))),
    and(eq(status, "scheduled"), lte(publishAt, sql`now()`)),
  );

export type PostView = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  summary: string | null;
  body: string;
  tags: string[];
  /** ISO date shown to readers: the publish time, or when it was created. */
  date: string;
  featured: boolean;
  readingMinutes: number;
  seo: { title?: string; description?: string } | null;
  cover: PublicAsset | null;
};

export async function listPosts(db: Database, site: Site = "hub"): Promise<PostView[]> {
  const rows = await db
    .select()
    .from(s.posts)
    .where(and(eq(s.posts.site, site), isNull(s.posts.deletedAt), liveNow(s.posts.publishAt, s.posts.status)));
  const media = await assetsById(
    db,
    rows.map((r) => r.coverMediaId),
  );
  return rows
    .map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      subtitle: r.subtitle,
      summary: r.summary,
      body: r.body,
      tags: r.tags,
      date: (r.publishAt ?? r.createdAt).toISOString(),
      featured: r.featured,
      readingMinutes: r.readingMinutes,
      seo: r.seo ? { title: r.seo.title, description: r.seo.description } : null,
      cover: asset(media, r.coverMediaId),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/* ---------- projects ---------- */

export type ProjectBlockView =
  | { type: "text"; markdown: string }
  | { type: "image"; asset: PublicAsset; caption?: string }
  | { type: "gallery"; assets: PublicAsset[] }
  | { type: "quote"; text: string; cite?: string }
  | { type: "video"; provider: "youtube" | "vimeo"; id: string; title: string }
  | { type: "columns"; left: string; right: string };

export type ProjectView = {
  id: string;
  slug: string;
  type: string;
  title: string;
  summary: string | null;
  date: string | null;
  client: string | null;
  role: string | null;
  category: string | null;
  cover: PublicAsset | null;
  blocks: ProjectBlockView[];
  credits: { name: string; role: string; url?: string }[];
  related: string[];
  featured: boolean;
  protectedPage: boolean;
};

export async function listProjects(db: Database, site: Site = "hub"): Promise<ProjectView[]> {
  const rows = await db
    .select()
    .from(s.projects)
    .where(and(eq(s.projects.site, site), eq(s.projects.status, "published"), isNull(s.projects.deletedAt)))
    .orderBy(asc(s.projects.sort), desc(s.projects.date));
  const ids: (string | null)[] = [];
  for (const p of rows) {
    ids.push(p.coverMediaId);
    for (const b of p.blocks) {
      if (b.type === "image") ids.push(b.mediaId);
      if (b.type === "gallery") ids.push(...b.mediaIds);
    }
  }
  const media = await assetsById(db, ids);
  return rows.map((p) => ({
    id: p.id,
    slug: p.slug,
    type: p.type,
    title: p.title,
    summary: p.summary,
    date: p.date,
    client: p.client,
    role: p.role,
    category: p.category,
    cover: asset(media, p.coverMediaId),
    blocks: p.blocks.flatMap((b): ProjectBlockView[] => {
      if (b.type === "image") {
        const a = asset(media, b.mediaId);
        return a ? [{ type: "image", asset: a, caption: b.caption }] : [];
      }
      if (b.type === "gallery") {
        const assets = b.mediaIds.map((id) => asset(media, id)).filter((a): a is PublicAsset => a !== null);
        return assets.length ? [{ type: "gallery", assets }] : [];
      }
      return [b];
    }),
    credits: p.credits,
    related: p.related,
    featured: p.featured,
    protectedPage: p.protectedPage,
  }));
}

/* ---------- profile ---------- */

export type ProfileView = {
  profile: Record<string, unknown>;
  socials: { id: string; label: string; href: string; icon: string; showHeader: boolean; showFooter: boolean }[];
  timeline: {
    id: string;
    category: string;
    title: string;
    org: string | null;
    startDate: string | null;
    endDate: string | null;
    current: boolean;
    summary: string | null;
    link: string | null;
  }[];
};

export async function getProfile(db: Database): Promise<ProfileView> {
  const [settings, socials, timeline] = await Promise.all([
    getSettings(db, "hub"),
    db
      .select()
      .from(s.socialLinks)
      .where(and(isNull(s.socialLinks.deletedAt), eq(s.socialLinks.visible, true)))
      .orderBy(asc(s.socialLinks.sort)),
    db
      .select()
      .from(s.timelineEntries)
      .where(and(isNull(s.timelineEntries.deletedAt), eq(s.timelineEntries.visible, true)))
      .orderBy(asc(s.timelineEntries.sort), desc(s.timelineEntries.startDate)),
  ]);
  return {
    profile: (settings.profile ?? {}) as Record<string, unknown>,
    socials: socials.map((x) => ({
      id: x.id,
      label: x.label,
      href: x.href,
      icon: x.icon,
      showHeader: x.showHeader,
      showFooter: x.showFooter,
    })),
    timeline: timeline.map((t) => ({
      id: t.id,
      category: t.category,
      title: t.title,
      org: t.org,
      startDate: t.startDate,
      endDate: t.endDate,
      current: t.current,
      summary: t.summary,
      link: t.link,
    })),
  };
}

/* ---------- galleries (photography) ---------- */

export type GalleryView = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  protection: "off" | "light" | "strict";
  cover: PublicAsset | null;
  items: { id: string; asset: PublicAsset }[];
};

const level = (v: string): "off" | "light" | "strict" =>
  v === "strict" ? "strict" : v === "off" || v === "none" ? "off" : "light";

export async function listGalleries(db: Database, site: Site = "photos"): Promise<GalleryView[]> {
  const gs = await db
    .select()
    .from(s.galleries)
    .where(and(eq(s.galleries.site, site), eq(s.galleries.visible, true), isNull(s.galleries.deletedAt)))
    .orderBy(asc(s.galleries.sort), asc(s.galleries.title));
  if (!gs.length) return [];
  const items = await db
    .select()
    .from(s.galleryItems)
    .where(
      and(
        inArray(
          s.galleryItems.galleryId,
          gs.map((g) => g.id),
        ),
        eq(s.galleryItems.hidden, false),
      ),
    )
    .orderBy(asc(s.galleryItems.sort));
  const media = await assetsById(db, [...items.map((i) => i.mediaId), ...gs.map((g) => g.coverMediaId)]);
  return gs.map((g) => {
    const protection = level(g.protection);
    const mine = items
      .filter((i) => i.galleryId === g.id)
      .flatMap((i) => {
        const row = media.get(i.mediaId);
        return row
          ? [{ id: i.id, asset: { ...toAsset(row, { alt: i.alt, caption: i.caption }), protectedLevel: protection } }]
          : [];
      });
    const cover = asset(media, g.coverMediaId) ?? mine[0]?.asset ?? null;
    return {
      id: g.id,
      slug: g.slug,
      title: g.title,
      description: g.description,
      category: g.category,
      protection,
      cover,
      items: mine,
    };
  });
}

/* ---------- music and flying ---------- */

export type MusicView = {
  id: string;
  kind: "recording" | "performance";
  title: string;
  date: string | null;
  venue: string | null;
  ensemble: string | null;
  note: string | null;
  provider: string | null;
  embedId: string | null;
  rights: string;
  featured: boolean;
  cover: PublicAsset | null;
};

export async function listMusic(db: Database): Promise<MusicView[]> {
  const rows = await db
    .select()
    .from(s.musicItems)
    .where(and(eq(s.musicItems.visible, true), isNull(s.musicItems.deletedAt)))
    .orderBy(asc(s.musicItems.sort), desc(s.musicItems.date));
  const media = await assetsById(
    db,
    rows.map((r) => r.coverMediaId),
  );
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    title: r.title,
    date: r.date,
    venue: r.venue,
    ensemble: r.ensemble,
    note: r.note,
    provider: r.provider,
    embedId: r.embedId,
    rights: r.rights,
    featured: r.featured,
    cover: asset(media, r.coverMediaId),
  }));
}

export type FlyingView = {
  entries: {
    id: string;
    kind: "milestone" | "flight";
    title: string;
    date: string | null;
    story: string | null;
    aircraft: string | null;
    photo: PublicAsset | null;
  }[];
  aircraft: { id: string; name: string; note: string | null; flown: boolean }[];
};

/** Only entries whose safe-to-publish checklist is complete are ever public, even if `visible` was somehow set. */
export async function getFlying(db: Database): Promise<FlyingView> {
  const rows = await db
    .select()
    .from(s.flightEntries)
    .where(
      and(
        eq(s.flightEntries.visible, true),
        eq(s.flightEntries.safeToPublish, true),
        isNull(s.flightEntries.deletedAt),
      ),
    )
    .orderBy(asc(s.flightEntries.sort), desc(s.flightEntries.date));
  const planes = await db
    .select()
    .from(s.aircraft)
    .where(and(eq(s.aircraft.visible, true), isNull(s.aircraft.deletedAt)))
    .orderBy(asc(s.aircraft.sort), asc(s.aircraft.name));
  const media = await assetsById(
    db,
    rows.map((r) => r.photoMediaId),
  );
  return {
    entries: rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      title: r.title,
      date: r.date,
      story: r.story,
      aircraft: r.aircraft,
      photo: asset(media, r.photoMediaId),
    })),
    aircraft: planes.map((a) => ({ id: a.id, name: a.name, note: a.note, flown: a.flown })),
  };
}

/* ---------- pages and redirects ---------- */

export async function getPublishedPage(db: Database, site: Site, slug: string) {
  const [row] = await db
    .select({ title: s.pages.title, body: s.pages.body, updatedAt: s.pages.updatedAt })
    .from(s.pages)
    .where(
      and(eq(s.pages.site, site), eq(s.pages.slug, slug), eq(s.pages.status, "published"), isNull(s.pages.deletedAt)),
    )
    .limit(1);
  return row ? { title: row.title, body: row.body, updatedAt: row.updatedAt.toISOString() } : null;
}

export async function findRedirect(db: Database, site: Site, path: string) {
  const [row] = await db
    .select({ id: s.redirects.id, to: s.redirects.toPath, permanent: s.redirects.permanent })
    .from(s.redirects)
    .where(and(eq(s.redirects.site, site), eq(s.redirects.fromPath, path)))
    .limit(1);
  if (row)
    await db
      .update(s.redirects)
      .set({ hits: sql`${s.redirects.hits} + 1` })
      .where(eq(s.redirects.id, row.id));
  return row ? { to: row.to, permanent: row.permanent } : null;
}
