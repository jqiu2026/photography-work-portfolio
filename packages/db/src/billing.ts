import { and, asc, desc, eq, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { getStudioSetting, setStudioSetting } from "./calendar";
import type { Database } from "./client";
import { StudioError } from "./errors";
import * as s from "./schema";
import { createInvoice, invoiceNetCents, sendInvoice } from "./studio";

/** Payment plans, recurring invoices, refunds, and the tip, surcharge and bank-payment settings. Money is integer cents. */

/* ---------- settings ---------- */
export const billingSettingsSchema = z.object({
  tipsEnabled: z.boolean().default(false),
  tipPercents: z.array(z.number().int().min(1).max(100)).max(5).default([10, 15, 20]),
  /** Bank (ACH) payment is offered when true and Stripe is configured. */
  achEnabled: z.boolean().default(false),
  /** Optional card surcharge, default OFF. Credit cards only (never debit), disclosed before the sale, capped at 3%. */
  surchargeEnabled: z.boolean().default(false),
  surchargeBp: z.number().int().min(0).max(300).default(0),
});
export type BillingSettings = z.infer<typeof billingSettingsSchema>;
export const getBillingSettings = (db: Database) => getStudioSetting(db, "billing", billingSettingsSchema);
export async function saveBillingSettings(db: Database, patch: Partial<BillingSettings>) {
  const next = billingSettingsSchema.parse({ ...(await getBillingSettings(db)), ...patch });
  await setStudioSetting(db, "billing", next);
  return next;
}
/** A surcharge never exceeds 3% (the card networks' ceiling; some states ban it, so it stays off until the owner turns it on). */
export const surchargeFor = (amountCents: number, bp: number) =>
  Math.round((amountCents * Math.min(Math.max(bp, 0), 300)) / 10_000);
export const tipFor = (amountCents: number, percent: number) => Math.round((amountCents * percent) / 100);

/* ---------- payment plans ---------- */
/** Splits `total` into `n` parts that add up exactly (the remainder goes to the earlier parts, one cent each). */
export function splitAmount(total: number, n: number): number[] {
  const base = Math.floor(total / n);
  const extra = total - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < extra ? 1 : 0));
}

const addDays = (d: string, days: number) => {
  const t = new Date(`${d}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + days);
  return t.toISOString().slice(0, 10);
};
export function addMonths(d: string, months: number): string {
  const [y, m, day] = d.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, last));
  return target.toISOString().slice(0, 10);
}

export async function createPaymentPlan(
  db: Database,
  input: {
    jobId: string;
    totalCents: number;
    count: number;
    firstDueOn: string;
    every: "month" | "2weeks" | "week";
    name?: string;
  },
  by?: string,
  now = new Date(),
) {
  if (!Number.isInteger(input.count) || input.count < 2 || input.count > 24)
    throw new StudioError("A plan has 2 to 24 instalments.");
  if (!Number.isInteger(input.totalCents) || input.totalCents < input.count * 100)
    throw new StudioError("Each instalment must be at least one dollar.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.firstDueOn)) throw new StudioError("Pick the first due date.");
  const [job] = await db.select().from(s.studioJobs).where(eq(s.studioJobs.id, input.jobId));
  if (!job) throw new StudioError("Unknown shoot.");
  const name = input.name?.trim() || `${job.title}: payment plan`;
  const [plan] = await db
    .insert(s.studioPaymentPlans)
    .values({ jobId: job.id, name, totalCents: input.totalCents, count: input.count })
    .returning();
  const parts = splitAmount(input.totalCents, input.count);
  const invoices = [];
  for (let i = 0; i < parts.length; i++) {
    const due =
      input.every === "month"
        ? addMonths(input.firstDueOn, i)
        : addDays(input.firstDueOn, i * (input.every === "week" ? 7 : 14));
    const inv = await createInvoice(
      db,
      {
        jobId: job.id,
        lines: [{ description: `${name} (${i + 1} of ${parts.length})`, amountCents: parts[i] }],
        dueDate: due,
      },
      by,
      now,
    );
    await db
      .update(s.studioInvoices)
      .set({ kind: "installment", planId: plan.id, installmentNo: i + 1, installmentOf: parts.length })
      .where(eq(s.studioInvoices.id, inv.id));
    invoices.push({ ...inv, dueDate: due, installmentNo: i + 1 });
  }
  const first = await sendInvoice(db, invoices[0].id, now);
  return { plan, invoices, firstToken: first.token };
}

/** Sends draft instalments that fall due within `daysAhead` days. Returns the invoices that were sent, with their link tokens. */
export async function sendDueInstallments(db: Database, today: string, daysAhead = 7, now = new Date()) {
  const rows = await db
    .select()
    .from(s.studioInvoices)
    .where(
      and(
        eq(s.studioInvoices.kind, "installment"),
        eq(s.studioInvoices.status, "draft"),
        lte(s.studioInvoices.dueDate, addDays(today, daysAhead)),
      ),
    )
    .orderBy(asc(s.studioInvoices.dueDate));
  const sent: { invoice: (typeof rows)[number]; token: string }[] = [];
  for (const inv of rows) sent.push({ invoice: inv, token: (await sendInvoice(db, inv.id, now)).token });
  return sent;
}

export async function listPlans(db: Database) {
  return db.select().from(s.studioPaymentPlans).orderBy(desc(s.studioPaymentPlans.createdAt));
}

/* ---------- recurring ---------- */
export async function createRecurring(
  db: Database,
  input: {
    jobId: string;
    description: string;
    amountCents: number;
    intervalMonths: number;
    startOn: string;
    endsOn?: string | null;
  },
) {
  if (input.description.trim().length < 3) throw new StudioError("Describe what is billed.");
  if (!Number.isInteger(input.amountCents) || input.amountCents < 100)
    throw new StudioError("The amount is at least one dollar.");
  if (!Number.isInteger(input.intervalMonths) || input.intervalMonths < 1 || input.intervalMonths > 24)
    throw new StudioError("Repeat every 1 to 24 months.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startOn)) throw new StudioError("Pick the first date.");
  const [job] = await db.select().from(s.studioJobs).where(eq(s.studioJobs.id, input.jobId));
  if (!job) throw new StudioError("Unknown shoot.");
  const [row] = await db
    .insert(s.studioRecurring)
    .values({
      jobId: job.id,
      description: input.description.trim().slice(0, 160),
      amountCents: input.amountCents,
      intervalMonths: input.intervalMonths,
      nextRunOn: input.startOn,
      endsOn: input.endsOn || null,
    })
    .returning();
  return row;
}
export async function listRecurring(db: Database) {
  return db.select().from(s.studioRecurring).orderBy(desc(s.studioRecurring.createdAt));
}
export async function stopRecurring(db: Database, id: string) {
  await db.update(s.studioRecurring).set({ active: false }).where(eq(s.studioRecurring.id, id));
}

/** Creates and sends the invoice for every recurring item that is due on or before `today`, then moves it forward. Safe to re-run. */
export async function runRecurring(db: Database, today: string, now = new Date()) {
  const due = await db
    .select()
    .from(s.studioRecurring)
    .where(and(eq(s.studioRecurring.active, true), lte(s.studioRecurring.nextRunOn, today)));
  const made: { invoiceId: string; token: string; recurringId: string }[] = [];
  for (const r of due) {
    // Claim this run first: only one concurrent caller advances the date, so an invoice is never made twice.
    const next = addMonths(r.nextRunOn, r.intervalMonths);
    const claimed = await db
      .update(s.studioRecurring)
      .set({ nextRunOn: next, active: r.endsOn ? next <= r.endsOn : true })
      .where(and(eq(s.studioRecurring.id, r.id), eq(s.studioRecurring.nextRunOn, r.nextRunOn)))
      .returning();
    if (!claimed.length) continue;
    if (r.endsOn && r.nextRunOn > r.endsOn) continue;
    const inv = await createInvoice(
      db,
      {
        jobId: r.jobId,
        lines: [{ description: `${r.description} (${r.nextRunOn.slice(0, 7)})`, amountCents: r.amountCents }],
        dueDate: r.nextRunOn,
      },
      undefined,
      now,
    );
    await db
      .update(s.studioInvoices)
      .set({ kind: "recurring", recurringId: r.id })
      .where(eq(s.studioInvoices.id, inv.id));
    made.push({ invoiceId: inv.id, token: (await sendInvoice(db, inv.id, now)).token, recurringId: r.id });
  }
  return made;
}

/* ---------- refunds ---------- */
export async function refundable(db: Database, paymentId: string) {
  const [p] = await db.select().from(s.studioPayments).where(eq(s.studioPayments.id, paymentId));
  if (!p) throw new StudioError("Unknown payment.");
  return {
    payment: p,
    remainingCents: p.status === "succeeded" || p.status === "refunded" ? p.amountCents - p.refundedCents : 0,
  };
}

/**
 * Records a refund (the provider call happens first, in the caller, and its id is passed in). The payment's refunded total
 * only ever goes up to the amount paid; the invoice is re-evaluated from what is left (paid, partial, or refunded).
 */
export async function recordRefund(
  db: Database,
  input: { paymentId: string; amountCents: number; reason?: string; providerRef?: string; by?: string },
  now = new Date(),
) {
  const { payment, remainingCents } = await refundable(db, input.paymentId);
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0)
    throw new StudioError("Enter an amount to refund.");
  if (input.amountCents > remainingCents)
    throw new StudioError(`At most ${(remainingCents / 100).toFixed(2)} can still be refunded on this payment.`);
  const claimed = await db
    .update(s.studioPayments)
    .set({
      refundedCents: sql`${s.studioPayments.refundedCents} + ${input.amountCents}`,
      status: sql`case when ${s.studioPayments.refundedCents} + ${input.amountCents} >= ${s.studioPayments.amountCents} then 'refunded'::studio_payment_status else ${s.studioPayments.status} end`,
    })
    .where(
      and(
        eq(s.studioPayments.id, payment.id),
        sql`${s.studioPayments.refundedCents} + ${input.amountCents} <= ${s.studioPayments.amountCents}`,
      ),
    )
    .returning();
  if (!claimed.length) throw new StudioError("That payment was just refunded. Reload.");
  const [refund] = await db
    .insert(s.studioRefunds)
    .values({
      paymentId: payment.id,
      amountCents: input.amountCents,
      reason: input.reason?.slice(0, 300) ?? null,
      providerRef: input.providerRef ?? "manual",
      by: input.by,
    })
    .returning();
  const [inv] = await db.select().from(s.studioInvoices).where(eq(s.studioInvoices.id, payment.invoiceId));
  const net = await invoiceNetCents(db, payment.invoiceId);
  const status = net >= inv.totalCents ? "paid" : net <= 0 ? "refunded" : "partial";
  await db
    .update(s.studioInvoices)
    .set({ status, paidAt: status === "paid" ? inv.paidAt : null, updatedAt: now })
    .where(eq(s.studioInvoices.id, inv.id));
  return { refund, invoiceStatus: status, invoice: inv };
}

/** A refund made in the Stripe dashboard arrives by webhook: bring our records up to Stripe's total. */
export async function syncRefundedTotal(
  db: Database,
  input: { provider: string; providerRef: string; refundedCents: number },
  now = new Date(),
) {
  const [p] = await db
    .select()
    .from(s.studioPayments)
    .where(and(eq(s.studioPayments.provider, input.provider), eq(s.studioPayments.providerRef, input.providerRef)));
  if (!p) return null;
  const delta = Math.min(input.refundedCents, p.amountCents) - p.refundedCents;
  if (delta <= 0) return null;
  return recordRefund(
    db,
    { paymentId: p.id, amountCents: delta, reason: "Refunded in Stripe", providerRef: "stripe-dashboard" },
    now,
  );
}

export async function listPayments(db: Database) {
  return db
    .select({ payment: s.studioPayments, invoice: s.studioInvoices })
    .from(s.studioPayments)
    .innerJoin(s.studioInvoices, eq(s.studioInvoices.id, s.studioPayments.invoiceId))
    .orderBy(desc(s.studioPayments.createdAt))
    .limit(100);
}
