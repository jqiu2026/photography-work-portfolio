import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, describe, expect, it } from "vitest";
import type { Database } from "../src/client";
import {
  findRedirect,
  getFlying,
  getPublishedPage,
  listGalleries,
  listMusic,
  listPosts,
  listProjects,
} from "../src/queries";
import * as s from "../src/schema";

const here = path.dirname(fileURLToPath(import.meta.url));
let db: Database;
const past = new Date(Date.now() - 86_400_000);
const future = new Date(Date.now() + 86_400_000);

beforeAll(async () => {
  const client = await PGlite.create();
  const d = drizzle(client, { schema: s, casing: "snake_case" });
  await migrate(d, { migrationsFolder: path.join(here, "../drizzle") });
  db = d as unknown as Database;
});

describe("posts: only live content is public", () => {
  it("hides drafts, future-scheduled, trashed and other-site posts", async () => {
    await db.insert(s.posts).values([
      { slug: "live", title: "Live", status: "published" },
      { slug: "draft", title: "Draft", status: "draft" },
      { slug: "future", title: "Future", status: "scheduled", publishAt: future },
      { slug: "due", title: "Due", status: "scheduled", publishAt: past },
      { slug: "later-published", title: "Pub later", status: "published", publishAt: future },
      { slug: "trashed", title: "Trashed", status: "published", deletedAt: new Date() },
      { slug: "music-only", title: "Music", status: "published", site: "music" },
    ]);
    const slugs = (await listPosts(db, "hub")).map((p) => p.slug).sort();
    expect(slugs).toEqual(["due", "live"]);
  });
});

describe("projects, galleries, music, flying", () => {
  it("projects: published only, image blocks resolve to assets and drop deleted media", async () => {
    const [m] = await db
      .insert(s.media)
      .values({
        filename: "a.jpg",
        mime: "image/jpeg",
        originalKey: "o/a",
        width: 800,
        height: 600,
        derivatives: [
          { width: 480, format: "webp", key: "k1" },
          { width: 800, format: "webp", key: "k2" },
        ],
      })
      .returning();
    const [gone] = await db
      .insert(s.media)
      .values({ filename: "gone.jpg", mime: "image/jpeg", originalKey: "o/g", deletedAt: new Date() })
      .returning();
    await db.insert(s.projects).values([
      {
        slug: "p1",
        title: "P1",
        status: "published",
        coverMediaId: m.id,
        blocks: [
          { type: "image", mediaId: m.id },
          { type: "image", mediaId: gone.id },
          { type: "text", markdown: "hi" },
        ],
      },
      { slug: "p2", title: "Draft", status: "draft" },
    ]);
    const ps = await listProjects(db, "hub");
    expect(ps.map((p) => p.slug)).toEqual(["p1"]);
    expect(ps[0].blocks.map((b) => b.type)).toEqual(["image", "text"]);
    expect(ps[0].cover?.files.map((f) => f.width)).toEqual([480, 800]);
    expect(ps[0].cover?.files[0].src).toMatch(new RegExp(`^/api/img/${m.id}\\?w=480&v=\\d+$`));
    // no storage keys or original paths in the public view
    expect(JSON.stringify(ps)).not.toContain("o/a");
  });
  it("galleries: hidden items and invisible galleries are excluded; protection level is carried", async () => {
    const [m1] = await db
      .insert(s.media)
      .values({ filename: "1.jpg", mime: "image/jpeg", originalKey: "o/1" })
      .returning();
    const [m2] = await db
      .insert(s.media)
      .values({ filename: "2.jpg", mime: "image/jpeg", originalKey: "o/2" })
      .returning();
    const [g] = await db
      .insert(s.galleries)
      .values({ slug: "street", title: "Street", protection: "strict" })
      .returning();
    await db.insert(s.galleries).values({ slug: "hidden", title: "Hidden", visible: false });
    await db.insert(s.galleryItems).values([
      { galleryId: g.id, mediaId: m1.id, sort: 1 },
      { galleryId: g.id, mediaId: m2.id, sort: 0, hidden: true },
    ]);
    const gs = await listGalleries(db, "photos");
    expect(gs.map((x) => x.slug)).toEqual(["street"]);
    expect(gs[0].items).toHaveLength(1);
    expect(gs[0].items[0].asset.protectedLevel).toBe("strict");
  });
  it("music: hidden and trashed items are excluded", async () => {
    await db
      .insert(s.musicItems)
      .values([{ title: "Shown" }, { title: "Hidden", visible: false }, { title: "Trashed", deletedAt: new Date() }]);
    expect((await listMusic(db)).map((x) => x.title)).toEqual(["Shown"]);
  });
  it("flying: an entry that is not safe to publish never appears, even when visible", async () => {
    await db.insert(s.flightEntries).values([
      { title: "Safe", safeToPublish: true, visible: true },
      { title: "Unchecked", safeToPublish: false, visible: true },
    ]);
    await db.insert(s.aircraft).values([{ name: "C172" }, { name: "Private", visible: false }]);
    const f = await getFlying(db);
    expect(f.entries.map((e) => e.title)).toEqual(["Safe"]);
    expect(f.aircraft.map((a) => a.name)).toEqual(["C172"]);
  });
});

describe("pages and redirects", () => {
  it("only published, not-deleted pages are returned", async () => {
    await db.insert(s.pages).values([
      { slug: "privacy", title: "Privacy", body: "x", status: "published", kind: "legal" },
      { slug: "terms", title: "Terms", body: "y", status: "draft", kind: "legal" },
    ]);
    expect((await getPublishedPage(db, "hub", "privacy"))?.title).toBe("Privacy");
    expect(await getPublishedPage(db, "hub", "terms")).toBeNull();
  });
  it("redirect lookup is per site and counts hits", async () => {
    await db.insert(s.redirects).values({ site: "hub", fromPath: "/old", toPath: "/new" });
    expect(await findRedirect(db, "hub", "/old")).toEqual({ to: "/new", permanent: true });
    expect(await findRedirect(db, "music", "/old")).toBeNull();
    const [row] = await db.select().from(s.redirects);
    expect(row.hits).toBe(1);
  });
});
