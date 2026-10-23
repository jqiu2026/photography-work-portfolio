import "server-only";
import { type Database, schema } from "@jerryqiu/db";
import * as shop from "@jerryqiu/db/gallery-shop";
import * as st from "@jerryqiu/db/studio";
import { PRINT_KINDS, type CatalogProduct, printProviderFromEnv, retailCents } from "@jerryqiu/prints";
import { and, eq, inArray, isNull } from "drizzle-orm";

/** The lab's catalog: WHCC when its credentials exist, otherwise the labelled sample catalog shaped like WHCC's lines. */
export async function labCatalog(): Promise<{ products: CatalogProduct[]; provider: "whcc" | "mock" | "none" }> {
  const p = printProviderFromEnv();
  if (!p) return { products: [], provider: "none" };
  return { products: await p.catalog(), provider: p.name };
}

/** The marketing names of the lines, in the order the store lists them. */
export const LINES: { kind: string; title: string; blurb: string }[] = [
  { kind: "print", title: "Photo prints", blurb: "Lustre paper, color-managed, from wallet size to 20 x 30 in." },
  { kind: "mounted", title: "Mounted prints", blurb: "A print mounted on rigid board, ready to lean or hang." },
  { kind: "framed", title: "Framed prints", blurb: "Printed, matted and framed, ready for the wall." },
  {
    kind: "canvas",
    title: "Canvas gallery wraps",
    blurb: "Stretched canvas with the picture wrapped around the edges.",
  },
  { kind: "metal", title: "Metal prints", blurb: "Printed into aluminum: vivid, durable, no glass." },
  { kind: "card", title: "Cards", blurb: "Flat and folded cards with your photograph." },
  { kind: "album", title: "Albums", blurb: "Layflat albums of a session or a day." },
];

/**
 * Adds every product of the lab's catalog that the default price sheet does not have yet, at a SAMPLE price (the
 * lab's wholesale plus a 200% markup, rounded to 50 cents). Existing products and prices are never touched, so the
 * owner's own prices stay. Returns how many were added.
 */
export async function syncPrintCatalog(db: Database): Promise<number> {
  const { products } = await labCatalog();
  if (!products.length) return 0;
  const sheet = await shop.defaultSheet(db);
  await shop.listProducts(db); // makes sure the starter list exists first
  const have = new Set(
    (
      await db
        .select({ sku: schema.studioProducts.sku })
        .from(schema.studioProducts)
        .where(and(isNull(schema.studioProducts.deletedAt), eq(schema.studioProducts.sheetId, sheet.id)))
    ).map((r) => r.sku),
  );
  const rank = (k: string) => PRINT_KINDS.indexOf(k as never);
  const missing = products.filter((p) => !have.has(p.sku));
  if (!missing.length) return 0;
  await db.insert(schema.studioProducts).values(
    missing.map((p) => ({
      kind: p.kind,
      sku: p.sku,
      name: p.name.replace(" (SAMPLE)", "").replace(/ x /g, " × "),
      priceCents: retailCents(p.wholesaleCents, 200),
      sample: true,
      sort: 10 + rank(p.kind) * 10 + Math.min(9, Math.floor((p.widthIn * p.heightIn) / 100)),
      sheetId: sheet.id,
    })),
  );
  return missing.length;
}

/**
 * The portfolio print store: one hidden-from-lists gallery at /g/prints that holds every portfolio photograph and sells
 * prints only, so a visitor can order a print of anything in the portfolio with the same cart, payment and lab flow as
 * a client gallery. Made once; later calls add portfolio photographs that are not in it yet.
 */
export async function ensurePortfolioStore(db: Database): Promise<{ id: string; slug: string } | null> {
  const portfolio = await db
    .select({ mediaId: schema.galleryItems.mediaId })
    .from(schema.galleryItems)
    .innerJoin(schema.galleries, eq(schema.galleries.id, schema.galleryItems.galleryId))
    .where(and(eq(schema.galleries.site, "photos"), isNull(schema.galleries.deletedAt)));
  const wanted = [...new Set(portfolio.map((r) => r.mediaId).filter((x): x is string => Boolean(x)))];
  let [g] = await db
    .select()
    .from(schema.studioGalleries)
    .where(and(eq(schema.studioGalleries.slug, "prints"), isNull(schema.studioGalleries.deletedAt)));
  if (!g) {
    if (!wanted.length) return null;
    const [existing] = await db
      .select()
      .from(schema.studioClients)
      .where(eq(schema.studioClients.email, "store@portfolio.invalid"));
    const client =
      existing ?? (await st.createClient(db, { name: "Portfolio print store", email: "store@portfolio.invalid" }));
    const job = await st.createJob(db, { clientId: client.id, title: "Portfolio print store", type: "other" });
    const created = await st.createGallery(db, {
      jobId: job.id,
      title: "Print store",
      passcode: `store-${crypto.randomUUID().slice(0, 12)}`,
      mediaIds: wanted,
    });
    await shop.setLink(db, created.id, { slug: "prints", visibility: "link" });
    await shop.saveShop(db, created.id, {
      enabled: true,
      listed: false,
      sellDigital: false,
      sellPrints: true,
      proofing: false,
      note: "Prints of photographs from the portfolio, made by a professional lab and shipped to you.",
    });
    await st.publishGallery(db, created.id);
    [g] = await db.select().from(schema.studioGalleries).where(eq(schema.studioGalleries.id, created.id));
  } else if (wanted.length) {
    const have = new Set(
      (
        await db
          .select({ m: schema.studioGalleryItems.mediaId })
          .from(schema.studioGalleryItems)
          .where(eq(schema.studioGalleryItems.galleryId, g.id))
      ).map((r) => r.m),
    );
    const add = wanted.filter((m) => !have.has(m));
    if (add.length)
      await db
        .insert(schema.studioGalleryItems)
        .values(add.map((mediaId, i) => ({ galleryId: g!.id, mediaId, sort: 1000 + i })));
  }
  void inArray;
  return g ? { id: g.id, slug: g.slug ?? "prints" } : null;
}
