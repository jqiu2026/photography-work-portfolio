import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, describe, expect, it } from "vitest";
import type { Database } from "../src/client";
import * as gal from "../src/galleries";
import * as x from "../src/gallery-extras";
import * as shop from "../src/gallery-shop";
import * as plan from "../src/plan";
import * as schema from "../src/schema";
import * as st from "../src/studio";

const here = path.dirname(fileURLToPath(import.meta.url));
let db: Database;
let gid: string;
let media: string[] = [];
beforeAll(async () => {
  const d = drizzle(await PGlite.create(), { schema, casing: "snake_case" });
  await migrate(d, { migrationsFolder: path.join(here, "../drizzle") });
  db = d as unknown as Database;
  const c = await st.createClient(db, { name: "Extras Client", email: "extras@example.com" });
  const job = await st.createJob(db, { clientId: c.id, title: "Extras job" });
  const rows = await db
    .insert(schema.media)
    .values(
      Array.from({ length: 3 }, (_, i) => ({
        filename: `e${i}.jpg`,
        mime: "image/jpeg",
        originalKey: `o/${i}`,
        derivatives: [],
        bytes: 1_000_000,
      })),
    )
    .returning();
  media = rows.map((r) => r.id);
  gid = (await st.createGallery(db, { jobId: job.id, passcode: "extras-pass-1" })).id;
  await gal.addItems(db, gid, media);
  await st.publishGallery(db, gid);
});

describe("gallery settings", () => {
  it("keeps dates honest and takes the album cover from the first upload", async () => {
    await gal.updateGallery(db, gid, {
      shootDate: "2026-06-06",
      orderDueDate: "2026-07-31",
      emailRequired: true,
      autoArchive: true,
    });
    const [g] = await db
      .select()
      .from(schema.studioGalleries)
      .where((await import("drizzle-orm")).eq(schema.studioGalleries.id, gid));
    expect(g).toMatchObject({
      shootDate: "2026-06-06",
      orderDueDate: "2026-07-31",
      emailRequired: true,
      autoArchive: true,
    });
    await expect(gal.updateGallery(db, gid, { shootDate: "06/06/2026" })).rejects.toThrow(/real date/);
    await gal.updateGallery(db, gid, { orderDueDate: "" });
    const album = await gal.createAlbum(db, gid, "Highlights");
    await gal.addItems(db, gid, [media[0]], album.id);
    expect((await gal.listAlbums(db, gid))[0].coverMediaId).toBe(media[0]);
  });
});

describe("visitors", () => {
  it("counts a repeat visit once per email and rejects a bad address", async () => {
    await x.registerVisitor(db, gid, { email: "Ann@Example.com", name: "Ann" });
    const again = await x.registerVisitor(db, gid, { email: "ann@example.com" });
    expect(again.visits).toBe(2);
    expect(again.name).toBe("Ann");
    await expect(x.registerVisitor(db, gid, { email: "nope" })).rejects.toThrow(/valid email/);
    expect((await x.listVisitors(db, gid)).length).toBe(1);
  });
});

describe("watermarks and download rules", () => {
  it("makes the first watermark the default, switches it, and validates rules", async () => {
    const a = await x.saveWatermark(db, { name: "Portfolio 2026", text: "© Jerry Qiu" });
    const b = await x.saveWatermark(db, { name: "Light", text: "JQ", position: "center", opacity: 20 });
    expect((await x.listWatermarks(db)).find((w) => w.id === a)?.isDefault).toBe(true);
    await x.setDefaultWatermark(db, b);
    expect((await x.listWatermarks(db)).filter((w) => w.isDefault).map((w) => w.id)).toEqual([b]);
    await expect(x.saveWatermark(db, { name: "x", text: "y" })).rejects.toThrow(/Name/);
    await expect(x.saveWatermark(db, { name: "Empty", text: " " })).rejects.toThrow(/words/);

    await expect(x.saveRule(db, { galleryId: gid, name: "Tiny", maxPx: 50 })).rejects.toThrow(/200 to 12000/);
    await expect(x.saveRule(db, { galleryId: gid, name: "Pin", pin: "12" })).rejects.toThrow(/4 to 12/);
    const free = await x.saveRule(db, { galleryId: gid, name: "Free (720 px)", maxPx: 720, watermarkId: a });
    const album = (await gal.listAlbums(db, gid))[0];
    const hi = await x.saveRule(db, {
      galleryId: gid,
      albumId: album.id,
      name: "High resolution",
      maxPx: 2500,
      pin: "4821",
      perVisitor: 3,
    });
    const rules = await x.listRules(db, gid);
    expect(rules).toHaveLength(2);
    expect(x.rulesForAlbum(rules, null).map((r) => r.id)).toEqual([free]);
    expect(x.rulesForAlbum(rules, album.id).map((r) => r.id)).toEqual([hi]); // the album's own rule wins
    const hiRow = rules.find((r) => r.id === hi)!;
    expect(await x.checkRulePin(hiRow, "4821")).toBe(true);
    expect(await x.checkRulePin(hiRow, "0000")).toBe(false);
    await x.deleteWatermark(db, a);
    expect((await x.listRules(db, gid)).find((r) => r.id === free)?.watermarkId).toBeNull();
    // a duplicate keeps the rules and the album structure
    const copy = await gal.duplicateGallery(db, gid);
    expect((await x.listRules(db, copy.gallery.id)).length).toBe(2);
  });
});

describe("music", () => {
  it("accepts audio and refuses anything else", async () => {
    const t = await x.addTrack(db, {
      title: "Slow morning",
      storageKey: "audio/a.mp3",
      mime: "audio/mpeg",
      bytes: 3_000_000,
    });
    await expect(
      x.addTrack(db, { title: "Not audio", storageKey: "a.exe", mime: "application/x-msdownload", bytes: 1 }),
    ).rejects.toThrow(/MP3/);
    expect((await x.tracksByIds(db, [t.id, crypto.randomUUID()])).map((r) => r.id)).toEqual([t.id]);
    await x.deleteTrack(db, t.id);
    expect(await x.listTracks(db)).toHaveLength(0);
  });
});

describe("price sheets", () => {
  it("copies a sheet, sells from the gallery's own sheet, and enforces a minimum order", async () => {
    const def = await shop.defaultSheet(db);
    const base = await shop.listProducts(db);
    expect(base.length).toBeGreaterThan(5);
    const sheet = await shop.createSheet(db, "Temp for prom", def.id);
    const mine = await shop.listProducts(db, { sheetId: sheet.id });
    expect(mine).toHaveLength(base.length);
    await shop.saveProduct(db, mine.find((p) => p.kind === "digital-web")!.id, { priceCents: 100 });
    await expect(shop.deleteSheet(db, def.id)).rejects.toThrow(/default/);
    await shop.saveShop(db, gid, { enabled: true, priceSheetId: sheet.id, minOrderCents: 500 });
    const web = mine.find((p) => p.kind === "digital-web")!;
    await expect(
      shop.placeOrder(db, {
        galleryId: gid,
        lines: [{ productId: web.id, mediaId: media[1], qty: 1 }],
        buyer: { name: "Cy Buyer", email: "cy@example.com" },
      }),
    ).rejects.toThrow(/smallest order/);
    const full = mine.find((p) => p.kind === "digital-full")!;
    const r = await shop.placeOrder(db, {
      galleryId: gid,
      lines: [{ productId: full.id, mediaId: media[1], qty: 1 }],
      buyer: { name: "Cy Buyer", email: "cy@example.com" },
    });
    expect(r.order.subtotalCents).toBe(full.priceCents);
    // a product from another sheet is not sold here
    await expect(
      shop.placeOrder(db, {
        galleryId: gid,
        lines: [{ productId: base[0].id, mediaId: media[1], qty: 1 }],
        buyer: { name: "Cy Buyer", email: "cy@example.com" },
      }),
    ).rejects.toThrow(/no longer for sale/);
    await shop.deleteSheet(db, sheet.id);
    expect((await shop.listSheets(db)).map((s) => s.name)).toEqual(["Standard"]);
  });
});

describe("plans", () => {
  it("starts on Full Frame at 100% off, bills $0 once a month, and Free has limits that name the upgrade", async () => {
    const o = await plan.planOverview(db);
    expect(o.state).toMatchObject({ plan: "fullframe", discountPct: 100 });
    expect(o.due).toBe(0);
    const first = await plan.billThisMonth(db, new Date("2026-10-16T12:00:00Z"));
    expect(first).toMatchObject({ amountCents: 0, status: "free" });
    expect(await plan.billThisMonth(db, new Date("2026-10-20T12:00:00Z"))).toBeNull();
    expect((await plan.billThisMonth(db, new Date("2026-11-02T12:00:00Z")))?.description).toContain("2026-11");

    await plan.setPlan(db, "free");
    await expect(plan.assertPlan(db, "shop")).rejects.toThrow(/Full Frame/);
    await expect(plan.assertPlan(db, "music")).rejects.toThrow(/Full Frame/);
    await expect(plan.assertUpload(db, gid, 3 * 1024 ** 3)).rejects.toThrow(/2 GB/);
    await plan.assertUpload(db, gid, 1000); // small uploads fit
    await expect(plan.assertUpload(db, gid, 1000, 400)).rejects.toThrow(/300 photographs/);
    expect(await plan.billThisMonth(db)).toBeNull(); // Free is never billed
    await plan.setPlan(db, "fullframe");
    await plan.assertPlan(db, "shop");
  });
});
