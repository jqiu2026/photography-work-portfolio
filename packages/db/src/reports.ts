import { and, desc, eq, gte, inArray, isNull, lt, sql } from "drizzle-orm";
import type { Database } from "./client";
import * as s from "./schema";

/** Studio reports. Every figure is computed from paid money (succeeded payments, less refunds) or from what actually happened. */
export type Range = { from: Date; to: Date };
export const lastDays = (days: number, now = new Date()): Range => ({
  from: new Date(now.getTime() - days * 86_400_000),
  to: new Date(now.getTime() + 1),
});

const paidAt = sql`coalesce(${s.studioPayments.paidAt}, ${s.studioPayments.createdAt})`;

/** Sales per day: money received (payments that succeeded) minus refunds, split into shop sales and everything else. */
export async function salesReport(db: Database, r: Range) {
  const rows = await db
    .select({
      payment: s.studioPayments,
      invoice: s.studioInvoices,
    })
    .from(s.studioPayments)
    .innerJoin(s.studioInvoices, eq(s.studioInvoices.id, s.studioPayments.invoiceId))
    .where(and(eq(s.studioPayments.status, "succeeded"), gte(paidAt, r.from), lt(paidAt, r.to)));
  const byDay = new Map<string, { day: string; shopCents: number; otherCents: number; refundedCents: number }>();
  let total = 0;
  let refunded = 0;
  let shop = 0;
  for (const { payment: p, invoice: i } of rows) {
    const day = (p.paidAt ?? p.createdAt).toISOString().slice(0, 10);
    const row = byDay.get(day) ?? { day, shopCents: 0, otherCents: 0, refundedCents: 0 };
    const net = p.amountCents - p.tipCents - p.surchargeCents;
    if (i.kind === "shop") row.shopCents += net;
    else row.otherCents += net;
    row.refundedCents += p.refundedCents;
    byDay.set(day, row);
    total += net;
    refunded += p.refundedCents;
    if (i.kind === "shop") shop += net;
  }
  return {
    days: [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day)),
    totalCents: total,
    shopCents: shop,
    refundedCents: refunded,
    netCents: total - refunded,
    payments: rows.length,
  };
}

/** Shop orders in a range, newest first. */
export async function ordersReport(db: Database, r: Range) {
  const rows = await db
    .select({ order: s.studioOrders, gallery: s.studioGalleries })
    .from(s.studioOrders)
    .innerJoin(s.studioGalleries, eq(s.studioGalleries.id, s.studioOrders.galleryId))
    .where(and(gte(s.studioOrders.createdAt, r.from), lt(s.studioOrders.createdAt, r.to)))
    .orderBy(desc(s.studioOrders.createdAt));
  const ids = rows.map((x) => x.order.id);
  const items = ids.length
    ? await db.select().from(s.studioOrderItems).where(inArray(s.studioOrderItems.orderId, ids))
    : [];
  return rows.map((x) => ({ ...x, items: items.filter((i) => i.orderId === x.order.id) }));
}

/** What was delivered: free and paid downloads by gallery and kind. */
export async function orderFilesReport(db: Database, r: Range) {
  const rows = await db
    .select({
      gallery: s.studioGalleries.title,
      kind: s.studioDownloadEvents.kind,
      n: sql<number>`count(*)::int`,
      bytes: sql<number>`coalesce(sum(${s.studioDownloadEvents.bytes}), 0)::bigint`,
    })
    .from(s.studioDownloadEvents)
    .innerJoin(s.studioGalleries, eq(s.studioGalleries.id, s.studioDownloadEvents.galleryId))
    .where(and(gte(s.studioDownloadEvents.at, r.from), lt(s.studioDownloadEvents.at, r.to)))
    .groupBy(s.studioGalleries.title, s.studioDownloadEvents.kind)
    .orderBy(s.studioGalleries.title);
  return rows.map((x) => ({
    gallery: x.gallery,
    kind: x.kind.startsWith("rule:") ? "free rule" : x.kind,
    n: x.n,
    bytes: Number(x.bytes),
  }));
}

/** Units and revenue per product from PAID orders only. */
export async function productsReport(db: Database, r: Range) {
  const rows = await db
    .select({ item: s.studioOrderItems, order: s.studioOrders })
    .from(s.studioOrderItems)
    .innerJoin(s.studioOrders, eq(s.studioOrders.id, s.studioOrderItems.orderId))
    .where(
      and(
        inArray(s.studioOrders.status, ["paid", "fulfilled"]),
        gte(s.studioOrders.paidAt, r.from),
        lt(s.studioOrders.paidAt, r.to),
      ),
    );
  const by = new Map<string, { name: string; kind: string; units: number; cents: number }>();
  for (const { item } of rows) {
    const cur = by.get(item.name) ?? { name: item.name, kind: item.kind, units: 0, cents: 0 };
    cur.units += item.qty;
    cur.cents += item.qty * item.unitCents;
    by.set(item.name, cur);
  }
  return [...by.values()].sort((a, b) => b.cents - a.cents);
}

/** Invoices created in a range with their status, and totals by status. */
export async function invoicesReport(db: Database, r: Range) {
  const rows = await db
    .select({ invoice: s.studioInvoices, job: s.studioJobs })
    .from(s.studioInvoices)
    .innerJoin(s.studioJobs, eq(s.studioJobs.id, s.studioInvoices.jobId))
    .where(
      and(
        isNull(s.studioInvoices.deletedAt),
        gte(s.studioInvoices.createdAt, r.from),
        lt(s.studioInvoices.createdAt, r.to),
      ),
    )
    .orderBy(desc(s.studioInvoices.createdAt));
  const totals = new Map<string, { status: string; n: number; cents: number }>();
  for (const { invoice: i } of rows) {
    const t = totals.get(i.status) ?? { status: i.status, n: 0, cents: 0 };
    t.n++;
    t.cents += i.totalCents;
    totals.set(i.status, t);
  }
  return { rows, totals: [...totals.values()] };
}

export const csv = (rows: (string | number)[][]) =>
  rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
