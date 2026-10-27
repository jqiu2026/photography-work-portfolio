import { type LicenseTier, type RightsType, canSell, licenseNumber, orderTotals } from "@jerryqiu/scores";
import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "./client";
import { StudioError } from "./errors";
import { slugify } from "./gallery-link";
import * as s from "./schema";
import { newToken, sha256Hex } from "./studio-crypto";

/**
 * Music: the catalog, the score store, buyers, licenses, commissions and the newsletter (apps/music).
 * Rights come first: a piece is only for sale when `canSell` says so, and that is checked again when an order is made.
 */

type Work = typeof s.musicWorks.$inferSelect;
const live = isNull(s.musicWorks.deletedAt);

/* ---------- catalog ---------- */
export const workSchema = z.object({
  title: z.string().trim().min(1).max(160),
  slug: z.string().trim().max(80).optional(),
  year: z.number().int().min(1000).max(2200).nullable().optional(),
  forces: z.string().trim().max(200).nullable().optional(),
  instruments: z.array(z.string().trim().toLowerCase().min(1).max(40)).max(24).default([]),
  genre: z.string().trim().max(60).nullable().optional(),
  difficulty: z.enum(["easy", "medium", "advanced"]).nullable().optional(),
  durationSec: z.number().int().min(0).max(36000).nullable().optional(),
  summary: z.string().trim().max(400).nullable().optional(),
  programNote: z.string().trim().max(6000).nullable().optional(),
  rightsType: z.enum(["original", "public-domain-arrangement", "arrangement-copyrighted"]).default("original"),
  licenseOnFile: z.boolean().default(false),
  licenseNote: z.string().trim().max(400).nullable().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
  featured: z.boolean().default(false),
});
export type WorkInput = z.input<typeof workSchema>;

async function freeWorkSlug(db: Database, wanted: string, except?: string) {
  const base = slugify(wanted) || "piece";
  for (let i = 0; i < 200; i++) {
    const slug = i === 0 ? base : `${base}-${i + 1}`;
    const [hit] = await db.select({ id: s.musicWorks.id }).from(s.musicWorks).where(eq(s.musicWorks.slug, slug));
    if (!hit || hit.id === except) return slug;
  }
  throw new StudioError("Could not find a free address for this piece.");
}

export async function saveWork(db: Database, input: WorkInput, id?: string): Promise<Work> {
  const v = workSchema.parse(input);
  const slug = await freeWorkSlug(db, v.slug || v.title, id);
  const row = {
    slug,
    title: v.title,
    year: v.year ?? null,
    forces: v.forces ?? null,
    instruments: v.instruments,
    genre: v.genre ?? null,
    difficulty: v.difficulty ?? null,
    durationSec: v.durationSec ?? null,
    summary: v.summary ?? null,
    programNote: v.programNote ?? null,
    rightsType: v.rightsType,
    licenseOnFile: v.licenseOnFile,
    licenseNote: v.licenseNote ?? null,
    status: v.status,
    featured: v.featured,
    updatedAt: new Date(),
  };
  if (id) {
    const [w] = await db.update(s.musicWorks).set(row).where(eq(s.musicWorks.id, id)).returning();
    if (!w) throw new StudioError("That piece no longer exists.");
    return w;
  }
  const [w] = await db.insert(s.musicWorks).values(row).returning();
  return w;
}

export async function deleteWork(db: Database, id: string) {
  await db.update(s.musicWorks).set({ deletedAt: new Date(), status: "draft" }).where(eq(s.musicWorks.id, id));
  await db.update(s.musicProducts).set({ active: false }).where(eq(s.musicProducts.workId, id));
}

export type CatalogFilter = {
  q?: string;
  instrument?: string;
  genre?: string;
  difficulty?: string;
  forSale?: boolean;
  listenable?: boolean;
};

export type CatalogEntry = Work & {
  fromCents: number | null;
  forSale: boolean;
  recordingCount: number;
};

/** Published pieces with their cheapest price and whether a recording exists, filtered. Drafts are never returned. */
export async function listCatalog(db: Database, f: CatalogFilter = {}): Promise<CatalogEntry[]> {
  const works = await db
    .select()
    .from(s.musicWorks)
    .where(and(live, eq(s.musicWorks.status, "published")))
    .orderBy(desc(s.musicWorks.featured), asc(s.musicWorks.sort), desc(s.musicWorks.year), asc(s.musicWorks.title));
  if (!works.length) return [];
  const ids = works.map((w) => w.id);
  const products = await db
    .select()
    .from(s.musicProducts)
    .where(
      and(inArray(s.musicProducts.workId, ids), eq(s.musicProducts.active, true), isNull(s.musicProducts.deletedAt)),
    );
  const recs = await db
    .select({ workId: s.musicItems.workId, n: sql<number>`count(*)::int` })
    .from(s.musicItems)
    .where(
      and(
        inArray(s.musicItems.workId, ids),
        eq(s.musicItems.kind, "recording"),
        eq(s.musicItems.visible, true),
        isNull(s.musicItems.deletedAt),
      ),
    )
    .groupBy(s.musicItems.workId);
  const recCount = new Map(recs.map((r) => [r.workId, r.n]));
  const entries = works.map((w): CatalogEntry => {
    const sellable = canSell({ status: w.status, rightsType: w.rightsType, licenseOnFile: w.licenseOnFile }).ok;
    const prices = products.filter((p) => p.workId === w.id).map((p) => p.priceCents);
    return {
      ...w,
      fromCents: sellable && prices.length ? Math.min(...prices) : null,
      forSale: sellable && prices.length > 0,
      recordingCount: recCount.get(w.id) ?? 0,
    };
  });
  const q = f.q?.trim().toLowerCase();
  return entries.filter(
    (e) =>
      (!q || [e.title, e.forces, e.genre, e.summary, ...e.instruments].some((x) => x?.toLowerCase().includes(q))) &&
      (!f.instrument || e.instruments.includes(f.instrument.toLowerCase())) &&
      (!f.genre || e.genre?.toLowerCase() === f.genre.toLowerCase()) &&
      (!f.difficulty || e.difficulty === f.difficulty) &&
      (!f.forSale || e.forSale) &&
      (!f.listenable || e.recordingCount > 0),
  );
}

/** The values the filters offer, from published pieces only. */
export function catalogFacets(entries: CatalogEntry[]) {
  const uniq = (xs: (string | null | undefined)[]) =>
    [...new Set(xs.filter((x): x is string => !!x))].sort((a, b) => a.localeCompare(b));
  return {
    instruments: uniq(entries.flatMap((e) => e.instruments)),
    genres: uniq(entries.map((e) => e.genre)),
    difficulties: uniq(entries.map((e) => e.difficulty)),
  };
}

export async function getWorkPage(db: Database, slug: string) {
  const [work] = await db
    .select()
    .from(s.musicWorks)
    .where(and(eq(s.musicWorks.slug, slug), live, eq(s.musicWorks.status, "published")));
  if (!work) return null;
  const [files, products, items] = await Promise.all([
    db
      .select()
      .from(s.musicScoreFiles)
      .where(and(eq(s.musicScoreFiles.workId, work.id), isNull(s.musicScoreFiles.deletedAt)))
      .orderBy(asc(s.musicScoreFiles.sort)),
    db
      .select()
      .from(s.musicProducts)
      .where(
        and(eq(s.musicProducts.workId, work.id), eq(s.musicProducts.active, true), isNull(s.musicProducts.deletedAt)),
      )
      .orderBy(asc(s.musicProducts.priceCents)),
    db
      .select()
      .from(s.musicItems)
      .where(and(eq(s.musicItems.workId, work.id), eq(s.musicItems.visible, true), isNull(s.musicItems.deletedAt)))
      .orderBy(desc(s.musicItems.date)),
  ]);
  const sale = canSell({ status: work.status, rightsType: work.rightsType, licenseOnFile: work.licenseOnFile });
  return { work, files, products: sale.ok ? products : [], saleBlocked: sale.ok ? null : sale.reason, items };
}

/** Everything for the studio: all works including drafts, with their file and product counts. */
export async function listWorksAdmin(db: Database) {
  const works = await db
    .select()
    .from(s.musicWorks)
    .where(live)
    .orderBy(asc(s.musicWorks.sort), desc(s.musicWorks.createdAt));
  const files = await db
    .select({ workId: s.musicScoreFiles.workId })
    .from(s.musicScoreFiles)
    .where(isNull(s.musicScoreFiles.deletedAt));
  const products = await db
    .select({ workId: s.musicProducts.workId })
    .from(s.musicProducts)
    .where(isNull(s.musicProducts.deletedAt));
  const count = (rows: { workId: string | null }[], id: string) => rows.filter((r) => r.workId === id).length;
  return works.map((w) => ({ ...w, fileCount: count(files, w.id), productCount: count(products, w.id) }));
}

export async function getWorkAdmin(db: Database, id: string) {
  const [work] = await db
    .select()
    .from(s.musicWorks)
    .where(and(eq(s.musicWorks.id, id), live));
  if (!work) return null;
  const [files, products, items] = await Promise.all([
    db
      .select()
      .from(s.musicScoreFiles)
      .where(and(eq(s.musicScoreFiles.workId, id), isNull(s.musicScoreFiles.deletedAt)))
      .orderBy(asc(s.musicScoreFiles.sort)),
    db
      .select()
      .from(s.musicProducts)
      .where(and(eq(s.musicProducts.workId, id), isNull(s.musicProducts.deletedAt)))
      .orderBy(asc(s.musicProducts.priceCents)),
    db
      .select()
      .from(s.musicItems)
      .where(and(eq(s.musicItems.workId, id), isNull(s.musicItems.deletedAt)))
      .orderBy(desc(s.musicItems.date)),
  ]);
  return { work, files, products, items };
}

/* ---------- files and products ---------- */
export async function addScoreFile(
  db: Database,
  workId: string,
  f: {
    kind: (typeof s.scoreFileKindEnum.enumValues)[number];
    label: string;
    filename: string;
    mime: string;
    storageKey: string;
    bytes: number;
    pages?: number | null;
    previewPages?: number;
  },
) {
  const [{ n }] = await db
    .select({ n: sql<number>`coalesce(max(${s.musicScoreFiles.version}), 0)::int` })
    .from(s.musicScoreFiles)
    .where(and(eq(s.musicScoreFiles.workId, workId), eq(s.musicScoreFiles.label, f.label)));
  const [row] = await db
    .insert(s.musicScoreFiles)
    .values({ workId, ...f, pages: f.pages ?? null, previewPages: f.previewPages ?? 2, version: n + 1 })
    .returning();
  return row;
}

export async function removeScoreFile(db: Database, id: string) {
  await db.update(s.musicScoreFiles).set({ deletedAt: new Date() }).where(eq(s.musicScoreFiles.id, id));
}

export const productSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(400).nullable().optional(),
  tier: z.enum(["personal", "ensemble", "institution"]).default("personal"),
  priceCents: z.number().int().min(0).max(1_000_000),
  fileIds: z.array(z.string().uuid()).default([]),
  active: z.boolean().default(true),
});

export async function saveProduct(db: Database, workId: string, input: z.input<typeof productSchema>, id?: string) {
  const v = productSchema.parse(input);
  if (v.priceCents !== 0 && v.priceCents < 50) throw new StudioError("A price is free or at least $0.50.");
  const row = { ...v, description: v.description ?? null, kind: "score" as const, workId, updatedAt: new Date() };
  if (id) {
    const [p] = await db.update(s.musicProducts).set(row).where(eq(s.musicProducts.id, id)).returning();
    if (!p) throw new StudioError("That product no longer exists.");
    return p;
  }
  const [p] = await db.insert(s.musicProducts).values(row).returning();
  return p;
}

export async function removeProduct(db: Database, id: string) {
  await db.update(s.musicProducts).set({ deletedAt: new Date(), active: false }).where(eq(s.musicProducts.id, id));
}

/** A bundle: several score products sold together for one price. Every part must be a score product. */
export async function saveBundle(
  db: Database,
  input: { title: string; description?: string | null; priceCents: number; productIds: string[]; active?: boolean },
  id?: string,
) {
  const ids = [...new Set(input.productIds)];
  if (ids.length < 2) throw new StudioError("A bundle needs at least two scores.");
  const parts = await db
    .select()
    .from(s.musicProducts)
    .where(and(inArray(s.musicProducts.id, ids), eq(s.musicProducts.kind, "score"), isNull(s.musicProducts.deletedAt)));
  if (parts.length !== ids.length) throw new StudioError("A bundle can only hold scores.");
  if (new Set(parts.map((p) => p.tier)).size !== 1)
    throw new StudioError("Every score in a bundle needs the same license tier.");
  const whole = parts.reduce((n, p) => n + p.priceCents, 0);
  if (input.priceCents >= whole) throw new StudioError("A bundle should cost less than its parts.");
  if (input.priceCents < 50) throw new StudioError("A price is at least $0.50.");
  const row = {
    kind: "bundle" as const,
    workId: null,
    title: input.title.trim(),
    description: input.description ?? null,
    tier: parts[0].tier,
    priceCents: input.priceCents,
    active: input.active ?? true,
    updatedAt: new Date(),
  };
  let bundleId = id;
  if (id) {
    await db.update(s.musicProducts).set(row).where(eq(s.musicProducts.id, id));
    await db.delete(s.musicBundleItems).where(eq(s.musicBundleItems.bundleId, id));
  } else {
    const [b] = await db.insert(s.musicProducts).values(row).returning();
    bundleId = b.id;
  }
  await db.insert(s.musicBundleItems).values(ids.map((productId) => ({ bundleId: bundleId as string, productId })));
  return bundleId as string;
}

export async function listBundles(db: Database, opts: { activeOnly?: boolean } = {}) {
  const bundles = await db
    .select()
    .from(s.musicProducts)
    .where(
      and(
        eq(s.musicProducts.kind, "bundle"),
        isNull(s.musicProducts.deletedAt),
        opts.activeOnly ? eq(s.musicProducts.active, true) : undefined,
      ),
    )
    .orderBy(asc(s.musicProducts.title));
  if (!bundles.length) return [];
  const items = await db
    .select()
    .from(s.musicBundleItems)
    .where(
      inArray(
        s.musicBundleItems.bundleId,
        bundles.map((b) => b.id),
      ),
    );
  const partIds = [...new Set(items.map((i) => i.productId))];
  const parts = partIds.length
    ? await db.select().from(s.musicProducts).where(inArray(s.musicProducts.id, partIds))
    : [];
  return bundles.map((b) => ({
    ...b,
    parts: items
      .filter((i) => i.bundleId === b.id)
      .map((i) => parts.find((p) => p.id === i.productId))
      .filter((p): p is NonNullable<typeof p> => !!p),
  }));
}

/* ---------- orders ---------- */
export const orderInputSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  holderName: z.string().trim().min(1).max(120),
  organization: z.string().trim().max(160).nullable().optional(),
  productIds: z.array(z.string().uuid()).min(1).max(40),
});

export type OrderLineDraft = {
  productId: string;
  workId: string;
  title: string;
  tier: LicenseTier;
  priceCents: number;
  fileIds: string[];
};

/**
 * Expands the cart into order lines. A bundle becomes one line per piece, its price split in proportion to the parts so the
 * lines add up to the bundle price exactly. Anything not for sale makes the whole order fail with the reason.
 */
export async function expandCart(db: Database, productIds: string[]): Promise<OrderLineDraft[]> {
  const ids = [...new Set(productIds)];
  const products = await db
    .select()
    .from(s.musicProducts)
    .where(and(inArray(s.musicProducts.id, ids), eq(s.musicProducts.active, true), isNull(s.musicProducts.deletedAt)));
  if (products.length !== ids.length) throw new StudioError("Something in your cart is no longer available.");
  const bundleIds = products.filter((p) => p.kind === "bundle").map((p) => p.id);
  const bundleItems = bundleIds.length
    ? await db.select().from(s.musicBundleItems).where(inArray(s.musicBundleItems.bundleId, bundleIds))
    : [];
  const scoreIds = [
    ...new Set([
      ...products.filter((p) => p.kind === "score").map((p) => p.id),
      ...bundleItems.map((b) => b.productId),
    ]),
  ];
  const scores = await db
    .select()
    .from(s.musicProducts)
    .where(and(inArray(s.musicProducts.id, scoreIds), isNull(s.musicProducts.deletedAt)));
  const workIds = [...new Set(scores.map((p) => p.workId).filter((x): x is string => !!x))];
  const works = await db
    .select()
    .from(s.musicWorks)
    .where(and(inArray(s.musicWorks.id, workIds), live));
  const check = (p: (typeof scores)[number]) => {
    const w = works.find((x) => x.id === p.workId);
    if (!w || !p.active) throw new StudioError(`"${p.title}" is no longer available.`);
    const ok = canSell({ status: w.status, rightsType: w.rightsType, licenseOnFile: w.licenseOnFile });
    if (!ok.ok) throw new StudioError(`"${w.title}": ${ok.reason}`);
    return w;
  };
  const lines: OrderLineDraft[] = [];
  const seen = new Set<string>();
  const push = (p: (typeof scores)[number], priceCents: number) => {
    const w = check(p);
    if (seen.has(w.id)) throw new StudioError(`"${w.title}" is in your cart twice. One license per piece.`);
    seen.add(w.id);
    lines.push({
      productId: p.id,
      workId: w.id,
      title: `${w.title}: ${p.title}`,
      tier: p.tier,
      priceCents,
      fileIds: p.fileIds,
    });
  };
  for (const p of products) {
    if (p.kind === "score") push(p, p.priceCents);
    else {
      const parts = bundleItems
        .filter((b) => b.bundleId === p.id)
        .map((b) => scores.find((x) => x.id === b.productId))
        .filter((x): x is NonNullable<typeof x> => !!x);
      if (parts.length < 2) throw new StudioError(`"${p.title}" is not set up correctly.`);
      const whole = parts.reduce((n, x) => n + x.priceCents, 0);
      let left = p.priceCents;
      for (const [i, part] of parts.entries()) {
        const share = i === parts.length - 1 ? left : Math.round((part.priceCents / whole) * p.priceCents);
        left -= share;
        push(part, share);
      }
    }
  }
  return lines;
}

const orderNo = (seq: number) => `M-${String(seq).padStart(6, "0")}`;

/** Creates a pending order. The raw access token is returned once; only its hash is stored. */
export async function createOrder(db: Database, input: z.input<typeof orderInputSchema>) {
  const v = orderInputSchema.parse(input);
  const lines = await expandCart(db, v.productIds);
  const needsOrg = lines.some((l) => l.tier !== "personal");
  if (needsOrg && !v.organization?.trim()) throw new StudioError("Name the ensemble or institution for this license.");
  const totals = orderTotals(lines.map((l) => ({ productId: l.productId, title: l.title, priceCents: l.priceCents })));
  const { token, hash } = newToken();
  const buyer = await upsertBuyer(db, v.email, v.holderName);
  const [order] = await db
    .insert(s.musicOrders)
    .values({
      buyerId: buyer.id,
      email: v.email,
      holderName: v.holderName,
      organization: needsOrg ? v.organization?.trim() || null : null,
      ...totals,
      accessTokenHash: hash,
    })
    .returning();
  await db.insert(s.musicOrderLines).values(lines.map((l) => ({ orderId: order.id, ...l })));
  return { order, number: orderNo(order.seq), token, lines, totals };
}

export const orderNumber = orderNo;

/**
 * Marks an order paid and issues one license per line. Safe to call twice (a webhook replay): the second call changes
 * nothing and returns `duplicate`. A free order is marked paid at once by the caller.
 */
export async function markOrderPaid(
  db: Database,
  orderId: string,
  p: { provider: string; providerRef?: string | null; now?: Date },
) {
  return db.transaction(async (tx) => {
    const t = tx as unknown as Database;
    const [claimed] = await t
      .update(s.musicOrders)
      .set({ status: "paid", provider: p.provider, providerRef: p.providerRef ?? null, paidAt: p.now ?? new Date() })
      .where(and(eq(s.musicOrders.id, orderId), eq(s.musicOrders.status, "pending")))
      .returning();
    if (!claimed) {
      const [existing] = await t.select().from(s.musicOrders).where(eq(s.musicOrders.id, orderId));
      if (!existing) throw new StudioError("Order not found.");
      return { duplicate: true as const, order: existing };
    }
    const lines = await t.select().from(s.musicOrderLines).where(eq(s.musicOrderLines.orderId, orderId));
    const number = orderNo(claimed.seq);
    const issued = lines.map((l, i) => ({
      licenseNo: licenseNumber(number, i, claimed.accessTokenHash.slice(0, 8)),
      orderId,
      orderLineId: l.id,
      buyerId: claimed.buyerId,
      workId: l.workId as string,
      tier: l.tier,
      holder: claimed.holderName,
      organization: claimed.organization,
      fileIds: l.fileIds,
    }));
    if (issued.length) await t.insert(s.musicLicenses).values(issued);
    return { duplicate: false as const, order: claimed };
  });
}

export async function cancelPendingOrder(db: Database, orderId: string) {
  await db
    .update(s.musicOrders)
    .set({ status: "canceled" })
    .where(and(eq(s.musicOrders.id, orderId), eq(s.musicOrders.status, "pending")));
}

/** A refund revokes every license of the order; files already downloaded stay downloaded, new downloads stop. */
export async function refundOrder(db: Database, orderId: string) {
  const [o] = await db
    .update(s.musicOrders)
    .set({ status: "refunded", refundedAt: new Date() })
    .where(and(eq(s.musicOrders.id, orderId), eq(s.musicOrders.status, "paid")))
    .returning();
  if (!o) return false;
  await db.update(s.musicLicenses).set({ revokedAt: new Date() }).where(eq(s.musicLicenses.orderId, orderId));
  return true;
}

export async function orderByAccessToken(db: Database, token: string) {
  const [order] = await db
    .select()
    .from(s.musicOrders)
    .where(eq(s.musicOrders.accessTokenHash, sha256Hex(token)));
  if (!order) return null;
  const [lines, licenses] = await Promise.all([
    db.select().from(s.musicOrderLines).where(eq(s.musicOrderLines.orderId, order.id)),
    db.select().from(s.musicLicenses).where(eq(s.musicLicenses.orderId, order.id)),
  ]);
  return { order, number: orderNo(order.seq), lines, licenses };
}

/* ---------- buyers (library) ---------- */
export async function upsertBuyer(db: Database, email: string, name?: string | null) {
  const e = email.trim().toLowerCase();
  const [existing] = await db.select().from(s.musicBuyers).where(eq(s.musicBuyers.email, e));
  if (existing) {
    if (name && !existing.name) await db.update(s.musicBuyers).set({ name }).where(eq(s.musicBuyers.id, existing.id));
    return existing;
  }
  const [b] = await db
    .insert(s.musicBuyers)
    .values({ email: e, name: name ?? null })
    .returning();
  return b;
}

/** A sign-in link for the library. Returns null for an address that has never bought (the caller answers the same either way). */
export async function createBuyerLink(db: Database, email: string, now = new Date()) {
  const [buyer] = await db.select().from(s.musicBuyers).where(eq(s.musicBuyers.email, email.trim().toLowerCase()));
  if (!buyer) return null;
  const [paid] = await db
    .select({ id: s.musicOrders.id })
    .from(s.musicOrders)
    .where(and(eq(s.musicOrders.buyerId, buyer.id), eq(s.musicOrders.status, "paid")))
    .limit(1);
  if (!paid) return null;
  const { token, hash } = newToken();
  await db
    .insert(s.musicBuyerLinks)
    .values({ buyerId: buyer.id, tokenHash: hash, expiresAt: new Date(now.getTime() + 30 * 60_000) });
  return { token, buyer };
}

/** Uses a sign-in link once. Returns the buyer, or null when the link is wrong, used or expired. */
export async function consumeBuyerLink(db: Database, token: string, now = new Date()) {
  const [row] = await db
    .update(s.musicBuyerLinks)
    .set({ usedAt: now })
    .where(
      and(
        eq(s.musicBuyerLinks.tokenHash, sha256Hex(token)),
        isNull(s.musicBuyerLinks.usedAt),
        sql`${s.musicBuyerLinks.expiresAt} > ${now}`,
      ),
    )
    .returning();
  if (!row) return null;
  const [buyer] = await db.select().from(s.musicBuyers).where(eq(s.musicBuyers.id, row.buyerId));
  return buyer ?? null;
}

export async function getBuyer(db: Database, id: string) {
  const [b] = await db.select().from(s.musicBuyers).where(eq(s.musicBuyers.id, id));
  return b ?? null;
}

export async function libraryFor(db: Database, buyerId: string) {
  const licenses = await db
    .select({ license: s.musicLicenses, work: s.musicWorks, order: s.musicOrders })
    .from(s.musicLicenses)
    .innerJoin(s.musicWorks, eq(s.musicWorks.id, s.musicLicenses.workId))
    .innerJoin(s.musicOrders, eq(s.musicOrders.id, s.musicLicenses.orderId))
    .where(eq(s.musicLicenses.buyerId, buyerId))
    .orderBy(desc(s.musicLicenses.issuedAt));
  const used = licenses.length
    ? await db
        .select({ licenseId: s.musicDownloads.licenseId, n: sql<number>`count(*)::int` })
        .from(s.musicDownloads)
        .where(
          inArray(
            s.musicDownloads.licenseId,
            licenses.map((l) => l.license.id),
          ),
        )
        .groupBy(s.musicDownloads.licenseId)
    : [];
  return licenses.map((l) => ({
    ...l,
    number: orderNo(l.order.seq),
    downloads: used.find((u) => u.licenseId === l.license.id)?.n ?? 0,
  }));
}

/* ---------- downloads ---------- */
export type DownloadCheck =
  | {
      ok: true;
      file: typeof s.musicScoreFiles.$inferSelect;
      license: typeof s.musicLicenses.$inferSelect;
      work: Work;
      order: typeof s.musicOrders.$inferSelect;
    }
  | { ok: false; reason: string };

/** Whether a license may fetch a file now: not revoked, the file is part of it, and the download cap is not reached. */
export async function checkDownload(db: Database, licenseId: string, fileId: string): Promise<DownloadCheck> {
  const [license] = await db.select().from(s.musicLicenses).where(eq(s.musicLicenses.id, licenseId));
  if (!license) return { ok: false, reason: "License not found." };
  if (license.revokedAt) return { ok: false, reason: "This license was revoked." };
  const [file] = await db
    .select()
    .from(s.musicScoreFiles)
    .where(and(eq(s.musicScoreFiles.id, fileId), isNull(s.musicScoreFiles.deletedAt)));
  if (!file || file.workId !== license.workId) return { ok: false, reason: "File not found." };
  if (license.fileIds.length && !license.fileIds.includes(file.id))
    return { ok: false, reason: "This file is not part of your license." };
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(s.musicDownloads)
    .where(eq(s.musicDownloads.licenseId, licenseId));
  if (n >= license.downloadLimit)
    return { ok: false, reason: "The download limit for this license is reached. Write to the composer for more." };
  const [work] = await db.select().from(s.musicWorks).where(eq(s.musicWorks.id, license.workId));
  const [order] = await db.select().from(s.musicOrders).where(eq(s.musicOrders.id, license.orderId));
  if (order.status !== "paid") return { ok: false, reason: "This order is not paid." };
  return { ok: true, file, license, work, order };
}

export async function recordDownload(db: Database, licenseId: string, fileId: string, ipHash?: string | null) {
  await db.insert(s.musicDownloads).values({ licenseId, fileId, ipHash: ipHash ?? null });
}

export async function licenseFilesFor(db: Database, licenseId: string) {
  const [license] = await db.select().from(s.musicLicenses).where(eq(s.musicLicenses.id, licenseId));
  if (!license) return [];
  const files = await db
    .select()
    .from(s.musicScoreFiles)
    .where(and(eq(s.musicScoreFiles.workId, license.workId), isNull(s.musicScoreFiles.deletedAt)))
    .orderBy(asc(s.musicScoreFiles.sort));
  return license.fileIds.length ? files.filter((f) => license.fileIds.includes(f.id)) : files;
}

/* ---------- commissions ---------- */
export const commissionSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(200),
  organization: z.string().trim().max(160).optional(),
  forces: z.string().trim().max(200).optional(),
  occasion: z.string().trim().max(200).optional(),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  budget: z.string().trim().max(80).optional(),
  message: z.string().trim().min(10).max(4000),
});

export async function createCommission(db: Database, input: z.input<typeof commissionSchema>, ipHash?: string | null) {
  const v = commissionSchema.parse(input);
  const [c] = await db
    .insert(s.musicCommissions)
    .values({
      ...v,
      organization: v.organization || null,
      forces: v.forces || null,
      occasion: v.occasion || null,
      deadline: v.deadline || null,
      budget: v.budget || null,
      ipHash: ipHash ?? null,
    })
    .returning();
  return c;
}

export const listCommissions = (db: Database) =>
  db.select().from(s.musicCommissions).orderBy(desc(s.musicCommissions.createdAt));

export async function setCommissionStatus(
  db: Database,
  id: string,
  status: (typeof s.commissionStatusEnum.enumValues)[number],
  ownerNote?: string | null,
) {
  await db
    .update(s.musicCommissions)
    .set({ status, ownerNote: ownerNote ?? null, updatedAt: new Date() })
    .where(eq(s.musicCommissions.id, id));
}

/* ---------- newsletter (double opt-in) ---------- */
export async function subscribe(db: Database, email: string) {
  const e = z.string().trim().toLowerCase().email().max(200).parse(email);
  const { token, hash } = newToken();
  const [existing] = await db.select().from(s.musicSubscribers).where(eq(s.musicSubscribers.email, e));
  if (existing?.confirmedAt && !existing.unsubscribedAt) return { status: "already" as const };
  if (existing)
    await db
      .update(s.musicSubscribers)
      .set({ tokenHash: hash, unsubscribedAt: null })
      .where(eq(s.musicSubscribers.id, existing.id));
  else await db.insert(s.musicSubscribers).values({ email: e, tokenHash: hash });
  return { status: "pending" as const, token, email: e };
}

export async function confirmSubscription(db: Database, token: string) {
  const [row] = await db
    .update(s.musicSubscribers)
    .set({ confirmedAt: new Date(), unsubscribedAt: null })
    .where(eq(s.musicSubscribers.tokenHash, sha256Hex(token)))
    .returning();
  return row ?? null;
}

/** The token that confirms also unsubscribes: it is in every email's footer. */
export async function unsubscribe(db: Database, token: string) {
  const [row] = await db
    .update(s.musicSubscribers)
    .set({ unsubscribedAt: new Date() })
    .where(eq(s.musicSubscribers.tokenHash, sha256Hex(token)))
    .returning();
  return row ?? null;
}

export const confirmedSubscribers = (db: Database) =>
  db
    .select()
    .from(s.musicSubscribers)
    .where(and(sql`${s.musicSubscribers.confirmedAt} is not null`, isNull(s.musicSubscribers.unsubscribedAt)));

/* ---------- reports ---------- */
export async function salesSummary(db: Database) {
  const orders = await db.select().from(s.musicOrders);
  const paid = orders.filter((o) => o.status === "paid");
  const lines = paid.length
    ? await db
        .select()
        .from(s.musicOrderLines)
        .where(
          inArray(
            s.musicOrderLines.orderId,
            paid.map((o) => o.id),
          ),
        )
    : [];
  const byWork = new Map<string, { title: string; count: number; cents: number }>();
  for (const l of lines) {
    const k = l.workId ?? l.productId;
    const cur = byWork.get(k) ?? { title: l.title.split(":")[0], count: 0, cents: 0 };
    cur.count++;
    cur.cents += l.priceCents;
    byWork.set(k, cur);
  }
  return {
    orders: orders.length,
    paid: paid.length,
    refunded: orders.filter((o) => o.status === "refunded").length,
    revenueCents: paid.reduce((n, o) => n + o.subtotalCents - o.discountCents, 0),
    feesCollectedCents: paid.reduce((n, o) => n + o.feeCents, 0),
    top: [...byWork.values()].sort((a, b) => b.cents - a.cents).slice(0, 10),
  };
}

export const listOrdersAdmin = (db: Database, limit = 100) =>
  db.select().from(s.musicOrders).orderBy(desc(s.musicOrders.createdAt)).limit(limit);

export type { RightsType };
