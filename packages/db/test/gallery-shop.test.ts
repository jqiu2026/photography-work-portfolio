import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, describe, expect, it } from "vitest";
import type { Database } from "../src/client";
import * as gal from "../src/galleries";
import * as shop from "../src/gallery-shop";
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
  const c = await st.createClient(db, { name: "Shop Client", email: "shop@example.com" });
  const job = await st.createJob(db, { clientId: c.id, title: "Shop job" });
  const rows = await db
    .insert(schema.media)
    .values(
      Array.from({ length: 4 }, (_, i) => ({
        filename: `s${i}.jpg`,
        mime: "image/jpeg",
        originalKey: `o/${i}`,
        derivatives: [],
      })),
    )
    .returning();
  media = rows.map((r) => r.id);
  const g = await st.createGallery(db, { jobId: job.id, passcode: "shop-pass-12" });
  gid = g.id;
  await gal.addItems(db, gid, media);
  await st.publishGallery(db, gid);
});

describe("albums", () => {
  it("nest one level, lock with a passcode, and move up when deleted", async () => {
    const parent = await gal.createAlbum(db, gid, "Ceremony");
    const child = await gal.createAlbum(db, gid, "Vows", parent.id);
    expect(child.parentId).toBe(parent.id);
    await expect(gal.createAlbum(db, gid, "Too deep", child.id)).rejects.toThrow(/one level/);
    await expect(gal.updateAlbum(db, gid, parent.id, { parentId: child.id })).rejects.toThrow();
    await gal.moveToAlbum(db, gid, [media[0]], child.id);
    await gal.updateAlbum(db, gid, child.id, { passcode: "vows-only" });
    const [locked] = (await gal.listAlbums(db, gid)).filter((a) => a.id === child.id);
    expect(locked.passcodeHash).toBeTruthy();
    expect(await gal.checkAlbumPasscode(locked, "VOWS-only")).toBe(true);
    expect(await gal.checkAlbumPasscode(locked, "nope")).toBe(false);
    await expect(gal.updateAlbum(db, gid, child.id, { passcode: "ab" })).rejects.toThrow(/4 characters/);
    await gal.deleteAlbum(db, gid, child.id);
    const items = await gal.galleryContents(db, gid);
    expect(items.find((i) => i.media.id === media[0])?.item.albumId).toBe(parent.id);
    await gal.deleteAlbum(db, gid, parent.id);
    expect((await gal.listAlbums(db, gid)).length).toBe(0);
  });
});

describe("gallery address", () => {
  it("makes unique slugs, refuses reserved and taken ones, and opens only visible galleries", async () => {
    expect(shop.slugify("Maker Faire — Coney Island 2025!")).toBe("maker-faire-coney-island-2025");
    const a = await shop.freeSlug(db, "Spring Recital");
    await shop.setLink(db, gid, { slug: a, visibility: "link" });
    expect(await shop.freeSlug(db, "Spring Recital")).toBe(`${a}-2`);
    await expect(shop.setLink(db, gid, { slug: "studio" })).rejects.toThrow();
    await expect(shop.setLink(db, gid, { visibility: "everyone" })).rejects.toThrow();
    expect((await shop.galleryBySlug(db, a))?.id).toBe(gid);
    await shop.setLink(db, gid, { visibility: "passcode" });
    expect(await shop.galleryBySlug(db, a)).toBeNull();
    await shop.setLink(db, gid, { visibility: "link" });
    expect(await shop.galleryBySlug(db, "../x")).toBeNull();
  });
});

describe("shop", () => {
  it("seeds a SAMPLE price list and takes real prices", async () => {
    const list = await shop.listProducts(db);
    expect(list.length).toBeGreaterThan(5);
    expect(list.every((p) => p.sample)).toBe(true);
    await shop.saveProduct(db, list[0].id, { priceCents: 700 });
    await expect(shop.saveProduct(db, list[0].id, { priceCents: 5 })).rejects.toThrow();
    const again = (await shop.listProducts(db)).find((p) => p.id === list[0].id);
    expect(again).toMatchObject({ priceCents: 700, sample: false });
  });

  it("refuses orders while the shop is closed, then prices the cart from the list, never the browser", async () => {
    const products = await shop.listProducts(db);
    const web = products.find((p) => p.kind === "digital-web");
    const print = products.find((p) => p.sku === "MOCK-PRINT-8X10");
    expect(web && print).toBeTruthy();
    const buyer = { name: "Ada Visitor", email: "ada@example.com" };
    await expect(
      shop.placeOrder(db, { galleryId: gid, lines: [{ productId: web!.id, mediaId: media[0], qty: 1 }], buyer }),
    ).rejects.toThrow(/closed/);
    await shop.saveShop(db, gid, { enabled: true });
    await expect(shop.placeOrder(db, { galleryId: gid, lines: [], buyer })).rejects.toThrow(/empty/);
    await expect(
      shop.placeOrder(db, {
        galleryId: gid,
        lines: [{ productId: web!.id, mediaId: media[0], qty: 1 }],
        buyer: { ...buyer, email: "nope" },
      }),
    ).rejects.toThrow(/email/);
    await expect(
      shop.placeOrder(db, {
        galleryId: gid,
        lines: [{ productId: web!.id, mediaId: crypto.randomUUID(), qty: 1 }],
        buyer,
      }),
    ).rejects.toThrow(/not in this gallery/);
    await expect(
      shop.placeOrder(db, { galleryId: gid, lines: [{ productId: print!.id, mediaId: media[1], qty: 1 }], buyer }),
    ).rejects.toThrow(/shipping address/);

    const ship = {
      name: "Ada",
      line1: "1 Main St",
      city: "New York",
      region: "NY",
      postalCode: "10001",
      country: "US",
    };
    const r = await shop.placeOrder(db, {
      galleryId: gid,
      lines: [
        { productId: web!.id, mediaId: media[0], qty: 3 },
        { productId: web!.id, mediaId: media[0], qty: 1 },
        { productId: print!.id, mediaId: media[1], qty: 2 },
      ],
      buyer,
      ship,
    });
    const items = await shop.orderItems(db, r.order.id);
    expect(items).toHaveLength(2); // the repeated download is one purchase
    expect(r.order.subtotalCents).toBe(700 + 1400 * 2);
    expect(r.order.shippingCents).toBe(shop.shippingFor(2));
    expect(r.order.totalCents).toBe(r.order.subtotalCents + r.order.shippingCents);
    expect(r.order.status).toBe("pending");
    expect((await shop.orderByToken(db, r.orderToken))?.id).toBe(r.order.id);
    expect(await shop.orderByToken(db, "short")).toBeNull();

    // the invoice carries the same total and is paid through the one billing path
    const inv = await st.invoiceByToken(db, r.payToken);
    expect(inv?.totalCents).toBe(r.order.totalCents);
    expect(inv?.kind).toBe("shop");
    expect((await shop.markOrderPaid(db, inv!.id))?.first).toBe(false); // unpaid: nothing happens
    await st.recordPayment(db, {
      invoiceId: inv!.id,
      provider: "mock",
      providerRef: "m-1",
      amountCents: inv!.totalCents,
      status: "succeeded",
      method: "mock",
    });
    const paid = await shop.markOrderPaid(db, inv!.id);
    expect(paid?.first).toBe(true);
    expect((await shop.markOrderPaid(db, inv!.id))?.first).toBe(false); // once
    const ent = shop.entitlements(paid!.items);
    expect(ent.per).toEqual([{ mediaId: media[0], size: "web" }]);
    expect(ent.all).toBe(false);
  });

  it("cancels unpaid orders only, and finds abandoned carts once", async () => {
    const web = (await shop.listProducts(db)).find((p) => p.kind === "digital-full")!;
    const r = await shop.placeOrder(db, {
      galleryId: gid,
      lines: [{ productId: web.id, mediaId: media[2], qty: 1 }],
      buyer: { name: "Bo Buyer", email: "bo@example.com" },
    });
    expect(await shop.abandonedOrders(db)).toHaveLength(0); // too fresh
    const later = new Date(Date.now() + 30 * 3600_000);
    const stale = await shop.abandonedOrders(db, later);
    expect(stale.map((o) => o.id)).toContain(r.order.id);
    await shop.markReminded(db, r.order.id);
    expect((await shop.abandonedOrders(db, later)).map((o) => o.id)).not.toContain(r.order.id);
    await shop.cancelOrder(db, r.order.id);
    await expect(shop.cancelOrder(db, r.order.id)).rejects.toThrow(/unpaid/);
    const inv = await db.query.studioInvoices.findFirst({ where: (t, { eq }) => eq(t.id, r.order.invoiceId!) });
    expect(inv?.status).toBe("void");
  });
});
