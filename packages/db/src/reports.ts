import { and, desc, eq, gte, inArray, isNull, lt, lte, sql } from "drizzle-orm";
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

/**
 * Estimated cost of keeping files in Vercel Blob, in cents per gigabyte per month.
 * TODO(owner): check the current Blob price (Q56); this is an estimate, not a bill.
 */
export const STORAGE_CENTS_PER_GB_MONTH = 2.3;
const GB = 1024 ** 3;

/** What it costs per month to keep this many bytes, in cents (rounded up to a whole cent, 0 for nothing). */
export const storageCostCents = (bytes: number) =>
  bytes > 0 ? Math.ceil((bytes / GB) * STORAGE_CENTS_PER_GB_MONTH) : 0;

/** Net money per hour. `null` when no hours were spent (nothing to divide by). */
export const hourlyRateCents = (netCents: number, hours: number) => (hours > 0 ? Math.round(netCents / hours) : null);

/**
 * True hourly rate per job: money kept (paid, less refunds, less tips and card surcharges) minus the expenses and mileage
 * logged against the job, divided by the hours the calendar blocked for its shoots (shoot, buffers and travel).
 * Editing time is not tracked, so the rate reads high for jobs with a lot of editing.
 */
export async function profitReport(db: Database, r: Range) {
  const pays = await db
    .select({ p: s.studioPayments, jobId: s.studioInvoices.jobId })
    .from(s.studioPayments)
    .innerJoin(s.studioInvoices, eq(s.studioInvoices.id, s.studioPayments.invoiceId))
    .where(and(eq(s.studioPayments.status, "succeeded"), gte(paidAt, r.from), lt(paidAt, r.to)));
  const appts = await db
    .select()
    .from(s.appointments)
    .where(
      and(
        eq(s.appointments.kind, "shoot"),
        eq(s.appointments.status, "confirmed"),
        gte(s.appointments.startsAt, r.from),
        lt(s.appointments.startsAt, r.to),
      ),
    );
  const exps = await db
    .select()
    .from(s.studioExpenses)
    .where(
      and(
        gte(s.studioExpenses.spentOn, r.from.toISOString().slice(0, 10)),
        lte(s.studioExpenses.spentOn, r.to.toISOString().slice(0, 10)),
      ),
    );
  const jobs = await db.select({ id: s.studioJobs.id, title: s.studioJobs.title }).from(s.studioJobs);
  const title = new Map(jobs.map((j) => [j.id, j.title]));
  type Row = { jobId: string; title: string; netCents: number; expenseCents: number; hours: number };
  const by = new Map<string, Row>();
  const row = (id: string): Row => {
    const have = by.get(id);
    if (have) return have;
    const fresh: Row = { jobId: id, title: title.get(id) ?? "Job", netCents: 0, expenseCents: 0, hours: 0 };
    by.set(id, fresh);
    return fresh;
  };
  for (const { p, jobId } of pays)
    row(jobId).netCents += p.amountCents - p.tipCents - p.surchargeCents - p.refundedCents;
  for (const a of appts)
    if (a.jobId) row(a.jobId).hours += (a.blockedEnd.getTime() - a.blockedStart.getTime()) / 3_600_000;
  let overheadCents = 0;
  for (const e of exps) {
    if (e.jobId) row(e.jobId).expenseCents += e.amountCents;
    else overheadCents += e.amountCents;
  }
  const rows = [...by.values()]
    .map((x) => ({
      ...x,
      keptCents: x.netCents - x.expenseCents,
      rateCents: hourlyRateCents(x.netCents - x.expenseCents, x.hours),
    }))
    .sort((a, b) => b.keptCents - a.keptCents);
  const kept = rows.reduce((n, x) => n + x.keptCents, 0);
  const hours = rows.reduce((n, x) => n + x.hours, 0);
  return {
    rows,
    keptCents: kept,
    hours,
    overheadCents,
    /** After the expenses that belong to no job. */
    afterOverheadCents: kept - overheadCents,
    rateCents: hourlyRateCents(kept - overheadCents, hours),
  };
}

/** Storage per gallery with the monthly cost of keeping it, largest first. */
export async function storageReport(db: Database) {
  const rows = await db
    .select({
      id: s.studioGalleries.id,
      title: s.studioGalleries.title,
      status: s.studioGalleries.status,
      photos: sql<number>`count(${s.media.id})::int`,
      bytes: sql<number>`coalesce(sum(${s.media.bytes}), 0)::bigint`,
    })
    .from(s.studioGalleries)
    .leftJoin(s.studioGalleryItems, eq(s.studioGalleryItems.galleryId, s.studioGalleries.id))
    .leftJoin(s.media, eq(s.media.id, s.studioGalleryItems.mediaId))
    .groupBy(s.studioGalleries.id)
    .orderBy(desc(sql`coalesce(sum(${s.media.bytes}), 0)`));
  const out = rows.map((x) => ({ ...x, bytes: Number(x.bytes), monthlyCents: storageCostCents(Number(x.bytes)) }));
  const bytes = out.reduce((n, x) => n + x.bytes, 0);
  return { rows: out, bytes, monthlyCents: storageCostCents(bytes) };
}

export const csv = (rows: (string | number)[][]) =>
  rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
