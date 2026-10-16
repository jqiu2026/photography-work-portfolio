import { type StripeConfig, formEncode } from "./index";

/**
 * Sales tax behind an interface. Tax is CALCULATED and shown at quote and checkout time only; collecting, filing and
 * remitting stay with the owner and their accountant (Q52). `StripeTaxProvider` calls Stripe Tax's calculation API (only
 * where the owner has registered in Stripe; never run live here, NOT VERIFIED against the live service). Without
 * a key or an address the labelled flat-rate provider (a SAMPLE rate) is used.
 */
export type TaxAddress = { country?: string; state?: string; postalCode?: string };
export type TaxResult = { taxCents: number; rateBp: number; label: string; source: "stripe" | "flat-sample" | "none" };
export interface TaxProvider {
  calculate(input: { amountCents: number; currency: string; address?: TaxAddress }): Promise<TaxResult>;
}

export function createFlatTax(rateBp: number, label = "Sales tax (SAMPLE rate)"): TaxProvider {
  return {
    async calculate({ amountCents }) {
      return {
        taxCents: Math.round((amountCents * rateBp) / 10_000),
        rateBp,
        label,
        source: rateBp ? "flat-sample" : "none",
      };
    },
  };
}

export function createStripeTax(cfg: StripeConfig, fallback: TaxProvider): TaxProvider {
  const f = cfg.fetch ?? fetch;
  const base = cfg.apiBase ?? "https://api.stripe.com";
  return {
    async calculate(input) {
      if (!input.address?.country) return fallback.calculate(input);
      try {
        const res = await f(`${base}/v1/tax/calculations`, {
          method: "POST",
          headers: { Authorization: `Bearer ${cfg.secretKey}`, "Content-Type": "application/x-www-form-urlencoded" },
          body: formEncode({
            currency: input.currency.toLowerCase(),
            "line_items[0][amount]": input.amountCents,
            "line_items[0][reference]": "quote",
            "customer_details[address][country]": input.address.country,
            "customer_details[address][state]": input.address.state,
            "customer_details[address][postal_code]": input.address.postalCode,
            "customer_details[address_source]": "billing",
          }),
        });
        const j = (await res.json()) as { tax_amount_exclusive?: number; error?: { message?: string } };
        if (!res.ok || typeof j.tax_amount_exclusive !== "number") return fallback.calculate(input);
        const rateBp = input.amountCents ? Math.round((j.tax_amount_exclusive / input.amountCents) * 10_000) : 0;
        return { taxCents: j.tax_amount_exclusive, rateBp, label: "Sales tax", source: "stripe" };
      } catch {
        return fallback.calculate(input);
      }
    },
  };
}

/** The provider for this deployment: Stripe Tax when STRIPE_SECRET_KEY and STRIPE_TAX=on are set, else the flat sample. */
export function taxProviderFromEnv(
  rateBp: number,
  label: string,
  env: Record<string, string | undefined> = process.env,
): TaxProvider {
  const flat = createFlatTax(rateBp, label);
  return env.STRIPE_SECRET_KEY && env.STRIPE_TAX === "on"
    ? createStripeTax({ secretKey: env.STRIPE_SECRET_KEY }, flat)
    : flat;
}
