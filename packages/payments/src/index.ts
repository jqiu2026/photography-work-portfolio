import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Real payment adapter shape (Phase 3). Stripe Checkout (hosted page): the studio never sees card numbers. This module
 * never runs against Stripe in tests or by default: `createCheckoutSession` needs STRIPE_SECRET_KEY (a TEST key until the
 * owner decides otherwise) and is only called when that variable is set. Webhooks are verified with the signing secret
 * and processed idempotently by the caller (`claimWebhookEvent` + `recordPayment`).
 */
export type CheckoutInput = {
  invoiceId: string;
  invoiceNumber: string;
  amountCents: number;
  currency: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  /** Payment methods to offer. Bank (ACH) needs it enabled in the Stripe account. Default: card only. */
  methods?: ("card" | "us_bank_account")[];
  /** Optional tip and card surcharge, charged as their own line items and recorded in the metadata. */
  tipCents?: number;
  surchargeCents?: number;
  /** Extra metadata copied to the session and the payment (for example `site: "music"`, so each app's webhook ignores the other's events). */
  metadata?: Record<string, string>;
};

export type StripeConfig = { secretKey: string; apiBase?: string; fetch?: typeof fetch };

/** Stripe's API takes form-encoded bodies with bracketed keys. */
export function formEncode(obj: Record<string, string | number | undefined>): string {
  return Object.entries(obj)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
}

export function checkoutBody(i: CheckoutInput): string {
  if (!Number.isInteger(i.amountCents) || i.amountCents < 50) throw new Error("Amount must be at least 50 cents.");
  const tip = i.tipCents ?? 0;
  const surcharge = i.surchargeCents ?? 0;
  if (tip < 0 || surcharge < 0 || !Number.isInteger(tip) || !Number.isInteger(surcharge))
    throw new Error("Tip and surcharge must be whole cents.");
  const extras: Record<string, string | number> = {};
  let n = 1;
  for (const [name, cents] of [
    ["Tip", tip],
    ["Card surcharge", surcharge],
  ] as const) {
    if (!cents) continue;
    extras[`line_items[${n}][quantity]`] = 1;
    extras[`line_items[${n}][price_data][currency]`] = i.currency;
    extras[`line_items[${n}][price_data][unit_amount]`] = cents;
    extras[`line_items[${n}][price_data][product_data][name]`] = name;
    n++;
  }
  const methods = Object.fromEntries((i.methods ?? ["card"]).map((m, k) => [`payment_method_types[${k}]`, m]));
  return formEncode({
    ...methods,
    ...extras,
    "metadata[tip_cents]": tip || undefined,
    "metadata[surcharge_cents]": surcharge || undefined,
    "payment_intent_data[metadata][tip_cents]": tip || undefined,
    "payment_intent_data[metadata][surcharge_cents]": surcharge || undefined,
    mode: "payment",
    success_url: i.successUrl,
    cancel_url: i.cancelUrl,
    client_reference_id: i.invoiceId,
    customer_email: i.customerEmail,
    "metadata[invoice_id]": i.invoiceId,
    "payment_intent_data[metadata][invoice_id]": i.invoiceId,
    ...Object.fromEntries(
      Object.entries(i.metadata ?? {}).flatMap(([k, v]) => [
        [`metadata[${k}]`, v],
        [`payment_intent_data[metadata][${k}]`, v],
      ]),
    ),
    "line_items[0][quantity]": 1,
    "line_items[0][price_data][currency]": i.currency,
    "line_items[0][price_data][unit_amount]": i.amountCents,
    "line_items[0][price_data][product_data][name]": `Invoice ${i.invoiceNumber}`,
    "line_items[0][price_data][product_data][description]": i.description.slice(0, 250),
  });
}

/** Creates a hosted Checkout Session. Throws on any non-2xx (caller shows a generic error and logs). */
export async function createCheckoutSession(
  cfg: StripeConfig,
  input: CheckoutInput,
  idempotencyKey: string,
): Promise<{ id: string; url: string }> {
  if (!/^sk_(test|live)_/.test(cfg.secretKey)) throw new Error("STRIPE_SECRET_KEY is not a Stripe secret key.");
  const res = await (cfg.fetch ?? fetch)(`${cfg.apiBase ?? "https://api.stripe.com"}/v1/checkout/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Idempotency-Key": idempotencyKey,
    },
    body: checkoutBody(input),
  });
  if (!res.ok) throw new Error(`Stripe responded ${res.status}`);
  const j = (await res.json()) as { id?: string; url?: string };
  if (!j.id || !j.url) throw new Error("Stripe returned no session url.");
  return { id: j.id, url: j.url };
}

/** Verifies a `Stripe-Signature` header (t=timestamp,v1=hmac) over the raw body, with a replay tolerance. */
export function verifyStripeSignature(
  payload: string,
  header: string | null,
  secret: string,
  opts: { toleranceSec?: number; now?: number } = {},
): boolean {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=", 2) as [string, string]));
  const t = Number(parts.t);
  const sigs = header
    .split(",")
    .filter((p) => p.startsWith("v1="))
    .map((p) => p.slice(3));
  if (!Number.isFinite(t) || !sigs.length) return false;
  const now = Math.floor((opts.now ?? Date.now()) / 1000);
  if (Math.abs(now - t) > (opts.toleranceSec ?? 300)) return false;
  const want = createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  return sigs.some((s) => s.length === want.length && timingSafeEqual(Buffer.from(s), Buffer.from(want)));
}

/** Test helper and local tooling: builds a valid header for a payload. */
export function signStripePayload(payload: string, secret: string, now = Date.now()): string {
  const t = Math.floor(now / 1000);
  return `t=${t},v1=${createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex")}`;
}

export type StripeEvent = { id: string; type: string; data: { object: Record<string, unknown> } };

/** What the studio needs from a Stripe event: which invoice was paid, how much, and the payment reference. */
export function paymentFromEvent(e: StripeEvent): {
  invoiceId: string;
  amountCents: number;
  providerRef: string;
  receiptRef?: string;
  status: "succeeded" | "failed";
  tipCents: number;
  surchargeCents: number;
} | null {
  const o = e.data.object;
  const meta = (o.metadata ?? {}) as Record<string, string>;
  const tipCents = Number(meta.tip_cents ?? 0) || 0;
  const surchargeCents = Number(meta.surcharge_cents ?? 0) || 0;
  if (e.type === "checkout.session.completed") {
    const invoiceId = (o.client_reference_id as string | undefined) ?? meta.invoice_id;
    if (!invoiceId || o.payment_status !== "paid") return null;
    return {
      invoiceId,
      amountCents: Number(o.amount_total),
      providerRef: String(o.payment_intent ?? o.id),
      status: "succeeded",
      tipCents,
      surchargeCents,
    };
  }
  if (e.type === "payment_intent.succeeded" && meta.invoice_id)
    return {
      invoiceId: meta.invoice_id,
      amountCents: Number(o.amount_received ?? o.amount),
      providerRef: String(o.id),
      receiptRef: (o.latest_charge as string | undefined) ?? undefined,
      status: "succeeded",
      tipCents,
      surchargeCents,
    };
  if (e.type === "payment_intent.payment_failed" && meta.invoice_id)
    return {
      invoiceId: meta.invoice_id,
      amountCents: Number(o.amount),
      providerRef: String(o.id),
      status: "failed",
      tipCents: 0,
      surchargeCents: 0,
    };
  return null;
}

/** `charge.refunded`: which payment (by payment_intent) and the TOTAL refunded so far, in cents. */
export function refundFromEvent(e: StripeEvent): { providerRef: string; refundedCents: number } | null {
  if (e.type !== "charge.refunded") return null;
  const o = e.data.object;
  const ref = o.payment_intent as string | undefined;
  if (!ref) return null;
  return { providerRef: ref, refundedCents: Number(o.amount_refunded ?? 0) };
}

/** Refunds (part of) a payment through Stripe. Idempotent per `idempotencyKey`. Throws on any non-2xx. */
export async function createRefund(
  cfg: StripeConfig,
  input: { paymentIntent: string; amountCents: number; reason?: string },
  idempotencyKey: string,
): Promise<{ id: string }> {
  if (!/^sk_(test|live)_/.test(cfg.secretKey)) throw new Error("STRIPE_SECRET_KEY is not a Stripe secret key.");
  if (!Number.isInteger(input.amountCents) || input.amountCents < 1) throw new Error("Refund at least one cent.");
  const res = await (cfg.fetch ?? fetch)(`${cfg.apiBase ?? "https://api.stripe.com"}/v1/refunds`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Idempotency-Key": idempotencyKey,
    },
    body: formEncode({ payment_intent: input.paymentIntent, amount: input.amountCents, reason: input.reason }),
  });
  if (!res.ok) throw new Error(`Stripe responded ${res.status}`);
  const j = (await res.json()) as { id?: string };
  if (!j.id) throw new Error("Stripe returned no refund id.");
  return { id: j.id };
}

export const stripeConfigured = (env: Record<string, string | undefined> = process.env) =>
  Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET);

/* ---------- the platform's own subscription (Full Frame) ---------- */
export type SubscriptionInput = {
  /** A Stripe Price id for the monthly plan (STRIPE_PRICE_FULLFRAME). */
  priceId: string;
  plan: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
};
export function subscriptionBody(i: SubscriptionInput): string {
  if (!/^price_[A-Za-z0-9_]+$/.test(i.priceId)) throw new Error("STRIPE_PRICE_FULLFRAME is not a Stripe price id.");
  return formEncode({
    mode: "subscription",
    success_url: i.successUrl,
    cancel_url: i.cancelUrl,
    customer_email: i.customerEmail,
    "line_items[0][price]": i.priceId,
    "line_items[0][quantity]": 1,
    // not client_reference_id: the payment webhook reads that as an invoice id
    "metadata[kind]": "plan",
    "metadata[plan]": i.plan,
    "subscription_data[metadata][kind]": "plan",
    "subscription_data[metadata][plan]": i.plan,
    allow_promotion_codes: "true",
  });
}
export async function createSubscriptionSession(
  cfg: StripeConfig,
  input: SubscriptionInput,
  idempotencyKey: string,
): Promise<{ id: string; url: string }> {
  if (!/^sk_(test|live)_/.test(cfg.secretKey)) throw new Error("STRIPE_SECRET_KEY is not a Stripe secret key.");
  const res = await (cfg.fetch ?? fetch)(`${cfg.apiBase ?? "https://api.stripe.com"}/v1/checkout/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Idempotency-Key": idempotencyKey,
    },
    body: subscriptionBody(input),
  });
  if (!res.ok) throw new Error(`Stripe responded ${res.status}`);
  const j = (await res.json()) as { id?: string; url?: string };
  if (!j.id || !j.url) throw new Error("Stripe returned no session url.");
  return { id: j.id, url: j.url };
}
/** What the studio needs from a plan event: which plan, and the Stripe customer and subscription, or that it ended. */
export function planFromEvent(
  e: StripeEvent,
): { plan: string; customerId: string; subscriptionId: string; ended: boolean } | null {
  const o = e.data.object;
  const meta = (o.metadata ?? {}) as Record<string, string>;
  if (meta.kind !== "plan") return null;
  if (e.type === "checkout.session.completed")
    return {
      plan: meta.plan ?? "fullframe",
      customerId: String(o.customer ?? ""),
      subscriptionId: String(o.subscription ?? ""),
      ended: false,
    };
  if (e.type === "customer.subscription.deleted")
    return {
      plan: meta.plan ?? "fullframe",
      customerId: String(o.customer ?? ""),
      subscriptionId: String(o.id ?? ""),
      ended: true,
    };
  return null;
}
