import "server-only";
import { type Database, schema } from "@jerryqiu/db";
import * as shop from "@jerryqiu/db/gallery-shop";
import { PRINT_KINDS, type CatalogProduct, printProviderFromEnv, retailCents } from "@jerryqiu/prints";
import { and, eq, isNull } from "drizzle-orm";

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

let inFlight: Promise<number> | null = null;
let lastSync = 0;
/**
 * Makes sure the lab's products are on the price sheet every gallery sells from, so prints are part of every gallery's
 * shop. At most one sync runs at a time and it is repeated at most every ten minutes per server process.
 */
export async function ensurePrintCatalog(db: Database): Promise<number> {
  if (inFlight) return inFlight;
  if (Date.now() - lastSync < 10 * 60 * 1000) return 0;
  inFlight = syncPrintCatalog(db)
    .catch((error) => {
      console.error("[prints] the lab catalog could not be added to the price sheet", error);
      return 0;
    })
    .finally(() => {
      lastSync = Date.now();
      inFlight = null;
    });
  return inFlight;
}
