"use server";

import * as com from "@jerryqiu/db/commerce";
import { StudioError } from "@jerryqiu/db/studio";
import { sendTemplate } from "@jerryqiu/email";
import { taxProviderFromEnv } from "@jerryqiu/payments/tax";
import { getSite } from "@jerryqiu/sites";
import { z } from "zod";
import { created, mayRemove, studioMoney } from "@/lib/studio-run";

const id = z.string().uuid();
const dollars = (v: string | undefined, what: string) => {
  const n = Number((v ?? "").replace(/[$,\s]/g, ""));
  if (!Number.isFinite(n) || n < 0) throw new StudioError(`Enter ${what} as a number of dollars.`);
  return Math.round(n * 100);
};
const lines = (v: string | undefined) =>
  (v ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [label, ...rest] = l.split(":");
      return { label: (label ?? "").trim(), value: rest.join(":").trim() };
    });

export async function savePackageAction(input: {
  id?: string;
  name: string;
  tagline?: string;
  price: string;
  tier?: string;
  deliverables?: string;
  fees?: string;
  included?: string;
  featured?: boolean;
  isSample?: boolean;
  visible?: boolean;
}) {
  return studioMoney(async ({ db }) => {
    const fees = (input.fees ?? "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const [label, amount] = l.split(":");
        return { label: (label ?? "").trim(), cents: dollars(amount, "each fee") };
      });
    const p = await com.savePackage(db, {
      id: input.id && id.safeParse(input.id).success ? input.id : undefined,
      name: input.name,
      tagline: input.tagline,
      priceCents: dollars(input.price, "the price"),
      tier: Number(input.tier) || 1,
      deliverables: lines(input.deliverables),
      mandatoryFees: fees,
      includedAddOns: (input.included ?? "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      featured: input.featured,
      isSample: input.isSample ?? false,
      visible: input.visible ?? true,
    });
    return {
      message: "Package saved",
      audit: {
        action: "studio.package.save",
        entity: "studio_package",
        entityId: p.id,
        summary: `Saved package ${p.name}`,
      },
    };
  });
}

export async function deletePackageAction(packageId: string) {
  return studioMoney(async ({ db }) => {
    const p = id.safeParse(packageId);
    if (!p.success) throw new StudioError("Unknown package.");
    await com.deletePackage(db, p.data);
    return { message: "Package removed" };
  });
}

export async function saveAddOnAction(input: {
  id?: string;
  name: string;
  description?: string;
  price: string;
  unit?: string;
  maxQty?: string;
  isFee?: boolean;
  upsell?: boolean;
  isSample?: boolean;
}) {
  return studioMoney(async ({ db }) => {
    const a = await com.saveAddOn(db, {
      id: input.id && id.safeParse(input.id).success ? input.id : undefined,
      name: input.name,
      description: input.description,
      priceCents: dollars(input.price, "the price"),
      unit: input.unit,
      maxQty: Number(input.maxQty) || 1,
      isFee: input.isFee,
      upsell: input.upsell ?? true,
      isSample: input.isSample ?? false,
    });
    return {
      message: "Add-on saved",
      audit: {
        action: "studio.addon.save",
        entity: "studio_add_on",
        entityId: a.id,
        summary: `Saved add-on ${a.name}`,
      },
    };
  });
}

export async function deleteAddOnAction(addOnId: string) {
  return studioMoney(async ({ db }) => {
    const p = id.safeParse(addOnId);
    if (!p.success) throw new StudioError("Unknown add-on.");
    await com.deleteAddOn(db, p.data);
    return { message: "Add-on removed" };
  });
}

const scope = (v: string | undefined) => (v && id.safeParse(v).success ? v : null);
const when = (v: string | undefined) => {
  if (!v?.trim()) return null;
  const d = new Date(`${v.trim()}T23:59:59`);
  if (Number.isNaN(d.getTime())) throw new StudioError("Enter the last day as a date.");
  return d;
};

export async function createPromoAction(input: {
  code: string;
  kind: string;
  value: string;
  maxUses?: string;
  minSubtotal?: string;
  galleryId?: string;
  expires?: string;
}) {
  return studioMoney(async (ctx) => {
    const { db } = ctx;
    const kind = input.kind === "amount" ? "amount" : "percent";
    const p = await com.createPromo(db, {
      code: input.code,
      kind,
      percentOff: kind === "percent" ? Number(input.value) : undefined,
      amountOffCents: kind === "amount" ? dollars(input.value, "the amount off") : undefined,
      maxUses: input.maxUses?.trim() ? Number(input.maxUses) : null,
      minSubtotalCents: input.minSubtotal?.trim() ? dollars(input.minSubtotal, "the minimum") : 0,
      galleryId: scope(input.galleryId),
      expiresAt: when(input.expires),
    });
    await created(ctx, "studio_promo", p.id);
    return {
      message: `Code ${p.code} created`,
      audit: {
        action: "studio.promo.create",
        entity: "studio_promo",
        entityId: p.id,
        summary: `Created code ${p.code}`,
      },
    };
  });
}

export async function togglePromoAction(promoId: string, active: boolean) {
  return studioMoney(async ({ db }) => {
    const p = id.safeParse(promoId);
    if (!p.success) throw new StudioError("Unknown code.");
    await com.setPromoActive(db, p.data, active);
    return { message: active ? "Code activated" : "Code switched off" };
  });
}

export async function updatePromoAction(input: {
  promoId: string;
  kind: string;
  value: string;
  maxUses?: string;
  minSubtotal?: string;
  galleryId?: string;
  expires?: string;
  note?: string;
}) {
  return studioMoney(async ({ db }) => {
    const p = id.safeParse(input.promoId);
    if (!p.success) throw new StudioError("Unknown code.");
    const kind = input.kind === "amount" ? "amount" : "percent";
    const code = await com.updatePromo(db, p.data, {
      kind,
      percentOff: kind === "percent" ? Number(input.value) : undefined,
      amountOffCents: kind === "amount" ? dollars(input.value, "the amount off") : undefined,
      maxUses: input.maxUses?.trim() ? Number(input.maxUses) : null,
      minSubtotalCents: input.minSubtotal?.trim() ? dollars(input.minSubtotal, "the minimum") : 0,
      galleryId: scope(input.galleryId),
      expiresAt: when(input.expires),
      note: input.note,
    });
    return {
      message: `Code ${code} updated`,
      audit: {
        action: "studio.promo.update",
        entity: "studio_promo",
        entityId: p.data,
        summary: `Edited code ${code}`,
      },
    };
  });
}

export async function deletePromoAction(promoId: string) {
  return studioMoney(async (ctx) => {
    const p = id.safeParse(promoId);
    if (!p.success) throw new StudioError("Unknown code.");
    await mayRemove(ctx, "studio_promo", p.data);
    const code = await com.deletePromo(ctx.db, p.data);
    return {
      message: `Code ${code} deleted`,
      audit: {
        action: "studio.promo.delete",
        entity: "studio_promo",
        entityId: p.data,
        summary: `Deleted code ${code}`,
      },
    };
  });
}

export async function updateGiftCardAction(input: {
  cardId: string;
  recipient?: string;
  email?: string;
  expires?: string;
  balance?: string;
}) {
  return studioMoney(async ({ db }) => {
    const p = id.safeParse(input.cardId);
    if (!p.success) throw new StudioError("Unknown gift card.");
    const when = input.expires?.trim() ? new Date(`${input.expires.trim()}T23:59:59`) : null;
    if (when && Number.isNaN(when.getTime())) throw new StudioError("Enter the expiry as a date.");
    const code = await com.updateGiftCard(db, p.data, {
      recipientName: input.recipient,
      purchaserEmail: input.email,
      expiresAt: when,
      balanceCents: input.balance?.trim() ? dollars(input.balance, "the balance") : undefined,
    });
    return {
      message: `Gift card ${code} updated`,
      audit: {
        action: "studio.giftcard.update",
        entity: "studio_gift_card",
        entityId: p.data,
        summary: "Edited a gift card",
      },
    };
  });
}

export async function setGiftCardStatusAction(cardId: string, active: boolean) {
  return studioMoney(async ({ db }) => {
    const p = id.safeParse(cardId);
    if (!p.success) throw new StudioError("Unknown gift card.");
    await com.setGiftCardStatus(db, p.data, active ? "active" : "void");
    return { message: active ? "Gift card switched on" : "Gift card voided: it can no longer be spent" };
  });
}

export async function deleteGiftCardAction(cardId: string) {
  return studioMoney(async (ctx) => {
    const p = id.safeParse(cardId);
    if (!p.success) throw new StudioError("Unknown gift card.");
    await mayRemove(ctx, "studio_gift_card", p.data);
    const code = await com.deleteGiftCard(ctx.db, p.data);
    return {
      message: `Gift card ${code} deleted`,
      audit: {
        action: "studio.giftcard.delete",
        entity: "studio_gift_card",
        entityId: p.data,
        summary: "Deleted a gift card",
      },
    };
  });
}

export async function createReferralAction(clientId: string) {
  return studioMoney(async ({ db }) => {
    const p = id.safeParse(clientId);
    if (!p.success) throw new StudioError("Pick a client.");
    const r = await com.createReferralCode(db, p.data, 10);
    return {
      message: `Referral code ${r.code} created (10% off, one use)`,
      audit: {
        action: "studio.referral.create",
        entity: "studio_promo",
        entityId: r.id,
        summary: `Created referral ${r.code}`,
      },
    };
  });
}

export async function createGiftCardAction(input: { amount: string; email?: string; recipient?: string }) {
  return studioMoney(async (ctx) => {
    const { db } = ctx;
    const g = await com.createGiftCard(db, {
      cents: dollars(input.amount, "the amount"),
      purchaserEmail: input.email,
      recipientName: input.recipient,
    });
    await created(ctx, "studio_gift_card", g.id);
    return {
      message: `Gift card ${g.code} created`,
      extra: { code: g.code },
      audit: {
        action: "studio.giftcard.create",
        entity: "studio_gift_card",
        entityId: g.id,
        summary: "Created a gift card",
      },
    };
  });
}

export async function createQuoteAction(input: {
  clientId: string;
  title: string;
  packageId?: string;
  addOns?: { id: string; qty: number }[];
  promoCode?: string;
  giftCode?: string;
  intro?: string;
  terms?: string;
  fields?: { label: string; value: string }[];
  country?: string;
  state?: string;
  postalCode?: string;
}) {
  return studioMoney(async ({ db }) => {
    const cid = id.safeParse(input.clientId);
    if (!cid.success) throw new StudioError("Pick a client.");
    const settings = await com.getPaymentsSettings(db);
    const base = {
      packageId: input.packageId && id.safeParse(input.packageId).success ? input.packageId : null,
      addOns: input.addOns ?? [],
      promoCode: input.promoCode,
      giftCode: input.giftCode,
    };
    const preview = await com.previewQuote(db, base);
    const provider = taxProviderFromEnv(
      settings.taxRateBp,
      settings.taxIsSample ? "Sales tax (SAMPLE rate)" : settings.taxLabel,
    );
    const tax = await provider.calculate({
      amountCents: preview.subtotalCents - preview.discountCents,
      currency: "usd",
      address: input.country ? { country: input.country, state: input.state, postalCode: input.postalCode } : undefined,
    });
    const q = await com.createQuote(db, {
      ...base,
      clientId: cid.data,
      title: input.title,
      intro: input.intro,
      terms: input.terms,
      fields: input.fields,
      taxRateBp: tax.rateBp,
      taxLabel: tax.label,
    });
    return {
      message: `Quote ${q.number} created`,
      audit: {
        action: "studio.quote.create",
        entity: "studio_quote",
        entityId: q.id,
        summary: `Created quote ${q.number}`,
      },
    };
  });
}

export async function sendQuoteAction(quoteId: string) {
  return studioMoney(async ({ db }) => {
    const p = id.safeParse(quoteId);
    if (!p.success) throw new StudioError("Unknown quote.");
    const { token } = await com.sendQuote(db, p.data);
    const q = (await com.listQuotes(db)).find((r) => r.quote.id === p.data);
    const link = `${getSite("photos").url}/client/quote/${token}`;
    if (q)
      await sendTemplate(
        db,
        q.client.email,
        "quote-sent",
        {
          name: q.client.name,
          title: q.quote.title,
          amount: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
            q.quote.totalCents / 100,
          ),
          link,
          linkLabel: "Review the quote",
        },
        { related: { type: "quote", id: q.quote.id } },
      );
    return {
      message: "Quote sent (the email is in the Inbox)",
      extra: { link },
      audit: { action: "studio.quote.send", entity: "studio_quote", entityId: p.data, summary: "Sent a quote" },
    };
  });
}

export async function saveCommerceSettingsAction(input: {
  depositPercent: string;
  quoteValidDays: string;
  taxRate: string;
  taxLabel: string;
}) {
  return studioMoney(async ({ db }) => {
    const rate = Number(input.taxRate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 50)
      throw new StudioError("Enter the tax rate as a percentage, for example 8.875.");
    await com.savePaymentsSettings(db, {
      depositPercent: Number(input.depositPercent),
      quoteValidDays: Number(input.quoteValidDays),
      taxRateBp: Math.round(rate * 100),
      taxLabel: input.taxLabel || "Sales tax",
      taxIsSample: false,
    });
    return {
      message: "Saved",
      audit: {
        action: "studio.payments.settings",
        entity: "studio_setting",
        entityId: "payments",
        summary: "Updated deposit, quote and tax settings",
      },
    };
  });
}

export async function updateQuoteTextAction(input: {
  quoteId: string;
  title: string;
  intro?: string;
  terms?: string;
  fields?: { label: string; value: string }[];
}) {
  return studioMoney(async ({ db }) => {
    const p = id.safeParse(input.quoteId);
    if (!p.success) throw new StudioError("Unknown quote.");
    const number = await com.updateQuoteText(db, p.data, input);
    return {
      message: `Quote ${number} saved`,
      audit: {
        action: "studio.quote.update",
        entity: "studio_quote",
        entityId: p.data,
        summary: `Edited quote ${number}`,
      },
    };
  });
}
