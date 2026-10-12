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
import sharp from "sharp";
import { handleTokenRequest, serveImage } from "../src";
import { applyWatermark } from "../src/watermark";

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

const tokenReq = (body: unknown, headers: Record<string, string> = {}) =>
  handleTokenRequest(
    new Request("http://site.test/api/img/token", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": UA,
        origin: "http://site.test",
        host: "site.test",
        ...headers,
      },
      body: JSON.stringify(body),
    }),
    { db, store, env },
  );

describe("token refresh endpoint", () => {
  it("mints a token per allowed width for a strict image, and those tokens work", async () => {
    const r = await tokenReq({ id: strict }, { "x-forwarded-for": "7.7.7.7" });
    expect(r.status).toBe(200);
    const { tokens } = (await r.json()) as { tokens: Record<string, string> };
    expect(Object.keys(tokens).sort()).toEqual(["1600", "2400", "480", "960"]);
    expect((await get(strict, `w=960&t=${tokens["960"]}`, { "sec-fetch-site": "same-origin" })).status).toBe(200);
  });
  it("refuses images that are not protected, cross-site callers, bots and bad ids", async () => {
    expect((await tokenReq({ id: open })).status).toBe(404);
    expect((await tokenReq({ id: strict }, { origin: "https://evil.example" })).status).toBe(403);
    expect((await tokenReq({ id: strict }, { "sec-fetch-site": "cross-site" })).status).toBe(403);
    expect((await tokenReq({ id: strict }, { "user-agent": "ClaudeBot/1.0" })).status).toBe(403);
    expect((await tokenReq({ id: "nope" })).status).toBe(400);
  });
});

describe("watermark", () => {
  it("changes the picture but not its size or format", async () => {
    const plain = await sharp({ create: { width: 800, height: 500, channels: 3, background: "#406080" } })
      .webp()
      .toBuffer();
    const marked = await applyWatermark(plain, "webp", { text: "© Jerry Qiu", position: "bottom-right", opacity: 0.5 });
    const meta = await sharp(marked).metadata();
    expect([meta.width, meta.height, meta.format]).toEqual([800, 500, "webp"]);
    expect(marked.equals(plain)).toBe(false);
    const a = await sharp(plain).raw().toBuffer();
    const b = await sharp(marked).raw().toBuffer();
    let diff = 0;
    for (let i = 0; i < a.length; i += 3) if (Math.abs(a[i] - b[i]) > 20) diff++;
    expect(diff).toBeGreaterThan(50);
  });
  it("escapes markup in the text", async () => {
    const plain = await sharp({ create: { width: 400, height: 300, channels: 3, background: "#000" } })
      .webp()
      .toBuffer();
    await expect(
      applyWatermark(plain, "webp", { text: '<script>"&', position: "center", opacity: 0.4 }),
    ).resolves.toBeInstanceOf(Buffer);
  });
  it("is applied by the image route when the site setting is on, and cached", async () => {
    const png = await sharp({ create: { width: 960, height: 600, channels: 3, background: "#406080" } })
      .webp()
      .toBuffer();
    await store.put("wm-src-960.webp", png, { contentType: "image/webp" });
    const [m] = await db
      .insert(schema.media)
      .values({
        filename: "w.jpg",
        mime: "image/jpeg",
        originalKey: "o/w",
        derivatives: [{ width: 960, format: "webp", key: "wm-src-960.webp" }],
      })
      .returning();
    await db.insert(schema.settings).values({
      site: "photos",
      key: "protection",
      value: {
        level: "light",
        watermark: true,
        watermarkText: "© Test",
        watermarkPosition: "bottom-right",
        watermarkOpacity: 0.5,
      },
    });
    const req = () =>
      new Request(`http://site.test/api/img/${m.id}?w=960&v=1`, {
        headers: { "user-agent": UA, accept: "image/webp" },
      });
    const r1 = await serveImage(req(), m.id, { db, store, env, site: "photos" });
    const body1 = Buffer.from(await r1.arrayBuffer());
    expect(body1.equals(png)).toBe(false);
    const stored = await store.list("wm/");
    expect(stored.length).toBe(1);
    const r2 = await serveImage(req(), m.id, { db, store, env, site: "photos" });
    expect(Buffer.from(await r2.arrayBuffer()).equals(body1)).toBe(true);
    // a site with the setting off serves the plain file
    const r3 = await serveImage(req(), m.id, { db, store, env, site: "hub" });
    expect(Buffer.from(await r3.arrayBuffer()).equals(png)).toBe(true);
  });
});
