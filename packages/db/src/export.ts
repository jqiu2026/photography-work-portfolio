import { desc } from "drizzle-orm";
import type { Database } from "./client";
import * as s from "./schema";
import { zip } from "./zip";

const json = (v: unknown) => `${JSON.stringify(v, null, 2)}\n`;
const q = (v: unknown) => JSON.stringify(v ?? null); // JSON scalars are valid YAML

const safeFile = (x: string) => x.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "") || "untitled";

function markdown(fields: Record<string, unknown>, body: string) {
  const head = Object.entries(fields)
    .map(([k, v]) => `${k}: ${q(v instanceof Date ? v.toISOString() : v)}`)
    .join("\n");
  return `---\n${head}\n---\n\n${body}\n`;
}

/**
 * Everything the owner can edit, as plain files: one JSON file per table, Markdown for posts and pages, and a media
 * manifest (file names, keys, alt text, licences). No lock-in: this is the format-of-last-resort backup.
 * Left out on purpose: OAuth/ShootProof tokens, rate-limit counters and the temporary external cache.
 */
export async function exportAll(db: Database): Promise<Record<string, string>> {
  const [
    users,
    settings,
    socialLinks,
    timeline,
    media,
    posts,
    projects,
    galleries,
    galleryItems,
    music,
    flights,
    aircraft,
    pages,
    inbox,
    redirects,
    audit,
  ] = await Promise.all([
    db.select().from(s.users),
    db.select().from(s.settings),
    db.select().from(s.socialLinks),
    db.select().from(s.timelineEntries),
    db.select().from(s.media),
    db.select().from(s.posts),
    db.select().from(s.projects),
    db.select().from(s.galleries),
    db.select().from(s.galleryItems),
    db.select().from(s.musicItems),
    db.select().from(s.flightEntries),
    db.select().from(s.aircraft),
    db.select().from(s.pages),
    db.select().from(s.inboxMessages),
    db.select().from(s.redirects),
    db.select().from(s.auditLog).orderBy(desc(s.auditLog.id)).limit(5000),
  ]);
  const files: Record<string, string> = {
    "README.txt":
      "Backup of jerryqiu.com content.\n\n- data/*.json: one file per table (dates are ISO strings).\n- posts/*.md and pages/*.md: Markdown with front matter.\n- media-manifest.json: every image with its storage keys, alt text and licence. The image files themselves live in storage and are not included here.\n- data/inbox_messages.json contains visitors' personal data. Keep this backup private.\n",
    "data/users.json": json(users),
    "data/settings.json": json(settings),
    "data/social_links.json": json(socialLinks),
    "data/timeline_entries.json": json(timeline),
    "data/media.json": json(media),
    "data/posts.json": json(posts),
    "data/projects.json": json(projects),
    "data/galleries.json": json(galleries),
    "data/gallery_items.json": json(galleryItems),
    "data/music_items.json": json(music),
    "data/flight_entries.json": json(flights),
    "data/aircraft.json": json(aircraft),
    "data/pages.json": json(pages),
    "data/inbox_messages.json": json(inbox),
    "data/redirects.json": json(redirects),
    "data/audit_log.json": json(audit),
    "media-manifest.json": json(
      media.map((m) => ({
        id: m.id,
        filename: m.filename,
        originalKey: m.originalKey,
        derivatives: m.derivatives,
        alt: m.alt,
        width: m.width,
        height: m.height,
        license: m.license,
        deleted: Boolean(m.deletedAt),
      })),
    ),
  };
  for (const p of posts) {
    files[`posts/${safeFile(`${p.site}-${p.slug}`)}.md`] = markdown(
      {
        title: p.title,
        slug: p.slug,
        site: p.site,
        status: p.status,
        publishAt: p.publishAt,
        tags: p.tags,
        summary: p.summary,
        deleted: Boolean(p.deletedAt),
      },
      p.body,
    );
  }
  for (const p of pages) {
    files[`pages/${safeFile(`${p.site}-${p.slug}`)}.md`] = markdown(
      { title: p.title, slug: p.slug, site: p.site, status: p.status },
      p.body,
    );
  }
  return files;
}

export async function exportZip(db: Database): Promise<Buffer> {
  return zip(await exportAll(db));
}
