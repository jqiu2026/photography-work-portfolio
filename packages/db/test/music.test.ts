import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, describe, expect, it } from "vitest";
import type { Database } from "../src/client";
import * as m from "../src/music";
import * as schema from "../src/schema";

const here = path.dirname(fileURLToPath(import.meta.url));
let db: Database;
let nocturne: Awaited<ReturnType<typeof m.saveWork>>;
let etude: Awaited<ReturnType<typeof m.saveWork>>;
let arr: Awaited<ReturnType<typeof m.saveWork>>;
let pNoc: string;
let pEt: string;
let pArr: string;
let pEns: string;
let fileId: string;

beforeAll(async () => {
  const d = drizzle(await PGlite.create(), { schema, casing: "snake_case" });
  await migrate(d, { migrationsFolder: path.join(here, "../drizzle") });
  db = d as unknown as Database;
  nocturne = await m.saveWork(db, {
    title: "Nocturne for Brass",
    instruments: ["trumpet", "trombone"],
    genre: "chamber",
    difficulty: "medium",
    status: "published",
    year: 2025,
  });
  etude = await m.saveWork(db, {
    title: "Etude",
    instruments: ["trombone"],
    genre: "solo",
    difficulty: "easy",
    status: "published",
  });
  arr = await m.saveWork(db, { title: "Arranged Song", rightsType: "arrangement-copyrighted", status: "published" });
  await m.saveWork(db, { title: "Unfinished", status: "draft" });
  fileId = (
    await m.addScoreFile(db, nocturne.id, {
      kind: "full-score",
      label: "Score",
      filename: "nocturne.pdf",
      mime: "application/pdf",
      storageKey: "scores/nocturne.pdf",
      bytes: 10,
      pages: 9,
    })
  ).id;
  pNoc = (await m.saveProduct(db, nocturne.id, { title: "Personal", priceCents: 1200, fileIds: [fileId] })).id;
  pEns = (await m.saveProduct(db, nocturne.id, { title: "Ensemble", tier: "ensemble", priceCents: 4000 })).id;
  pEt = (await m.saveProduct(db, etude.id, { title: "Personal", priceCents: 800 })).id;
  pArr = (await m.saveProduct(db, arr.id, { title: "Personal", priceCents: 500 })).id;
});

describe("catalog", () => {
  it("lists published pieces only and gives the cheapest price", async () => {
    const all = await m.listCatalog(db);
    expect(all.map((e) => e.title)).not.toContain("Unfinished");
    expect(all.find((e) => e.id === nocturne.id)?.fromCents).toBe(1200);
  });
  it("a copyrighted arrangement shows no price until a license is on file", async () => {
    expect((await m.listCatalog(db)).find((e) => e.id === arr.id)?.forSale).toBe(false);
    await m.saveWork(
      db,
      { title: "Arranged Song", rightsType: "arrangement-copyrighted", licenseOnFile: true, status: "published" },
      arr.id,
    );
    expect((await m.listCatalog(db)).find((e) => e.id === arr.id)?.forSale).toBe(true);
    await m.saveWork(
      db,
      { title: "Arranged Song", rightsType: "arrangement-copyrighted", licenseOnFile: false, status: "published" },
      arr.id,
    );
  });
  it("filters by instrument, genre, difficulty, text and for sale", async () => {
    expect((await m.listCatalog(db, { instrument: "trumpet" })).map((e) => e.title)).toEqual(["Nocturne for Brass"]);
    expect((await m.listCatalog(db, { genre: "solo" })).map((e) => e.title)).toEqual(["Etude"]);
    expect((await m.listCatalog(db, { difficulty: "easy" })).map((e) => e.title)).toEqual(["Etude"]);
    expect((await m.listCatalog(db, { q: "noct" })).length).toBe(1);
    expect((await m.listCatalog(db, { forSale: true })).map((e) => e.title)).not.toContain("Arranged Song");
  });
  it("the work page hides products while the rights hold the sale", async () => {
    const page = await m.getWorkPage(db, arr.slug);
    expect(page?.products).toEqual([]);
    expect(page?.saleBlocked).toMatch(/copyrighted/);
  });
  it("a draft has no public page, and slugs stay unique", async () => {
    expect(await m.getWorkPage(db, "unfinished")).toBeNull();
    const dup = await m.saveWork(db, { title: "Etude", status: "published" });
    expect(dup.slug).toBe("etude-2");
  });
});

describe("orders and licenses", () => {
  it("refuses a copyrighted arrangement with no license on file", async () => {
    await expect(m.createOrder(db, { email: "a@example.com", holderName: "A", productIds: [pArr] })).rejects.toThrow(
      /copyrighted/,
    );
  });
  it("an ensemble license names the ensemble", async () => {
    await expect(m.createOrder(db, { email: "a@example.com", holderName: "A", productIds: [pEns] })).rejects.toThrow(
      /ensemble or institution/,
    );
  });
  it("one license per piece in a cart", async () => {
    await expect(
      m.createOrder(db, { email: "a@example.com", holderName: "A", productIds: [pNoc, pEns], organization: "Q" }),
    ).rejects.toThrow(/twice/);
  });
  it("totals include the passed-through fee", async () => {
    const o = await m.createOrder(db, { email: "t@example.com", holderName: "T", productIds: [pNoc, pEt] });
    expect(o.totals.subtotalCents).toBe(2000);
    expect(o.order.totalCents).toBe(2000 + o.totals.feeCents);
    expect(o.order.status).toBe("pending");
  });
  it("paying issues one license per line, once, even if the webhook repeats", async () => {
    const o = await m.createOrder(db, { email: "p@example.com", holderName: "Pat", productIds: [pNoc, pEt] });
    const a = await m.markOrderPaid(db, o.order.id, { provider: "stripe", providerRef: "pi_1" });
    const b = await m.markOrderPaid(db, o.order.id, { provider: "stripe", providerRef: "pi_1" });
    expect(a.duplicate).toBe(false);
    expect(b.duplicate).toBe(true);
    const got = await m.orderByAccessToken(db, o.token);
    expect(got?.licenses).toHaveLength(2);
    expect(new Set(got?.licenses.map((l) => l.licenseNo)).size).toBe(2);
    expect(await m.orderByAccessToken(db, "wrong")).toBeNull();
  });
  it("downloads stop at the cap and after a refund", async () => {
    const o = await m.createOrder(db, { email: "d@example.com", holderName: "Dee", productIds: [pNoc] });
    await m.markOrderPaid(db, o.order.id, { provider: "stripe" });
    const lic = (await m.orderByAccessToken(db, o.token))?.licenses[0];
    if (!lic) throw new Error("no license");
    expect((await m.checkDownload(db, lic.id, fileId)).ok).toBe(true);
    for (let i = 0; i < lic.downloadLimit; i++) await m.recordDownload(db, lic.id, fileId);
    const capped = await m.checkDownload(db, lic.id, fileId);
    expect(capped.ok).toBe(false);
    const o2 = await m.createOrder(db, { email: "r@example.com", holderName: "Rae", productIds: [pNoc] });
    await m.markOrderPaid(db, o2.order.id, { provider: "stripe" });
    const l2 = (await m.orderByAccessToken(db, o2.token))?.licenses[0];
    if (!l2) throw new Error("no license");
    expect(await m.refundOrder(db, o2.order.id)).toBe(true);
    const after = await m.checkDownload(db, l2.id, fileId);
    expect(after).toEqual({ ok: false, reason: "This license was revoked." });
  });
  it("a file outside the license is refused", async () => {
    const o = await m.createOrder(db, { email: "f@example.com", holderName: "Fay", productIds: [pEt] });
    await m.markOrderPaid(db, o.order.id, { provider: "stripe" });
    const lic = (await m.orderByAccessToken(db, o.token))?.licenses[0];
    if (!lic) throw new Error("no license");
    expect((await m.checkDownload(db, lic.id, fileId)).ok).toBe(false);
  });
});

describe("bundles", () => {
  it("must be cheaper than its parts and share one tier", async () => {
    await expect(m.saveBundle(db, { title: "B", priceCents: 2500, productIds: [pNoc, pEt] })).rejects.toThrow(
      /less than/,
    );
    await expect(m.saveBundle(db, { title: "B", priceCents: 1500, productIds: [pNoc, pEns] })).rejects.toThrow(/tier/);
  });
  it("an order splits the bundle price across its pieces exactly", async () => {
    const bundleId = await m.saveBundle(db, { title: "Both", priceCents: 1500, productIds: [pNoc, pEt] });
    const o = await m.createOrder(db, { email: "b@example.com", holderName: "Bo", productIds: [bundleId] });
    expect(o.lines).toHaveLength(2);
    expect(o.lines.reduce((n, l) => n + l.priceCents, 0)).toBe(1500);
  });
});

describe("buyer library", () => {
  it("a sign-in link works once, expires, and is only made for buyers who paid", async () => {
    expect(await m.createBuyerLink(db, "nobody@example.com")).toBeNull();
    const l = await m.createBuyerLink(db, "p@example.com");
    if (!l) throw new Error("expected a link");
    expect((await m.consumeBuyerLink(db, l.token))?.email).toBe("p@example.com");
    expect(await m.consumeBuyerLink(db, l.token)).toBeNull();
    const l2 = await m.createBuyerLink(db, "p@example.com", new Date("2020-01-01T00:00:00Z"));
    if (!l2) throw new Error("expected a link");
    expect(await m.consumeBuyerLink(db, l2.token)).toBeNull();
  });
  it("the library lists the buyer's licenses", async () => {
    const b = await m.upsertBuyer(db, "p@example.com");
    expect((await m.libraryFor(db, b.id)).length).toBe(2);
  });
});

describe("commissions", () => {
  it("are stored, validated and move through statuses", async () => {
    await expect(m.createCommission(db, { name: "X", email: "x@example.com", message: "short" })).rejects.toThrow();
    const c = await m.createCommission(db, {
      name: "Quartet",
      email: "q@example.com",
      forces: "brass quintet",
      message: "A fanfare for our 20th season.",
    });
    expect(c.status).toBe("new");
    await m.setCommissionStatus(db, c.id, "talking", "Replied");
    expect((await m.listCommissions(db))[0].status).toBe("talking");
  });
});

describe("newsletter", () => {
  it("counts a subscriber only after confirming, and stops on unsubscribe", async () => {
    const r = await m.subscribe(db, "News@Example.com");
    if (r.status !== "pending") throw new Error("expected pending");
    expect(await m.confirmedSubscribers(db)).toHaveLength(0);
    expect(await m.confirmSubscription(db, "wrong")).toBeNull();
    await m.confirmSubscription(db, r.token);
    expect((await m.confirmedSubscribers(db)).map((x) => x.email)).toEqual(["news@example.com"]);
    expect((await m.subscribe(db, "news@example.com")).status).toBe("already");
    await m.unsubscribe(db, r.token);
    expect(await m.confirmedSubscribers(db)).toHaveLength(0);
  });
});

describe("sales summary", () => {
  it("counts paid and refunded orders and sums revenue without fees", async () => {
    const r = await m.salesSummary(db);
    expect(r.refunded).toBe(1);
    expect(r.paid).toBeGreaterThanOrEqual(3);
    expect(r.revenueCents).toBeGreaterThan(0);
    expect(r.top.length).toBeGreaterThan(0);
  });
});
