"use server";

import { type Brand, saveBrand } from "@jerryqiu/db/brand";
import { PLANS, billThisMonth, getPlanState, recordPlanCharge, setPlan } from "@jerryqiu/db/plan";
import { StudioError } from "@jerryqiu/db/studio";
import { mocksEnabled } from "@jerryqiu/mocks";
import { createSubscriptionSession, stripeConfigured } from "@jerryqiu/payments";
import { getSite } from "@jerryqiu/sites";
import { studioOwner } from "@/lib/studio-run";

/** The brand and contact details shown in galleries and emails. */
export async function saveBrandAction(input: Partial<Brand>) {
  return studioOwner(async ({ db }) => {
    await saveBrand(db, input);
    return { message: "Brand details saved" };
  });
}

/**
 * Moves the studio to Full Frame. With Stripe configured this opens a hosted subscription checkout (the plan is switched
 * when Stripe's webhook confirms it). Without keys, and only where mocks are enabled, it switches at once and records the
 * charge as a labelled mock.
 */
export async function upgradePlanAction() {
  return studioOwner(async ({ db }) => {
    // a fully discounted account (the owner's) goes back to Full Frame with no checkout: there is nothing to pay
    if ((await getPlanState(db)).discountPct === 100) {
      await setPlan(db, "fullframe");
      await billThisMonth(db);
      return { message: "Back on Full Frame (100% discount, billed at $0)" };
    }
    if (stripeConfigured() && process.env.STRIPE_PRICE_FULLFRAME) {
      const base = getSite("photos").url;
      const s = await createSubscriptionSession(
        { secretKey: process.env.STRIPE_SECRET_KEY as string },
        {
          priceId: process.env.STRIPE_PRICE_FULLFRAME,
          plan: "fullframe",
          successUrl: `${base}/studio/plan?upgraded=1`,
          cancelUrl: `${base}/studio/plan`,
        },
        `plan-${new Date().toISOString().slice(0, 10)}`,
      );
      return { message: "Continue to Stripe to start the subscription", extra: { url: s.url } };
    }
    if (!mocksEnabled())
      throw new StudioError(
        "Subscriptions are not set up yet. TODO(owner): needs STRIPE_PRICE_FULLFRAME and the Stripe keys.",
      );
    await setPlan(db, "fullframe", { discountPct: 0 });
    await recordPlanCharge(
      db,
      `Full Frame, ${new Date().toISOString().slice(0, 7)} (MOCK: no card was charged)`,
      PLANS.fullframe.priceCents,
    );
    return { message: "Switched to Full Frame (labelled mock: no card was charged)" };
  });
}

/** Back to Free. Existing galleries stay; the limits apply to what can be added. */
export async function downgradePlanAction() {
  return studioOwner(async ({ db }) => {
    await setPlan(db, "free");
    return { message: "Switched to Free. Nothing was deleted; the Free limits apply to new galleries and uploads." };
  });
}

/** Bills this month if it has not been (a $0 line while the discount is 100%). */
export async function billMonthAction() {
  return studioOwner(async ({ db }) => {
    const c = await billThisMonth(db);
    return { message: c ? `Recorded: ${c.description}` : "This month is already recorded." };
  });
}
