import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, describe, expect, it } from "vitest";
import type { Database } from "../src/client";
import { hitRateLimit } from "../src/rate-limit";
import * as s from "../src/schema";
import { seed } from "../src/seed";

const here = path.dirname(fileURLToPath(import.meta.url));
let db: Database;

beforeAll(async () => {
  const client = await PGlite.create();
  const d = drizzle(client, { schema: s, casing: "snake_case" });
  await migrate(d, { migrationsFolder: path.join(here, "../drizzle") });
  db = d as unknown as Database;
});

describe("migrations and schema", () => {
  it("enforces unique slugs per site, but allows the same slug on another site", async () => {
    await db.insert(s.posts).values({ site: "hub", slug: "same", title: "A" });
    await expect(db.insert(s.posts).values({ site: "hub", slug: "same", title: "B" })).rejects.toThrow();
    await db.insert(s.posts).values({ site: "music", slug: "same", title: "C" });
  });
  it("emails are unique (case is normalised by callers)", async () => {
    await db.insert(s.users).values({ email: "a@jerryqiu.com", role: "owner" });
    await expect(db.insert(s.users).values({ email: "a@jerryqiu.com" })).rejects.toThrow();
  });
  it("soft delete keeps the row", async () => {
    const [p] = await db.insert(s.posts).values({ slug: "to-trash", title: "T" }).returning();
    await db.update(s.posts).set({ deletedAt: new Date() }).where(eq(s.posts.id, p.id));
    const [row] = await db.select().from(s.posts).where(eq(s.posts.id, p.id));
    expect(row.deletedAt).toBeInstanceOf(Date);
  });
});

describe("rate limiter", () => {
  it("allows up to the limit then blocks within the window", async () => {
    const results = [];
    for (let i = 0; i < 5; i++) results.push((await hitRateLimit(db, "k1", 3, 60)).allowed);
    expect(results).toEqual([true, true, true, false, false]);
  });
  it("keys are independent", async () => {
    expect((await hitRateLimit(db, "other", 1, 60)).allowed).toBe(true);
    expect((await hitRateLimit(db, "other", 1, 60)).allowed).toBe(false);
    expect((await hitRateLimit(db, "fresh", 1, 60)).allowed).toBe(true);
  });
});

describe("seed", () => {
  const webRoot = path.join(here, "../../../apps/web");
  it("imports the repo content once and never overwrites owner edits", async () => {
    const first = await seed(db, { webRoot, adminEmails: ["Owner@JerryQiu.com"] });
    expect(first.posts).toBe(2);
    expect(first.projects).toBe(5);
    expect(first.social).toBeGreaterThanOrEqual(4);
    expect(first.users).toBe(1);
    // case studies belong to the photography site; the old hub URLs are seeded as redirect rows
    const projects = await db.select().from(s.projects);
    expect(new Set(projects.map((p) => p.site))).toEqual(new Set(["photos"]));
    const [work] = await db.select().from(s.redirects).where(eq(s.redirects.fromPath, "/work/stuy-sing-26"));
    expect(work).toMatchObject({ site: "hub", permanent: true });
    expect(work.toPath).toMatch(/^https?:\/\/.+\/work\/stuy-sing-26$/);
    // an owner edit survives re-seeding
    await db.update(s.posts).set({ title: "Edited by the owner" }).where(eq(s.posts.slug, "day-one"));
    const second = await seed(db, { webRoot, adminEmails: ["owner@jerryqiu.com"] });
    expect(second).toEqual({ users: 0, posts: 0, projects: 0, social: 0, timeline: 0, settings: 0 });
    const [post] = await db.select().from(s.posts).where(eq(s.posts.slug, "day-one"));
    expect(post.title).toBe("Edited by the owner");
    const [u] = await db.select().from(s.users).where(eq(s.users.email, "owner@jerryqiu.com"));
    expect(u.role).toBe("owner");
  });
});
