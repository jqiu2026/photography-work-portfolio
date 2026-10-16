import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, describe, expect, it } from "vitest";
import type { Database } from "../src/client";
import * as gal from "../src/galleries";
import * as shop from "../src/gallery-shop";
import * as rep from "../src/reports";
import * as schema from "../src/schema";
import * as st from "../src/studio";

const here = path.dirname(fileURLToPath(import.meta.url));
let db: Database;
beforeAll(async () => {
  const d = drizzle(await PGlite.create(), { schema, casing: "snake_case" });
  await migrate(d, { migrationsFolder: path.join(here, "../drizzle") });
  db = d as unknown as Database;
});

describe("reports", () => {
  it("count money only when it was paid, split shop from other sales, and net out refunds", async () => {
    const c = await st.createClient(db, { name: "Rep Client", email: "rep@example.com" });
    const job = await st.createJob(db, { clientId: c.id, title: "Rep job" });
    const [m] = await db
      .insert(schema.media)
      .values({ filename: "r.jpg", mime: "image/jpeg", originalKey: "o/r", derivatives: [], bytes: 1 })
      .returning();
    const g = await st.createGallery(db, { jobId: job.id, passcode: "report-pass-1" });
    await gal.addItems(db, g.id, [m.id]);
    await st.publishGallery(db, g.id);
    await shop.saveShop(db, g.id, { enabled: true });
    const web = (await shop.listProducts(db)).find((p) => p.kind === "digital-web")!;
    const paid = await shop.placeOrder(db, {
      galleryId: g.id,
      lines: [{ productId: web.id, mediaId: m.id, qty: 1 }],
      buyer: { name: "Pay Er", email: "p@example.com" },
    });
    await shop.placeOrder(db, {
      galleryId: g.id,
      lines: [{ productId: web.id, mediaId: m.id, qty: 1 }],
      buyer: { name: "Left Behind", email: "l@example.com" },
    });
    const inv = (await st.invoiceByToken(db, paid.payToken))!;
    await st.recordPayment(db, {
      invoiceId: inv.id,
      provider: "mock",
      providerRef: "rep-1",
      amountCents: inv.totalCents,
      status: "succeeded",
      method: "mock",
    });
    await shop.markOrderPaid(db, inv.id);
    // an ordinary invoice paid too
    const other = await st.createInvoice(db, {
      jobId: job.id,
      lines: [{ description: "Session", amountCents: 20_000 }],
    });
    await st.sendInvoice(db, other.id);
    await st.recordPayment(db, {
      invoiceId: other.id,
      provider: "mock",
      providerRef: "rep-2",
      amountCents: 20_000,
      status: "succeeded",
      method: "mock",
    });
    await gal.logDownload(db, { galleryId: g.id, mediaId: m.id, kind: "rule:abc", viewer: "v", bytes: 1000 });
    await gal.logDownload(db, { galleryId: g.id, mediaId: m.id, kind: "web", viewer: "v", bytes: 500 });

    const range = rep.lastDays(7);
    const sales = await rep.salesReport(db, range);
    expect(sales.payments).toBe(2);
    expect(sales.shopCents).toBe(web.priceCents);
    expect(sales.totalCents).toBe(web.priceCents + 20_000);
    expect(sales.days).toHaveLength(1);

    const orders = await rep.ordersReport(db, range);
    expect(orders.map((o) => o.order.status).sort()).toEqual(
      ["fulfilled", "pending"]
        .sort()
        .map((x) => (x === "fulfilled" ? "paid" : x))
        .sort(),
    );
    const products = await rep.productsReport(db, range);
    expect(products).toEqual([{ name: web.name, kind: "digital-web", units: 1, cents: web.priceCents }]); // the unpaid order is not counted
    const files = await rep.orderFilesReport(db, range);
    expect(files.reduce((n, f) => n + f.n, 0)).toBe(2);
    expect(files.map((f) => f.kind).sort()).toEqual(["free rule", "web"]);
    const invs = await rep.invoicesReport(db, range);
    expect(invs.totals.find((t) => t.status === "paid")?.n).toBe(2);
    expect(rep.csv([["a", 'b"c']])).toBe('"a","b""c"');
    // nothing outside the range
    const old = rep.lastDays(1, new Date(Date.now() - 30 * 86_400_000));
    expect((await rep.salesReport(db, old)).payments).toBe(0);
  });
});
