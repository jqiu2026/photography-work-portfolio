"use server";

import * as bill from "@jerryqiu/db/billing";
import { StudioError } from "@jerryqiu/db/studio";
import { createRefund } from "@jerryqiu/payments";
import { z } from "zod";
import { emailInvoice, runBillingJobs } from "@/lib/billing-jobs";
import { studio } from "@/lib/studio-run";

const id = z.string().uuid();
const cents = (v: string, what: string) => {
  const n = Number((v ?? "").replace(/[$,\s]/g, ""));
  if (!Number.isFinite(n) || n <= 0) throw new StudioError(`Enter ${what} as a number of dollars.`);
  return Math.round(n * 100);
};

export async function createPlanAction(input: {
  jobId: string;
  total: string;
  count: string;
  firstDue: string;
  every: string;
  name?: string;
}) {
  return studio(async ({ db }) => {
    const j = id.safeParse(input.jobId);
    if (!j.success) throw new StudioError("Pick a job.");
    const every = input.every === "week" ? "week" : input.every === "2weeks" ? "2weeks" : "month";
    const r = await bill.createPaymentPlan(db, {
      jobId: j.data,
      totalCents: cents(input.total, "the total"),
      count: Number(input.count),
      firstDueOn: input.firstDue,
      every,
      name: input.name,
    });
    await emailInvoice(db, r.invoices[0].id, r.firstToken);
    return {
      message: `Plan created: ${r.invoices.length} instalments. The first invoice was emailed; the rest are sent as they fall due.`,
      audit: {
        action: "studio.plan.create",
        entity: "studio_payment_plan",
        entityId: r.plan.id,
        summary: `Created plan ${r.plan.name}`,
      },
    };
  });
}

export async function createRecurringAction(input: {
  jobId: string;
  description: string;
  amount: string;
  months: string;
  startOn: string;
  endsOn?: string;
}) {
  return studio(async ({ db }) => {
    const j = id.safeParse(input.jobId);
    if (!j.success) throw new StudioError("Pick a job.");
    const r = await bill.createRecurring(db, {
      jobId: j.data,
      description: input.description,
      amountCents: cents(input.amount, "the amount"),
      intervalMonths: Number(input.months),
      startOn: input.startOn,
      endsOn: input.endsOn || null,
    });
    return {
      message: "Recurring billing started",
      audit: {
        action: "studio.recurring.create",
        entity: "studio_recurring",
        entityId: r.id,
        summary: `Started recurring: ${r.description}`,
      },
    };
  });
}

export async function stopRecurringAction(recurringId: string) {
  return studio(async ({ db }) => {
    const p = id.safeParse(recurringId);
    if (!p.success) throw new StudioError("Unknown item.");
    await bill.stopRecurring(db, p.data);
    return { message: "Stopped" };
  });
}

/** Refunds through Stripe when the payment was a Stripe payment and a key is set; otherwise records the refund you made yourself. */
export async function refundAction(input: { paymentId: string; amount: string; reason?: string }) {
  return studio(async ({ db, user }) => {
    const p = id.safeParse(input.paymentId);
    if (!p.success) throw new StudioError("Unknown payment.");
    const { payment, remainingCents } = await bill.refundable(db, p.data);
    // A blank amount refunds what is left on the payment.
    const amountCents = input.amount.trim() ? cents(input.amount, "the refund") : remainingCents;
    let providerRef = payment.provider === "stripe" ? "stripe" : "manual";
    if (payment.provider === "stripe") {
      const key = process.env.STRIPE_SECRET_KEY;
      if (!key)
        throw new StudioError(
          "STRIPE_SECRET_KEY is not set, so the refund cannot be sent to Stripe. TODO(owner): needs STRIPE_SECRET_KEY.",
        );
      const r = await createRefund(
        { secretKey: key },
        { paymentIntent: payment.providerRef, amountCents, reason: "requested_by_customer" },
        `refund-${payment.id}-${payment.refundedCents}-${amountCents}`,
      );
      providerRef = r.id;
    }
    const r = await bill.recordRefund(db, {
      paymentId: payment.id,
      amountCents,
      reason: input.reason,
      providerRef,
      by: user.email ?? undefined,
    });
    return {
      message: `Refunded ${(amountCents / 100).toFixed(2)}. Invoice is now ${r.invoiceStatus}. Any print order that has not started should be canceled too (Prints, later).`,
      audit: {
        action: "studio.payment.refund",
        entity: "studio_payment",
        entityId: payment.id,
        summary: `Refunded ${(amountCents / 100).toFixed(2)} (${r.invoiceStatus})`,
      },
    };
  });
}

export async function saveBillingSettingsAction(input: {
  tips: boolean;
  percents: string;
  ach: boolean;
  surcharge: boolean;
  surchargePercent: string;
}) {
  return studio(async ({ db }) => {
    const percents = input.percents
      .split(",")
      .map((x) => Number(x.trim()))
      .filter((n) => Number.isInteger(n) && n > 0 && n <= 100);
    const sp = Number(input.surchargePercent || "0");
    if (!Number.isFinite(sp) || sp < 0 || sp > 3) throw new StudioError("A card surcharge cannot exceed 3 percent.");
    await bill.saveBillingSettings(db, {
      tipsEnabled: input.tips,
      tipPercents: percents.length ? percents.slice(0, 5) : [10, 15, 20],
      achEnabled: input.ach,
      surchargeEnabled: input.surcharge && sp > 0,
      surchargeBp: Math.round(sp * 100),
    });
    return {
      message: "Saved",
      audit: {
        action: "studio.billing.settings",
        entity: "studio_setting",
        entityId: "billing",
        summary: "Updated tip, bank payment and surcharge settings",
      },
    };
  });
}

export async function runBillingNowAction() {
  return studio(async ({ db }) => {
    const r = await runBillingJobs(db);
    return { message: `Done: ${r.recurring} recurring and ${r.installments} instalment invoice(s) sent.` };
  });
}
