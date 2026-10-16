import { describe, expect, it } from "vitest";
import {
  checkoutBody,
  createCheckoutSession,
  formEncode,
  paymentFromEvent,
  signStripePayload,
  stripeConfigured,
  verifyStripeSignature,
} from "../src";

const secret = "whsec_test_secret";
const body = JSON.stringify({ id: "evt_1", type: "checkout.session.completed" });

describe("webhook signature", () => {
  it("accepts a correct signature and rejects tampering, a wrong secret, missing headers and replays", () => {
    const now = Date.UTC(2026, 9, 12);
    const h = signStripePayload(body, secret, now);
    expect(verifyStripeSignature(body, h, secret, { now })).toBe(true);
    expect(verifyStripeSignature(`${body} `, h, secret, { now })).toBe(false);
    expect(verifyStripeSignature(body, h, "whsec_other", { now })).toBe(false);
    expect(verifyStripeSignature(body, null, secret, { now })).toBe(false);
    expect(verifyStripeSignature(body, "garbage", secret, { now })).toBe(false);
    expect(verifyStripeSignature(body, h, secret, { now: now + 10 * 60_000 })).toBe(false); // replay window
  });
  it("accepts any of several v1 signatures (key rotation)", () => {
    const now = Date.UTC(2026, 9, 12);
    const good = signStripePayload(body, secret, now);
    const t = good.split(",")[0];
    expect(verifyStripeSignature(body, `${t},v1=${"0".repeat(64)},${good.split(",")[1]}`, secret, { now })).toBe(true);
  });
});

describe("checkout request", () => {
  const input = {
    invoiceId: "inv-1",
    invoiceNumber: "2026-0001",
    amountCents: 35000,
    currency: "usd",
    description: "Coverage",
    successUrl: "https://x.test/ok",
    cancelUrl: "https://x.test/no",
  };
  it("encodes the Stripe form shape with the invoice in metadata and rejects tiny amounts", () => {
    const b = new URLSearchParams(checkoutBody(input));
    expect(b.get("mode")).toBe("payment");
    expect(b.get("line_items[0][price_data][unit_amount]")).toBe("35000");
    expect(b.get("metadata[invoice_id]")).toBe("inv-1");
    expect(() => checkoutBody({ ...input, amountCents: 10 })).toThrow();
    expect(formEncode({ a: "x y", b: undefined })).toBe("a=x%20y");
  });
  it("posts with a bearer key and an idempotency key (fake fetch, no network) and surfaces failures", async () => {
    let seen: { url: string; init: RequestInit } | undefined;
    const ok = await createCheckoutSession(
      {
        secretKey: "sk_test_abc",
        fetch: (async (url: string, init: RequestInit) => {
          seen = { url, init };
          return new Response(JSON.stringify({ id: "cs_1", url: "https://checkout.stripe.test/c" }), { status: 200 });
        }) as typeof fetch,
      },
      input,
      "idem-1",
    );
    expect(ok).toEqual({ id: "cs_1", url: "https://checkout.stripe.test/c" });
    expect(seen?.url).toBe("https://api.stripe.com/v1/checkout/sessions");
    expect((seen?.init.headers as Record<string, string>)["Idempotency-Key"]).toBe("idem-1");
    await expect(
      createCheckoutSession(
        { secretKey: "sk_test_abc", fetch: (async () => new Response("no", { status: 402 })) as typeof fetch },
        input,
        "i",
      ),
    ).rejects.toThrow(/402/);
    await expect(createCheckoutSession({ secretKey: "not-a-key" }, input, "i")).rejects.toThrow(/secret key/);
  });
});

describe("events", () => {
  it("maps checkout and payment_intent events to invoice payments, ignoring everything else", () => {
    expect(
      paymentFromEvent({
        id: "e",
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_1",
            client_reference_id: "inv-1",
            payment_status: "paid",
            amount_total: 35000,
            payment_intent: "pi_1",
          },
        },
      }),
    ).toEqual({ invoiceId: "inv-1", amountCents: 35000, providerRef: "pi_1", status: "succeeded" });
    expect(
      paymentFromEvent({
        id: "e",
        type: "checkout.session.completed",
        data: { object: { client_reference_id: "inv-1", payment_status: "unpaid" } },
      }),
    ).toBeNull();
    expect(
      paymentFromEvent({
        id: "e",
        type: "payment_intent.payment_failed",
        data: { object: { id: "pi_2", amount: 100, metadata: { invoice_id: "inv-9" } } },
      })?.status,
    ).toBe("failed");
    expect(paymentFromEvent({ id: "e", type: "customer.created", data: { object: {} } })).toBeNull();
  });
  it("is configured only when both keys exist", () => {
    expect(stripeConfigured({})).toBe(false);
    expect(stripeConfigured({ STRIPE_SECRET_KEY: "sk_test_x" })).toBe(false);
    expect(stripeConfigured({ STRIPE_SECRET_KEY: "sk_test_x", STRIPE_WEBHOOK_SECRET: "whsec_x" })).toBe(true);
  });
});

import { createFlatTax, createStripeTax } from "../src/tax";

describe("tax providers", () => {
  it("the flat provider is labelled SAMPLE and rounds to cents", async () => {
    const r = await createFlatTax(888).calculate({ amountCents: 10_000, currency: "usd" });
    expect(r).toMatchObject({ taxCents: 888, rateBp: 888, source: "flat-sample" });
    expect(r.label).toContain("SAMPLE");
    expect((await createFlatTax(0).calculate({ amountCents: 10_000, currency: "usd" })).source).toBe("none");
  });
  it("Stripe Tax is called with a bearer key and the address, and falls back without an address or on an error", async () => {
    let seen: { url: string; init: RequestInit } | undefined;
    const ok = (async (url: string, init: RequestInit) => {
      seen = { url, init };
      return new Response(JSON.stringify({ tax_amount_exclusive: 887 }), { status: 200 });
    }) as unknown as typeof fetch;
    const flat = createFlatTax(500);
    const tax = createStripeTax({ secretKey: "sk_test_x", fetch: ok }, flat);
    const r = await tax.calculate({
      amountCents: 10_000,
      currency: "USD",
      address: { country: "US", state: "NY", postalCode: "10001" },
    });
    expect(r).toMatchObject({ taxCents: 887, rateBp: 887, source: "stripe" });
    expect(seen?.url).toBe("https://api.stripe.com/v1/tax/calculations");
    expect((seen?.init.headers as Record<string, string>).Authorization).toBe("Bearer sk_test_x");
    expect(String(seen?.init.body)).toContain("customer_details%5Baddress%5D%5Bpostal_code%5D=10001");
    expect((await tax.calculate({ amountCents: 10_000, currency: "usd" })).source).toBe("flat-sample");
    const bad = createStripeTax(
      { secretKey: "k", fetch: (async () => new Response("{}", { status: 400 })) as unknown as typeof fetch },
      flat,
    );
    expect((await bad.calculate({ amountCents: 10_000, currency: "usd", address: { country: "US" } })).source).toBe(
      "flat-sample",
    );
  });
});
