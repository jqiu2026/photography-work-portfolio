// Imports the photographs that already exist in the repo into the media library, builds the portfolio galleries, and
// attaches project/blog images. Idempotent (skips files already imported). Originals go to the PRIVATE store.
// Usage: pnpm --filter @jerryqiu/media seed     (needs DATABASE_URL; `pnpm dev` runs it once the local DB is up)
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDb, schema } from "@jerryqiu/db";
import { createStorage } from "@jerryqiu/storage";
import { and, eq, isNull } from "drizzle-orm";
import { ingestImage, safeName } from "../src";
import gallery from "../seed/gallery.json" with { type: "json" };

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const photosDir = path.join(root, "apps/photos/public/images/gallery");
const webImages = path.join(root, "apps/web/public/images");
// Categories without people in them are not flagged; everything else is (school events, performers, portraits).
const NO_PEOPLE = new Set(["Street", "Macro", "Aviation"]);

async function waitForDb() {
  for (let i = 0; i < 60; i++) {
    const db = getDb();
    try {
      if (db) {
        await db.select({ id: schema.users.id }).from(schema.users).limit(1);
        return db;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Database is not reachable (is `pnpm dev:db` running?)");
}

const db = await waitForDb();
const originals = createStorage("originals");
const publicStore = createStorage("public");
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const existing = await db
  .select({ id: schema.media.id, filename: schema.media.filename })
  .from(schema.media)
  .where(eq(schema.media.createdBy, "seed"));
const byName = new Map(existing.map((m) => [m.filename, m.id]));

async function importFile(file: string, review: boolean, alt?: string): Promise<string> {
  const name = safeName(path.basename(file));
  const have = byName.get(name);
  if (have) return have;
  const r = await ingestImage({
    db,
    originals,
    publicStore,
    filename: path.basename(file),
    bytes: readFileSync(file),
    user: "seed",
    defaultReview: review,
    alt,
  });
  await db.update(schema.media).set({ createdBy: "seed" }).where(eq(schema.media.id, r.id));
  byName.set(name, r.id);
  console.log("imported", name);
  return r.id;
}

// 1. Portfolio galleries, one per category (the owner's original categories).
const cats = [...new Set((gallery as [string, string][]).map(([, c]) => c))];
for (const [ci, cat] of cats.entries()) {
  const gslug = slug(cat);
  let [g] = await db
    .select()
    .from(schema.galleries)
    .where(and(eq(schema.galleries.site, "photos"), eq(schema.galleries.slug, gslug)))
    .limit(1);
  const files = (gallery as [string, string][]).filter(([, c]) => c === cat);
  const ids: string[] = [];
  for (const [i, [file]] of files.entries())
    ids.push(await importFile(path.join(photosDir, file), !NO_PEOPLE.has(cat), `${cat} photograph ${i + 1}`));
  if (!g) {
    [g] = await db
      .insert(schema.galleries)
      .values({
        site: "photos",
        slug: gslug,
        title: cat,
        category: cat,
        coverMediaId: ids[0],
        sort: ci,
        protection: "light",
        updatedBy: "seed",
      })
      .returning();
    for (const [i, mediaId] of ids.entries())
      await db.insert(schema.galleryItems).values({ galleryId: g.id, mediaId, sort: i });
    console.log("gallery", cat, ids.length);
  }
}

// 2. Project images: cover + a gallery block (only once, so owner edits are never overwritten).
const projectsDir = path.join(webImages, "projects");
for (const dirName of readdirSync(projectsDir)) {
  const [p] = await db
    .select()
    .from(schema.projects)
    .where(and(eq(schema.projects.site, "hub"), eq(schema.projects.slug, dirName), isNull(schema.projects.deletedAt)))
    .limit(1);
  if (!p || p.coverMediaId) continue;
  const files = readdirSync(path.join(projectsDir, dirName))
    .filter((f) => /\.(jpe?g|png)$/i.test(f))
    .sort();
  const ids: string[] = [];
  for (const [i, f] of files.entries())
    ids.push(await importFile(path.join(projectsDir, dirName, f), true, `${p.title}, photograph ${i + 1}`));
  if (!ids.length) continue;
  const blocks = [...p.blocks, ...(ids.length > 1 ? [{ type: "gallery" as const, mediaIds: ids }] : [])];
  await db.update(schema.projects).set({ coverMediaId: ids[0], blocks }).where(eq(schema.projects.id, p.id));
  console.log("project images", dirName, ids.length);
}

// 3. Blog covers.
const blogsDir = path.join(webImages, "blogs");
for (const dirName of readdirSync(blogsDir)) {
  const [post] = await db
    .select()
    .from(schema.posts)
    .where(and(eq(schema.posts.site, "hub"), eq(schema.posts.slug, dirName)))
    .limit(1);
  const cover = readdirSync(path.join(blogsDir, dirName)).find((f) => /^cover\./i.test(f));
  if (!post || post.coverMediaId || !cover) continue;
  const id = await importFile(path.join(blogsDir, dirName, cover), false, `Cover image for “${post.title}”`);
  await db.update(schema.posts).set({ coverMediaId: id }).where(eq(schema.posts.id, post.id));
  console.log("post cover", dirName);
}

// 4. Portrait for the profile.
const avatar = path.join(webImages, "avatar.jpg");
const portraitId = await importFile(avatar, false, "Portrait of Jerry Qiu");
const [prof] = await db
  .select()
  .from(schema.settings)
  .where(and(eq(schema.settings.site, "hub"), eq(schema.settings.key, "profile")))
  .limit(1);
if (prof && !(prof.value as { portraitMediaId?: string }).portraitMediaId) {
  await db
    .update(schema.settings)
    .set({ value: { ...(prof.value as object), portraitMediaId: portraitId } })
    .where(and(eq(schema.settings.site, "hub"), eq(schema.settings.key, "profile")));
}
console.log("media seed done");
process.exit(0);
