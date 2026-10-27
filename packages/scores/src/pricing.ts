/**
 * Money for the score store. All amounts are whole cents. Stripe's fee is passed to the buyer, never paid out of pocket
 * (Q56): the fee line is computed so that what is left after Stripe's cut equals the subtotal.
 */
export const STRIPE_PERCENT = 0.029;
export const STRIPE_FIXED_CENTS = 30;
export const MIN_CHARGE_CENTS = 50;

export type Line = { productId: string; title: string; priceCents: number };

/** The card fee to add so that the seller keeps `subtotalCents`: ceil((s + fixed) / (1 - pct)) - s. Zero for a free order. */
export function passThroughFee(subtotalCents: number): number {
  if (!Number.isInteger(subtotalCents) || subtotalCents < 0) throw new Error("Amount must be whole cents.");
  if (subtotalCents === 0) return 0;
  const gross = Math.ceil((subtotalCents + STRIPE_FIXED_CENTS) / (1 - STRIPE_PERCENT));
  return gross - subtotalCents;
}

export type Totals = { subtotalCents: number; discountCents: number; feeCents: number; totalCents: number };

/**
 * Totals for a cart. `discountCents` comes from bundles and codes and is already validated by the caller. A free order
 * (everything discounted) carries no fee.
 */
export function orderTotals(lines: readonly Line[], discountCents = 0): Totals {
  const subtotalCents = lines.reduce((n, l) => n + l.priceCents, 0);
  if (discountCents < 0 || discountCents > subtotalCents) throw new Error("Discount is out of range.");
  const net = subtotalCents - discountCents;
  const feeCents = passThroughFee(net);
  return { subtotalCents, discountCents, feeCents, totalCents: net + feeCents };
}

/** A bundle is priced as a whole; its saving over the parts is shown to the buyer. */
export function bundleSaving(partCents: readonly number[], bundleCents: number): number {
  return Math.max(0, partCents.reduce((n, c) => n + c, 0) - bundleCents);
}

export const usd = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
