import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { type Database, schema } from "@jerryqiu/db";
import { localStorageProvider } from "@jerryqiu/storage";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import sharp from "sharp";
import { beforeAll, describe, expect, it } from "vitest";
import { ImageError, ingestImage } from "../src";

let db: Database;
let originals: ReturnType<typeof localStorageProvider>;
let pub: ReturnType<typeof localStorageProvider>;
const migrations = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../db/drizzle");

const picture = async (w: number, h: number, flip = false) => {
  const px = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const v = Math.round(((flip ? w - x : x) / w) * 255);
      px.set([v, (y / h) * 255, 255 - v], (y * w + x) * 3);
    }
  return sharp(px, { raw: { width: w, height: h, channels: 3 } })
    .jpeg()
    .toBuffer();
};

beforeAll(async () => {
  const d = drizzle(await PGlite.create(), { schema, casing: "snake_case" });
  await migrate(d, { migrationsFolder: migrations });
  db = d as unknown as Database;
  const dir = await mkdtemp(path.join(os.tmpdir(), "jq-media-"));
  originals = localStorageProvider({ dir, secret: "s", baseUrl: "http://x", store: "originals" });
  pub = localStorageProvider({ dir, secret: "s", baseUrl: "http://x", store: "public" });
});

describe("ingestImage", () => {
  it("keeps the original private and publishes only derivatives", async () => {
    const r = await ingestImage({
      db,
      originals,
      publicStore: pub,
      filename: "My Photo.JPG",
      bytes: await picture(1300, 800),
      user: "owner@jerryqiu.com",
    });
    const [m] = await db.select().from(schema.media).where(eq(schema.media.id, r.id));
    expect(m.originalKey).toBe(`orig/${r.id}/My-Photo.JPG`);
    expect(await originals.head(m.originalKey)).not.toBeNull();
    expect(await pub.head(m.originalKey)).toBeNull(); // the original is never in the public store
    expect(m.derivatives.length).toBeGreaterThan(0);
    for (const d of m.derivatives) {
      expect(d.key).toMatch(/^img\//);
      expect(await pub.head(d.key)).not.toBeNull();
      expect(await originals.head(d.key)).toBeNull();
    }
    expect(m.width).toBe(1300);
    expect(m.reviewStatus).toBe("ok");
    expect(m.license).toBe("all-rights-reserved");
  });
  it("flags imported school-event photos as needing review", async () => {
    const r = await ingestImage({
      db,
      originals,
      publicStore: pub,
      filename: "event.jpg",
      bytes: await picture(700, 500, true),
      user: "seed",
      defaultReview: true,
    });
    const [m] = await db.select().from(schema.media).where(eq(schema.media.id, r.id));
    expect(m.reviewStatus).toBe("needs_review");
    expect(m.containsPeople).toBe(true);
  });
  it("never stores the same file twice: an exact copy answers with the photograph already there", async () => {
    const bytes = await picture(520, 340);
    const a = await ingestImage({ db, originals, publicStore: pub, filename: "same.jpg", bytes, user: "u" });
    // a staged original (as the upload routes leave it) is removed rather than kept as a second copy
    const staged = `orig/${crypto.randomUUID()}/same-again.jpg`;
    await originals.put(staged, new Uint8Array(bytes), { contentType: "image/jpeg" });
    const b = await ingestImage({
      db,
      originals,
      publicStore: pub,
      filename: "same-again.jpg",
      bytes,
      user: "u",
      originalKey: staged,
    });
    expect(b).toMatchObject({ id: a.id, duplicate: true });
    expect(await originals.head(staged)).toBeNull();
    const [m] = await db.select().from(schema.media).where(eq(schema.media.id, a.id));
    expect(m.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(
      (
        await db
          .select()
          .from(schema.media)
          .where(eq(schema.media.sha256, m.sha256 as string))
      ).length,
    ).toBe(1);
  });
  it("warns about a near-duplicate upload", async () => {
    const a = await ingestImage({
      db,
      originals,
      publicStore: pub,
      filename: "dup-a.jpg",
      bytes: await picture(600, 400),
      user: "u",
    });
    const b = await ingestImage({
      db,
      originals,
      publicStore: pub,
      filename: "dup-b.jpg",
      bytes: await sharp(await picture(600, 400))
        .resize(450)
        .jpeg({ quality: 50 })
        .toBuffer(),
      user: "u",
    });
    expect(b.similarTo?.id).toBe(a.id);
    expect(b.similarTo?.distance).toBeLessThanOrEqual(3);
  });
  it("replace-in-place keeps the id and removes stale derivatives", async () => {
    const first = await ingestImage({
      db,
      originals,
      publicStore: pub,
      filename: "big.jpg",
      bytes: await picture(2000, 1000, true),
      user: "u",
    });
    const [before] = await db.select().from(schema.media).where(eq(schema.media.id, first.id));
    const wide = before.derivatives.find((d) => d.width >= 1600);
    expect(wide).toBeDefined();
    const second = await ingestImage({
      db,
      originals,
      publicStore: pub,
      filename: "small.jpg",
      bytes: await picture(500, 300, true),
      user: "u",
      replaceId: first.id,
    });
    expect(second.id).toBe(first.id);
    expect(second.replaced).toBe(true);
    const [after] = await db.select().from(schema.media).where(eq(schema.media.id, first.id));
    expect(after.width).toBe(500);
    expect(await pub.head((wide as { key: string }).key)).toBeNull();
  });
  it("refuses non-images and writes nothing", async () => {
    const before = await db.select().from(schema.media);
    await expect(
      ingestImage({
        db,
        originals,
        publicStore: pub,
        filename: "x.jpg",
        bytes: Buffer.from("<svg onload=alert(1)>"),
        user: "u",
      }),
    ).rejects.toBeInstanceOf(ImageError);
    expect((await db.select().from(schema.media)).length).toBe(before.length);
  });
});
