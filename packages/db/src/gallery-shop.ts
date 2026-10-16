import { and, asc, desc, eq, inArray, isNull, like, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "./client";
import { StudioError } from "./errors";
import * as s from "./schema";
import { createInvoice, sendInvoice } from "./studio";
import { newToken, sha256Hex } from "./studio-crypto";

/**
 * A gallery's own address and its shop. Visitors who open /g/<slug> see the photographs, can buy downloads and prints,
 * and (if the studio allows) download free web-size copies. Proofing (favourites, ratings, approvals, comments) stays
 * with the client's passcode session: one named person, not every visitor.
 */

/* ---------- address ---------- */
const SLUG = /^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$/;
export const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
const RESERVED = new Set(["new", "admin", "studio", "client", "api", "shop", "order", "orders"]);

export async function freeSlug(db: Database, wanted: string, except?: string): Promise<string> {
  const base = slugify(wanted) || "gallery";
  for (let i = 0; i < 50; i++) {
    const cand = i === 0 ? base : `${base.slice(0, 36)}-${i + 1}`;
    if (RESERVED.has(cand) || !SLUG.test(cand)) continue;
    const [hit] = await db
      .select({ id: s.studioGalleries.id })
      .from(s.studioGalleries)
      .where(eq(s.studioGalleries.slug, cand));
    if (!hit || hit.id === except) return cand;
  }
  return `${base.slice(0, 30)}-${newToken()
    .token.slice(0, 6)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "x")}`;
}

export async function setLink(db: Database, galleryId: string, p: { slug?: string; visibility?: string }) {
  const set: Partial<typeof s.studioGalleries.$inferInsert> = { updatedAt: new Date() };
  if (p.slug !== undefined) {
    const slug = slugify(p.slug);
    if (!SLUG.test(slug) || RESERVED.has(slug))
      throw new StudioError("Use 3 to 48 letters, numbers and dashes for the address.");
    const [hit] = await db
      .select({ id: s.studioGalleries.id })
      .from(s.studioGalleries)
      .where(eq(s.studioGalleries.slug, slug));
    if (hit && hit.id !== galleryId) throw new StudioError("Another gallery already uses that address.");
    set.slug = slug;
  }
  if (p.visibility !== undefined) {
    if (!["passcode", "link"].includes(p.visibility)) throw new StudioError("Unknown visibility.");
    set.visibility = p.visibility;
  }
  await db.update(s.studioGalleries).set(set).where(eq(s.studioGalleries.id, galleryId));
}

/** A gallery by its address, only when it can be opened (published or archived, not deleted). */
export async function galleryBySlug(db: Database, slug: string) {
  if (!/^[a-z0-9-]{2,48}$/.test(slug)) return null;
  const [g] = await db
    .select()
    .from(s.studioGalleries)
    .where(and(eq(s.studioGalleries.slug, slug), isNull(s.studioGalleries.deletedAt)));
  return g && (g.status === "published" || g.status === "archived") && g.visibility !== "passcode" ? g : null;
}

/* ---------- settings ---------- */
export const shopSchema = z.object({
  /** Show the Shop to visitors. */
  enabled: z.boolean().default(false),
  /** List this gallery on the site's public Shop page (it must also be open to anyone with the link). */
  listed: z.boolean().default(false),
  /** Sell downloads (web size, full resolution, or the whole gallery). */
  sellDigital: z.boolean().default(true),
  sellPrints: z.boolean().default(true),
  /** What a visitor gets without paying: nothing, or web-size copies. */
  freeDownloads: z.enum(["none", "web"]).default("none"),
  /** Proofing (favourites, ratings, approvals) needs the client's passcode; visitors only view and buy. */
  proofing: z.boolean().default(true),
  /** A line shown at the top of the shop (turnaround, shipping notes). */
  note: z.string().trim().max(240).default(""),
  /** Where print orders ship from. Other countries are refused. */
  shipCountries: z.array(z.enum(["US", "CA", "MX"])).default(["US"]),
});
export type GalleryShop = z.infer<typeof shopSchema>;
export const readShop = (raw: unknown): GalleryShop => {
  const r = shopSchema.safeParse(raw ?? {});
  return r.success ? r.data : shopSchema.parse({});
};
export async function saveShop(db: Database, galleryId: string, patch: Record<string, unknown>) {
  const [g] = await db.select().from(s.studioGalleries).where(eq(s.studioGalleries.id, galleryId));
  if (!g) throw new StudioError("Unknown gallery.");
  const r = shopSchema.safeParse({ ...(g.shop as Record<string, unknown>), ...patch });
  if (!r.success) throw new StudioError(r.error.issues[0]?.message ?? "That setting is not valid.");
  await db
    .update(s.studioGalleries)
    .set({ shop: r.data, updatedAt: new Date() })
    .where(eq(s.studioGalleries.id, galleryId));
  return r.data;
}

/* ---------- price list ---------- */
export const DIGITAL_KINDS = ["digital-web", "digital-full", "digital-all"] as const;
export const PRINT_KINDS = ["print", "canvas", "album", "card"] as const;
/** The starting price list. Every price is a SAMPLE until the owner sets a real one. Print SKUs match @jerryqiu/prints' mock lab. */
const STARTER: Omit<typeof s.studioProducts.$inferInsert, "id">[] = [
  {
    kind: "digital-web",
    name: "Web-size download",
    description: "2048 px on the long side, for screens and sharing.",
    priceCents: 500,
    sort: 0,
  },
  {
    kind: "digital-full",
    name: "Full-resolution download",
    description: "The original file, for printing anywhere.",
    priceCents: 1500,
    sort: 1,
  },
  {
    kind: "digital-all",
    name: "Whole gallery, full resolution",
    description: "Every photograph in this gallery as ZIP parts.",
    priceCents: 12000,
    sort: 2,
  },
  { kind: "print", sku: "MOCK-PRINT-4X6", name: "Print 4 × 6 in", priceCents: 300, sort: 10 },
  { kind: "print", sku: "MOCK-PRINT-8X10", name: "Print 8 × 10 in", priceCents: 1400, sort: 11 },
  { kind: "print", sku: "MOCK-PRINT-11X14", name: "Print 11 × 14 in", priceCents: 2800, sort: 12 },
  { kind: "canvas", sku: "MOCK-CANVAS-16X20", name: "Canvas 16 × 20 in", priceCents: 8900, sort: 20 },
  { kind: "card", sku: "MOCK-CARD-5X7", name: "Flat card 5 × 7 in", priceCents: 500, sort: 30 },
  { kind: "album", sku: "MOCK-ALBUM-8X8", name: "Album 8 × 8 in, 20 pages", priceCents: 24000, sort: 40 },
];
export async function listProducts(db: Database, opts: { activeOnly?: boolean } = {}) {
  let rows = await db
    .select()
    .from(s.studioProducts)
    .where(isNull(s.studioProducts.deletedAt))
    .orderBy(asc(s.studioProducts.sort));
  if (!rows.length) {
    await db.insert(s.studioProducts).values(STARTER);
    rows = await db
      .select()
      .from(s.studioProducts)
      .where(isNull(s.studioProducts.deletedAt))
      .orderBy(asc(s.studioProducts.sort));
  }
  return opts.activeOnly ? rows.filter((r) => r.active) : rows;
}
export async function saveProduct(
  db: Database,
  id: string,
  p: { name?: string; description?: string; priceCents?: number; active?: boolean },
) {
  const set: Partial<typeof s.studioProducts.$inferInsert> = { updatedAt: new Date() };
  if (p.name !== undefined) {
    if (p.name.trim().length < 2) throw new StudioError("Name the product.");
    set.name = p.name.trim().slice(0, 80);
  }
  if (p.description !== undefined) set.description = p.description.trim().slice(0, 200) || null;
  if (p.priceCents !== undefined) {
    if (!Number.isInteger(p.priceCents) || p.priceCents < 50 || p.priceCents > 5_000_000)
      throw new StudioError("A price is between $0.50 and $50,000.");
    set.priceCents = p.priceCents;
    set.sample = false;
  }
  if (p.active !== undefined) set.active = p.active;
  await db.update(s.studioProducts).set(set).where(eq(s.studioProducts.id, id));
}

/* ---------- orders ---------- */
export type CartLine = { productId: string; mediaId?: string | null; qty: number };
export type Buyer = { name: string; email: string };
export type ShipTo = {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SHIPPING_FLAT_CENTS = 800; // SAMPLE rate, matching the mock lab; the real lab quote replaces it when keys are set
const SHIPPING_EXTRA_CENTS = 200;
export const shippingFor = (printQty: number) =>
  printQty ? SHIPPING_FLAT_CENTS + SHIPPING_EXTRA_CENTS * (printQty - 1) : 0;

async function nextOrderNumber(db: Database, now: Date) {
  const year = now.getUTCFullYear();
  const rows = await db
    .select({ n: s.studioOrders.number })
    .from(s.studioOrders)
    .where(like(s.studioOrders.number, `S-${year}-%`));
  const max = rows.reduce((m, r) => Math.max(m, Number(r.n.split("-")[2]) || 0), 0);
  return `S-${year}-${String(max + 1).padStart(4, "0")}`;
}

/**
 * Turns a cart into an order and an invoice to pay. Prices come from the price list, never from the browser. Photographs
 * must be in this gallery and visible. Nothing is sent to a print lab until the invoice is paid.
 */
export async function placeOrder(
  db: Database,
  input: { galleryId: string; lines: CartLine[]; buyer: Buyer; ship?: ShipTo | null },
  now = new Date(),
) {
  const name = input.buyer.name.trim();
  const email = input.buyer.email.trim().toLowerCase();
  if (name.length < 2) throw new StudioError("Enter your name.");
  if (!EMAIL.test(email)) throw new StudioError("Enter a valid email address.");
  if (!input.lines.length || input.lines.length > 60) throw new StudioError("Your cart is empty.");
  const [g] = await db.select().from(s.studioGalleries).where(eq(s.studioGalleries.id, input.galleryId));
  if (!g) throw new StudioError("Unknown gallery.");
  const shop = readShop(g.shop);
  if (!shop.enabled) throw new StudioError("This gallery's shop is closed.");
  const products = new Map((await listProducts(db, { activeOnly: true })).map((p) => [p.id, p]));
  const items = await db
    .select({ mediaId: s.studioGalleryItems.mediaId })
    .from(s.studioGalleryItems)
    .where(and(eq(s.studioGalleryItems.galleryId, g.id), eq(s.studioGalleryItems.hidden, false)));
  const inGallery = new Set(items.map((i) => i.mediaId));

  const rows: { product: s.StudioProduct; mediaId: string | null; qty: number }[] = [];
  for (const l of input.lines) {
    const product = products.get(l.productId);
    if (!product) throw new StudioError("One of the products is no longer for sale.");
    const isDigital = (DIGITAL_KINDS as readonly string[]).includes(product.kind);
    if (isDigital && !shop.sellDigital) throw new StudioError("Downloads are not for sale in this gallery.");
    if (!isDigital && !shop.sellPrints) throw new StudioError("Prints are not for sale in this gallery.");
    const qty = Math.floor(l.qty);
    if (!(qty >= 1 && qty <= 50)) throw new StudioError("Quantities are 1 to 50.");
    const needsPhoto = product.kind !== "digital-all";
    if (needsPhoto && (!l.mediaId || !inGallery.has(l.mediaId)))
      throw new StudioError("That photograph is not in this gallery.");
    rows.push({ product, mediaId: needsPhoto ? (l.mediaId ?? null) : null, qty: isDigital ? 1 : qty });
  }
  // the same photograph in the same download size twice is one purchase
  const seen = new Set<string>();
  const lines = rows.filter((r) => {
    if (!(DIGITAL_KINDS as readonly string[]).includes(r.product.kind)) return true;
    const k = `${r.product.id}:${r.mediaId}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  const printQty = lines
    .filter((r) => (PRINT_KINDS as readonly string[]).includes(r.product.kind))
    .reduce((n, r) => n + r.qty, 0);
  if (printQty) {
    const a = input.ship;
    if (!a || !a.line1?.trim() || !a.city?.trim() || !a.region?.trim() || !a.postalCode?.trim())
      throw new StudioError("Enter a shipping address for the prints.");
    if (!(shop.shipCountries as string[]).includes(a.country))
      throw new StudioError("Prints do not ship to that country from this shop.");
    if (/^\s*(p\.?\s*o\.?\s*box|post office box)/i.test(a.line1))
      throw new StudioError("The print lab cannot ship to a PO box.");
  }
  const subtotal = lines.reduce((n, r) => n + r.product.priceCents * r.qty, 0);
  const shipping = shippingFor(printQty);
  const [job] = await db.select().from(s.studioJobs).where(eq(s.studioJobs.id, g.jobId));
  if (!job) throw new StudioError("This gallery has no job.");

  const invoiceLines: s.InvoiceLine[] = lines.map((r) => ({
    description: `${r.product.name}${r.qty > 1 ? ` × ${r.qty}` : ""}${r.mediaId ? " (photo)" : ""}`,
    amountCents: r.product.priceCents * r.qty,
  }));
  if (shipping) invoiceLines.push({ description: "Shipping (SAMPLE rate)", amountCents: shipping });
  const inv = await createInvoice(db, { jobId: job.id, lines: invoiceLines }, "shop", now);
  await db.update(s.studioInvoices).set({ kind: "shop", galleryId: null }).where(eq(s.studioInvoices.id, inv.id));
  const { token: payToken } = await sendInvoice(db, inv.id, now);

  const { token: orderToken, hash } = newToken();
  const [order] = await db
    .insert(s.studioOrders)
    .values({
      number: await nextOrderNumber(db, now),
      galleryId: g.id,
      invoiceId: inv.id,
      buyerName: name,
      buyerEmail: email,
      ship: printQty && input.ship ? { ...input.ship } : null,
      subtotalCents: subtotal,
      shippingCents: shipping,
      totalCents: subtotal + shipping,
      tokenHash: hash,
    })
    .returning();
  await db.insert(s.studioOrderItems).values(
    lines.map((r) => ({
      orderId: order.id,
      productId: r.product.id,
      kind: r.product.kind,
      name: r.product.name,
      sku: r.product.sku,
      mediaId: r.mediaId,
      qty: r.qty,
      unitCents: r.product.priceCents,
    })),
  );
  return { order, payToken, orderToken };
}

export async function orderByToken(db: Database, token: string) {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const [o] = await db
    .select()
    .from(s.studioOrders)
    .where(eq(s.studioOrders.tokenHash, sha256Hex(token)));
  return o ?? null;
}
export async function orderItems(db: Database, orderId: string) {
  return db.select().from(s.studioOrderItems).where(eq(s.studioOrderItems.orderId, orderId));
}
export async function orderForInvoice(db: Database, invoiceId: string) {
  const [o] = await db.select().from(s.studioOrders).where(eq(s.studioOrders.invoiceId, invoiceId));
  return o ?? null;
}

/** Paid: the order moves to "paid" (once) and the items are returned so the caller can email links and send prints. */
export async function markOrderPaid(db: Database, invoiceId: string, now = new Date()) {
  const o = await orderForInvoice(db, invoiceId);
  if (!o) return null;
  const [inv] = await db.select().from(s.studioInvoices).where(eq(s.studioInvoices.id, invoiceId));
  if (!inv || inv.status !== "paid") return { order: o, items: [], first: false };
  const first = o.status === "pending";
  if (first) await db.update(s.studioOrders).set({ status: "paid", paidAt: now }).where(eq(s.studioOrders.id, o.id));
  return { order: { ...o, status: first ? "paid" : o.status }, items: await orderItems(db, o.id), first };
}
export async function setLabOrder(db: Database, orderId: string, labOrderId: string) {
  await db.update(s.studioOrders).set({ labOrderId, status: "fulfilled" }).where(eq(s.studioOrders.id, orderId));
}
/** Digital-only orders are complete as soon as they are paid. */
export async function markFulfilled(db: Database, orderId: string) {
  await db.update(s.studioOrders).set({ status: "fulfilled" }).where(eq(s.studioOrders.id, orderId));
}
export async function cancelOrder(db: Database, orderId: string) {
  const [o] = await db.select().from(s.studioOrders).where(eq(s.studioOrders.id, orderId));
  if (!o) throw new StudioError("Unknown order.");
  if (o.status !== "pending")
    throw new StudioError("Only an unpaid order can be cancelled here; refund a paid one from Billing.");
  await db.update(s.studioOrders).set({ status: "cancelled" }).where(eq(s.studioOrders.id, orderId));
  if (o.invoiceId)
    await db
      .update(s.studioInvoices)
      .set({ status: "void", updatedAt: new Date() })
      .where(eq(s.studioInvoices.id, o.invoiceId));
}
export async function listOrders(db: Database, galleryId?: string) {
  const rows = await db
    .select({ order: s.studioOrders, gallery: s.studioGalleries })
    .from(s.studioOrders)
    .innerJoin(s.studioGalleries, eq(s.studioGalleries.id, s.studioOrders.galleryId))
    .where(galleryId ? eq(s.studioOrders.galleryId, galleryId) : sql`true`)
    .orderBy(desc(s.studioOrders.createdAt));
  const ids = rows.map((r) => r.order.id);
  const items = ids.length
    ? await db.select().from(s.studioOrderItems).where(inArray(s.studioOrderItems.orderId, ids))
    : [];
  return rows.map((r) => ({ ...r, items: items.filter((i) => i.orderId === r.order.id) }));
}
/** The downloads a paid order unlocks: [{ mediaId, size }] or { all: true }. */
export function entitlements(items: s.StudioOrderItem[]) {
  const all = items.some((i) => i.kind === "digital-all");
  const per = items
    .filter((i) => (i.kind === "digital-web" || i.kind === "digital-full") && i.mediaId)
    .map((i) => ({
      mediaId: i.mediaId as string,
      size: i.kind === "digital-full" ? ("full" as const) : ("web" as const),
    }));
  return { all, per };
}
/** Pending orders older than `afterHours` that have not had a reminder (abandoned carts), oldest first. */
export async function abandonedOrders(db: Database, now = new Date(), afterHours = 24) {
  const cutoff = new Date(now.getTime() - afterHours * 3600_000);
  return db
    .select()
    .from(s.studioOrders)
    .where(
      and(
        eq(s.studioOrders.status, "pending"),
        isNull(s.studioOrders.reminderAt),
        sql`${s.studioOrders.createdAt} < ${cutoff}`,
      ),
    );
}
export async function markReminded(db: Database, orderId: string, now = new Date()) {
  await db.update(s.studioOrders).set({ reminderAt: now }).where(eq(s.studioOrders.id, orderId));
}

/** Galleries the owner chose to list on the public Shop page: open by link, shop open, published. */
export async function listedGalleries(db: Database) {
  const rows = await db
    .select()
    .from(s.studioGalleries)
    .where(
      and(
        eq(s.studioGalleries.visibility, "link"),
        eq(s.studioGalleries.status, "published"),
        isNull(s.studioGalleries.deletedAt),
      ),
    )
    .orderBy(desc(s.studioGalleries.updatedAt));
  return rows
    .filter((g) => g.slug && readShop(g.shop).enabled && readShop(g.shop).listed)
    .map((g) => ({ id: g.id, title: g.title, slug: g.slug as string, welcome: g.welcome ?? "" }));
}
