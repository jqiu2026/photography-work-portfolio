import type { QuoteLine } from "./schema";

/**
 * Quote pricing, pure and tested. Rules (see docs/project/01-photo-site-spec.md, F-20 to F-27):
 *  - the headline price of a package INCLUDES its mandatory fees (listed, never hidden);
 *  - optional fees (travel, rush) are separate lines, never folded into the headline;
 *  - a promo code discounts packages and add-ons (not fees, not tax) and cannot make the price negative;
 *  - sales tax is its own line, on the discounted subtotal plus fees;
 *  - a gift card pays part of the total after tax (it is tender, not a discount);
 *  - the deposit never exceeds what is left to pay.
 * Everything is integer cents.
 */
export type PriceablePackage = {
  id: string;
  name: string;
  priceCents: number;
  mandatoryFees: { label: string; cents: number }[];
  includedAddOns: string[];
};
export type PriceableAddOn = {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  maxQty: number;
  isFee: boolean;
};
export type PromoRule = {
  code: string;
  kind: string;
  percentOff: number | null;
  amountOffCents: number | null;
  minSubtotalCents: number;
  maxUses: number | null;
  uses: number;
  expiresAt: Date | null;
  active: boolean;
};

export type PriceInput = {
  package?: PriceablePackage | null;
  /** All add-ons the studio offers (to resolve bundled add-ons by slug). */
  catalog: PriceableAddOn[];
  /** Chosen extras (not bundled): id and quantity. */
  addOns: { id: string; qty: number }[];
  promo?: PromoRule | null;
  giftBalanceCents?: number;
  taxRateBp?: number;
  taxLabel?: string;
  /** Percent (0..100) or fixed cents deposit, whichever is set. */
  deposit?: { percent?: number; cents?: number };
  now?: Date;
};

export type PriceResult = {
  lines: QuoteLine[];
  subtotalCents: number;
  discountCents: number;
  feeCents: number;
  taxCents: number;
  totalCents: number;
  giftCents: number;
  dueCents: number;
  depositCents: number;
  promoError?: string;
};

const pct = (cents: number, bp: number) => Math.round((cents * bp) / 10_000);

export function checkPromo(p: PromoRule, baseCents: number, now = new Date()): string | null {
  if (!p.active) return "That code is not active.";
  if (p.expiresAt && p.expiresAt < now) return "That code has expired.";
  if (p.maxUses !== null && p.uses >= p.maxUses) return "That code has been used up.";
  if (baseCents < p.minSubtotalCents)
    return `That code needs a subtotal of at least ${(p.minSubtotalCents / 100).toFixed(2)}.`;
  return null;
}

export function priceQuote(input: PriceInput): PriceResult {
  const now = input.now ?? new Date();
  const lines: QuoteLine[] = [];
  const bySlug = new Map(input.catalog.map((a) => [a.slug, a]));
  let goods = 0;
  let fees = 0;

  const pkg = input.package;
  if (pkg) {
    const mandatory = pkg.mandatoryFees.reduce((n, f) => n + f.cents, 0);
    // Headline = package price. Mandatory fees are INSIDE it: shown as an "included" line of 0 added, so the total never grows.
    lines.push({
      kind: "package",
      description: pkg.name,
      qty: 1,
      unitCents: pkg.priceCents,
      amountCents: pkg.priceCents,
      refId: pkg.id,
    });
    goods += Math.max(0, pkg.priceCents - mandatory);
    fees += Math.min(mandatory, pkg.priceCents);
    for (const f of pkg.mandatoryFees)
      lines.push({ kind: "fee", description: `Included: ${f.label}`, qty: 1, unitCents: f.cents, amountCents: 0 });
    for (const slug of pkg.includedAddOns) {
      const a = bySlug.get(slug);
      if (a)
        lines.push({
          kind: "addon",
          description: `Included: ${a.name}`,
          qty: 1,
          unitCents: 0,
          amountCents: 0,
          refId: a.id,
          standaloneCents: a.priceCents,
        });
    }
  }
  for (const choice of input.addOns) {
    const a = input.catalog.find((x) => x.id === choice.id);
    if (!a || !Number.isInteger(choice.qty) || choice.qty < 1) continue;
    const qty = Math.min(choice.qty, a.maxQty);
    const amount = a.priceCents * qty;
    lines.push({
      kind: a.isFee ? "optional-fee" : "addon",
      description: a.name,
      qty,
      unitCents: a.priceCents,
      amountCents: amount,
      refId: a.id,
    });
    if (a.isFee) fees += amount;
    else goods += amount;
  }

  let discount = 0;
  let promoError: string | undefined;
  if (input.promo) {
    promoError = checkPromo(input.promo, goods, now) ?? undefined;
    if (!promoError) {
      discount =
        input.promo.percentOff !== null
          ? Math.round((goods * input.promo.percentOff) / 100)
          : Math.min(goods, input.promo.amountOffCents ?? 0);
      discount = Math.max(0, Math.min(goods, discount));
      if (discount)
        lines.push({
          kind: "discount",
          description: `Code ${input.promo.code}`,
          qty: 1,
          unitCents: -discount,
          amountCents: -discount,
        });
    }
  }

  const subtotal = goods + fees;
  const taxable = subtotal - discount;
  const taxCents = pct(taxable, input.taxRateBp ?? 0);
  const total = taxable + taxCents;
  const giftCents = Math.max(0, Math.min(total, input.giftBalanceCents ?? 0));
  const due = total - giftCents;
  let deposit = 0;
  if (input.deposit?.cents !== undefined) deposit = input.deposit.cents;
  else if (input.deposit?.percent !== undefined) deposit = Math.round((due * input.deposit.percent) / 100);
  deposit = Math.max(0, Math.min(due, deposit));
  return {
    lines,
    subtotalCents: subtotal,
    discountCents: discount,
    feeCents: fees,
    taxCents,
    totalCents: total,
    giftCents,
    dueCents: due,
    depositCents: deposit,
    promoError,
  };
}

/* ---------- money display ---------- */
/** Display-only exchange rates (SAMPLE until the owner sets them). Charges are always in the invoice currency. */
export const SAMPLE_RATES: Record<string, number> = { usd: 1, eur: 0.92, gbp: 0.79, cad: 1.36, jpy: 150 };

export function formatMoney(cents: number, currency = "usd", locale = "en-US"): string {
  const c = currency.toUpperCase();
  const zero = c === "JPY";
  return new Intl.NumberFormat(locale, { style: "currency", currency: c }).format(zero ? cents / 100 : cents / 100);
}

/** "$XX" for prices the owner has not set (Q61); the real amount once `isSample` is false. */
export const priceLabel = (cents: number, isSample: boolean, currency = "usd") =>
  isSample ? "$XX" : formatMoney(cents, currency);

/** A display-only conversion, clearly an estimate: "about EUR 92.00". */
export function approx(cents: number, to: string, rates: Record<string, number> = SAMPLE_RATES): string | null {
  const r = rates[to.toLowerCase()];
  if (!r || to.toLowerCase() === "usd") return null;
  return `about ${formatMoney(Math.round(cents * r), to)} (display only)`;
}
