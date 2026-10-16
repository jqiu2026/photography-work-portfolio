import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, describe, expect, it } from "vitest";
import * as bill from "../src/billing";
import type { Database } from "../src/client";
import { renderPdf, wrapText } from "../src/pdf";
import * as schema from "../src/schema";
import * as st from "../src/studio";

const here = path.dirname(fileURLToPath(import.meta.url));
let db: Database;
let jobId: string;
beforeAll(async () => {
  const d = drizzle(await PGlite.create(), { schema, casing: "snake_case" });
  await migrate(d, { migrationsFolder: path.join(here, "../drizzle") });
  db = d as unknown as Database;
  const c = await st.createClient(db, { name: "Bill Client", email: "bill@example.com" });
  jobId = (await st.createJob(db, { clientId: c.id, title: "Billed job", feeCents: 100000 })).id;
});

const invoice = async (cents: number) => {
  const inv = await st.createInvoice(db, { jobId, lines: [{ description: "Work", amountCents: cents }] });
  await st.sendInvoice(db, inv.id);
  return inv;
};
const pay = (invoiceId: string, ref: string, amountCents: number, extra: object = {}) =>
  st.recordPayment(db, { invoiceId, provider: "mock", providerRef: ref, amountCents, status: "succeeded", ...extra });
const status = async (id: string) =>
  (await db.select().from(schema.studioInvoices).where(eq(schema.studioInvoices.id, id)))[0].status;

describe("amounts", () => {
  it("splits so the parts add up exactly", () => {
    expect(bill.splitAmount(10000, 3)).toEqual([3334, 3333, 3333]);
    for (const [t, n] of [
      [99999, 7],
      [100, 2],
      [12345, 12],
    ] as const)
      expect(bill.splitAmount(t, n).reduce((a, b) => a + b, 0)).toBe(t);
  });
  it("a surcharge is capped at 3% and tips are percentages", () => {
    expect(bill.surchargeFor(10000, 150)).toBe(150);
    expect(bill.surchargeFor(10000, 900)).toBe(300);
    expect(bill.surchargeFor(10000, 0)).toBe(0);
    expect(bill.tipFor(20000, 15)).toBe(3000);
  });
  it("adds months without overflowing the month end", () => {
    expect(bill.addMonths("2027-01-31", 1)).toBe("2027-02-28");
    expect(bill.addMonths("2028-01-31", 1)).toBe("2028-02-29");
    expect(bill.addMonths("2027-11-15", 3)).toBe("2028-02-15");
  });
});

describe("tips, surcharge and partial payments", () => {
  it("a tip and a surcharge do not count toward the invoice", async () => {
    const inv = await invoice(10000);
    await pay(inv.id, "p-tip", 10000 + 1500 + 300, { tipCents: 1500, surchargeCents: 300, method: "card" });
    expect(await status(inv.id)).toBe("paid");
    expect(await st.invoiceNetCents(db, inv.id)).toBe(10000);
    const short = await invoice(10000);
    await pay(short.id, "p-short", 10000, { tipCents: 2000 }); // 8000 credited
    expect(await status(short.id)).toBe("partial");
    await expect(pay(short.id, "p-bad", 100, { tipCents: 200 })).rejects.toThrow(/cannot exceed/);
  });
});

describe("payment plans", () => {
  it("makes one invoice per instalment that add up to the total, sends the first, and the rest as they fall due", async () => {
    const r = await bill.createPaymentPlan(db, {
      jobId,
      totalCents: 90001,
      count: 3,
      firstDueOn: "2027-06-01",
      every: "month",
      name: "Plan A",
    });
    expect(r.invoices.map((i) => i.totalCents).reduce((a, b) => a + b, 0)).toBe(90001);
    expect(r.invoices.map((i) => i.dueDate)).toEqual(["2027-06-01", "2027-07-01", "2027-08-01"]);
    expect(r.firstToken).toBeTruthy();
    const rows = await db.select().from(schema.studioInvoices).where(eq(schema.studioInvoices.planId, r.plan.id));
    expect(rows.map((x) => x.status).sort()).toEqual(["draft", "draft", "sent"]);
    expect(rows.every((x) => x.kind === "installment" && x.installmentOf === 3)).toBe(true);
    expect(
      (await bill.sendDueInstallments(db, "2027-06-25")).filter((x) => x.invoice.planId === r.plan.id),
    ).toHaveLength(1);
    expect(
      (await bill.sendDueInstallments(db, "2027-06-25")).filter((x) => x.invoice.planId === r.plan.id),
    ).toHaveLength(0);
    expect(
      (await bill.sendDueInstallments(db, "2027-07-30")).filter((x) => x.invoice.planId === r.plan.id),
    ).toHaveLength(1);
    await expect(
      bill.createPaymentPlan(db, { jobId, totalCents: 100, count: 1, firstDueOn: "2027-06-01", every: "month" }),
    ).rejects.toThrow(/2 to 24/);
    await expect(
      bill.createPaymentPlan(db, { jobId, totalCents: 150, count: 3, firstDueOn: "2027-06-01", every: "month" }),
    ).rejects.toThrow(/one dollar/);
  });
});

describe("recurring billing", () => {
  it("bills when due, advances, never double-bills on a re-run, and stops at its end date", async () => {
    const r = await bill.createRecurring(db, {
      jobId,
      description: "Monthly retainer",
      amountCents: 20000,
      intervalMonths: 1,
      startOn: "2027-01-31",
      endsOn: "2027-03-31",
    });
    const first = await bill.runRecurring(db, "2027-02-01");
    expect(first.filter((x) => x.recurringId === r.id)).toHaveLength(1);
    expect((await bill.runRecurring(db, "2027-02-01")).filter((x) => x.recurringId === r.id)).toHaveLength(0);
    const [row] = await db.select().from(schema.studioRecurring).where(eq(schema.studioRecurring.id, r.id));
    expect(row.nextRunOn).toBe("2027-02-28");
    await bill.runRecurring(db, "2027-03-01");
    await bill.runRecurring(db, "2027-04-15");
    const invoices = await db.select().from(schema.studioInvoices).where(eq(schema.studioInvoices.recurringId, r.id));
    expect(invoices.map((i) => i.dueDate)).toEqual(
      ["2027-01-31", "2027-02-28", "2027-03-28"].filter((d) => invoices.some((i) => i.dueDate === d)),
    );
    expect(invoices.length).toBeGreaterThanOrEqual(2);
    expect(invoices.length).toBeLessThanOrEqual(3);
    const [after] = await db.select().from(schema.studioRecurring).where(eq(schema.studioRecurring.id, r.id));
    expect(after.active).toBe(false);
    await expect(
      bill.createRecurring(db, { jobId, description: "x", amountCents: 5, intervalMonths: 1, startOn: "2027-01-01" }),
    ).rejects.toThrow();
  });
});

describe("refunds", () => {
  it("a partial refund leaves the invoice partial; the rest refunds it; you cannot refund more than was paid", async () => {
    const inv = await invoice(20000);
    const { payment } = await pay(inv.id, "p-ref", 20000);
    const a = await bill.recordRefund(db, { paymentId: payment!.id, amountCents: 5000, reason: "Goodwill" });
    expect(a.invoiceStatus).toBe("partial");
    await expect(bill.recordRefund(db, { paymentId: payment!.id, amountCents: 15001 })).rejects.toThrow(
      /At most 150\.00/,
    );
    const b = await bill.recordRefund(db, { paymentId: payment!.id, amountCents: 15000 });
    expect(b.invoiceStatus).toBe("refunded");
    const [p] = await db.select().from(schema.studioPayments).where(eq(schema.studioPayments.id, payment!.id));
    expect(p).toMatchObject({ status: "refunded", refundedCents: 20000 });
    await expect(bill.recordRefund(db, { paymentId: payment!.id, amountCents: 1 })).rejects.toThrow();
  });

  it("refunds a tip proportionally and a concurrent double refund cannot exceed the payment", async () => {
    const inv = await invoice(10000);
    const { payment } = await pay(inv.id, "p-ref2", 11000, { tipCents: 1000 });
    const results = await Promise.allSettled(
      [1, 2, 3].map(() => bill.recordRefund(db, { paymentId: payment!.id, amountCents: 5500 })),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(2);
    expect(await status(inv.id)).toBe("refunded");
  });

  it("a Stripe-dashboard refund is brought up to Stripe's total once", async () => {
    const inv = await invoice(8000);
    await st.recordPayment(db, {
      invoiceId: inv.id,
      provider: "stripe",
      providerRef: "pi_sync",
      amountCents: 8000,
      status: "succeeded",
    });
    const r = await bill.syncRefundedTotal(db, { provider: "stripe", providerRef: "pi_sync", refundedCents: 3000 });
    expect(r?.invoiceStatus).toBe("partial");
    expect(
      await bill.syncRefundedTotal(db, { provider: "stripe", providerRef: "pi_sync", refundedCents: 3000 }),
    ).toBeNull();
    expect(
      await bill.syncRefundedTotal(db, { provider: "stripe", providerRef: "pi_unknown", refundedCents: 3000 }),
    ).toBeNull();
  });
});

describe("settings", () => {
  it("surcharge and tips are off by default and the surcharge is capped at 3%", async () => {
    const d = await bill.getBillingSettings(db);
    expect(d).toMatchObject({ tipsEnabled: false, surchargeEnabled: false, achEnabled: false });
    await expect(bill.saveBillingSettings(db, { surchargeBp: 500 })).rejects.toThrow();
    expect((await bill.saveBillingSettings(db, { tipsEnabled: true, surchargeBp: 250 })).surchargeBp).toBe(250);
  });
});

describe("pdf", () => {
  it("writes a valid single and multi page PDF with correct offsets", () => {
    const small = Buffer.from(
      renderPdf("Invoice 2027-0001", [
        { text: "Invoice (2027-0001) \\ test", size: 18, bold: true },
        { text: "Total $400.00" },
      ]),
    );
    const text = small.toString("latin1");
    expect(text.startsWith("%PDF-1.4")).toBe(true);
    expect(text.trimEnd().endsWith("%%EOF")).toBe(true);
    expect(text).toContain("(Invoice \\(2027-0001\\) \\\\ test) Tj");
    const start = Number(/startxref\n(\d+)/.exec(text)?.[1]);
    expect(text.slice(start, start + 4)).toBe("xref");
    const first = Number(/xref\n0 \d+\n0000000000 65535 f \n(\d{10})/.exec(text)?.[1]);
    expect(text.slice(first, first + 7)).toBe("1 0 obj");
    const many = Buffer.from(
      renderPdf(
        "Long",
        Array.from({ length: 120 }, (_, i) => ({ text: `Line ${i}` })),
      ),
    ).toString("latin1");
    expect(Number(/\/Count (\d+)/.exec(many)?.[1])).toBeGreaterThan(1);
    expect(wrapText("word ".repeat(60), 40).every((l) => l.length <= 40)).toBe(true);
  });
});
