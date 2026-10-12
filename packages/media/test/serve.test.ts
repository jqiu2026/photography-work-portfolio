import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { type Database, schema } from "@jerryqiu/db";
import { signImageToken } from "@jerryqiu/protect";
import { localStorageProvider } from "@jerryqiu/storage";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, describe, expect, it } from "vitest";
import { serveImage } from "../src";

const migrations = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../db/drizzle");
const env = { IMAGE_TOKEN_SECRET: "test-secret-0123456789" };
const secrets = [env.IMAGE_TOKEN_SECRET];
const UA = "Mozilla/5.0 (Macintosh) Safari/605";
let db: Database;
let store: ReturnType<typeof localStorageProvider>;
let open: string;
let strict: string;

const get = (id: string, qs: string, headers: Record<string, string> = {}) =>
  serveImage(new Request(`http://site.test/api/img/${id}?${qs}`, { headers: { "user-agent": UA, ...headers } }), id, {
    db,
    store,
    env,
  });
const tok = (id: string, width = 960, extra: { ttl?: number; now?: number } = {}) =>
  signImageToken({ id, width, ttl: extra.ttl ?? 300, secrets, now: extra.now });

beforeAll(async () => {
  const d = drizzle(await PGlite.create(), { schema, casing: "snake_case" });
  await migrate(d, { migrationsFolder: migrations });
  db = d as unknown as Database;
  const dir = await mkdtemp(path.join(os.tmpdir(), "jq-serve-"));
  store = localStorageProvider({ dir, secret: "s", baseUrl: "http://x", store: "public" });
  const mk = async (name: string) => {
    await store.put(`${name}-960.webp`, new Uint8Array([1, 2, 3]), { contentType: "image/webp" });
    await store.put(`${name}-960.avif`, new Uint8Array([4, 5, 6, 7]), { contentType: "image/avif" });
    const [m] = await db
      .insert(schema.media)
      .values({
        filename: `${name}.jpg`,
        mime: "image/jpeg",
        originalKey: `o/${name}`,
        derivatives: [
          { width: 960, format: "webp", key: `${name}-960.webp` },
          { width: 960, format: "avif", key: `${name}-960.avif` },
        ],
      })
      .returning();
    return m.id;
  };
  open = await mk("open");
  strict = await mk("strict");
  const [g] = await db.insert(schema.galleries).values({ slug: "s", title: "S", protection: "strict" }).returning();
  await db.insert(schema.galleryItems).values({ galleryId: g.id, mediaId: strict });
});

describe("public tier", () => {
  it("serves without a token, negotiates AVIF, and is CDN-cacheable", async () => {
    const r = await get(open, "w=960&v=1", { accept: "image/avif,image/webp" });
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toBe("image/avif");
    expect(r.headers.get("cache-control")).toContain("public");
    expect(r.headers.get("x-content-type-options")).toBe("nosniff");
    expect((await get(open, "w=960", { accept: "image/webp" })).headers.get("content-type")).toBe("image/webp");
  });
  it("rejects bad ids, bad widths, bots, missing user agents and deleted media", async () => {
    expect((await get("not-a-uuid", "w=960")).status).toBe(404);
    expect((await get(open, "w=99999")).status).toBe(400);
    expect((await get(open, "w=960", { "user-agent": "GPTBot/1.0" })).status).toBe(403);
    const r = await serveImage(new Request(`http://site.test/api/img/${open}?w=960`), open, { db, store, env });
    expect(r.status).toBe(403);
    expect((await get("00000000-0000-4000-8000-000000000000", "w=960")).status).toBe(404);
  });
});

describe("strict tier", () => {
  it("needs a token, and refuses missing, forged, expired, wrong-width and wrong-image tokens", async () => {
    expect((await get(strict, "w=960")).status).toBe(403);
    expect((await get(strict, `w=960&t=${tok(strict).slice(0, -3)}abc`)).status).toBe(403);
    expect((await get(strict, `w=960&t=${tok(strict, 960, { now: Date.now() - 3_600_000 })}`)).status).toBe(403);
    expect((await get(strict, `w=480&t=${tok(strict, 960)}`)).status).toBe(403);
    expect((await get(strict, `w=960&t=${tok(open, 960)}`)).status).toBe(403);
    expect((await get(strict, `w=700&t=${tok(strict, 960)}`)).status).toBe(400);
  });
  it("serves a valid token as private, uncacheable, same-site only", async () => {
    const r = await get(strict, `w=960&t=${tok(strict)}`, {
      "sec-fetch-site": "same-origin",
      "sec-fetch-dest": "image",
    });
    expect(r.status).toBe(200);
    expect(r.headers.get("cache-control")).toBe("private, no-store");
    expect(r.headers.get("cross-origin-resource-policy")).toBe("same-site");
  });
  it("refuses cross-site fetches, navigations and foreign referers even with a valid token", async () => {
    const t = tok(strict);
    expect((await get(strict, `w=960&t=${t}`, { "sec-fetch-site": "cross-site" })).status).toBe(403);
    expect((await get(strict, `w=960&t=${t}`, { "sec-fetch-dest": "document" })).status).toBe(403);
    expect((await get(strict, `w=960&t=${t}`, { referer: "https://evil.example/page" })).status).toBe(403);
  });
  it("rate limits repeated requests for the same image", async () => {
    const t = tok(strict);
    let last = 200;
    for (let i = 0; i < 45; i++) last = (await get(strict, `w=960&t=${t}`, { "x-forwarded-for": "9.9.9.9" })).status;
    expect(last).toBe(429);
  });
});
