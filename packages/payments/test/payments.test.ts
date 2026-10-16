import { describe, expect, it } from "vitest";
import {
  checkoutBody,
  createCheckoutSession,
  formEncode,
  paymentFromEvent,
  planFromEvent,
  subscriptionBody,
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
    ).toEqual({
      invoiceId: "inv-1",
      amountCents: 35000,
      providerRef: "pi_1",
      status: "succeeded",
      tipCents: 0,
      surchargeCents: 0,
    });
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

import { createRefund, refundFromEvent } from "../src/index";

describe("checkout extras, refunds", () => {
  const base = {
    invoiceId: "i",
    invoiceNumber: "1",
    amountCents: 10000,
    currency: "usd",
    description: "d",
    successUrl: "https://x/ok",
    cancelUrl: "https://x/no",
  };
  it("offers card by default, ACH when asked, and adds tip and surcharge as their own lines with metadata", () => {
    const plain = decodeURIComponent(checkoutBody(base));
    expect(plain).toContain("payment_method_types[0]=card");
    expect(plain).not.toContain("line_items[1]");
    const rich = decodeURIComponent(
      checkoutBody({ ...base, methods: ["card", "us_bank_account"], tipCents: 1500, surchargeCents: 300 }),
    );
    expect(rich).toContain("payment_method_types[1]=us_bank_account");
    expect(rich).toContain("line_items[1][price_data][unit_amount]=1500");
    expect(rich).toContain("line_items[1][price_data][product_data][name]=Tip");
    expect(rich).toContain("line_items[2][price_data][product_data][name]=Card surcharge");
    expect(rich).toContain("metadata[tip_cents]=1500");
    expect(() => checkoutBody({ ...base, tipCents: -1 })).toThrow();
  });
  it("reads tip and surcharge back from a completed session, and the refunded total from charge.refunded", () => {
    const p = paymentFromEvent({
      id: "e",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs",
          client_reference_id: "inv",
          payment_status: "paid",
          amount_total: 11800,
          payment_intent: "pi_1",
          metadata: { tip_cents: "1500", surcharge_cents: "300" },
        },
      },
    });
    expect(p).toMatchObject({ amountCents: 11800, tipCents: 1500, surchargeCents: 300, providerRef: "pi_1" });
    expect(
      refundFromEvent({
        id: "e",
        type: "charge.refunded",
        data: { object: { payment_intent: "pi_1", amount_refunded: 4000 } },
      }),
    ).toEqual({ providerRef: "pi_1", refundedCents: 4000 });
    expect(refundFromEvent({ id: "e", type: "other", data: { object: {} } })).toBeNull();
  });
  it("creates a refund with a bearer key and an idempotency key, and refuses bad keys or amounts", async () => {
    let seen: { url: string; init: RequestInit } | undefined;
    const f = (async (url: string, init: RequestInit) => {
      seen = { url, init };
      return new Response(JSON.stringify({ id: "re_1" }), { status: 200 });
    }) as unknown as typeof fetch;
    const r = await createRefund(
      { secretKey: "sk_test_abc", fetch: f },
      { paymentIntent: "pi_1", amountCents: 2500, reason: "requested_by_customer" },
      "ref-1",
    );
    expect(r.id).toBe("re_1");
    expect(seen?.url).toBe("https://api.stripe.com/v1/refunds");
    expect((seen?.init.headers as Record<string, string>)["Idempotency-Key"]).toBe("ref-1");
    expect(String(seen?.init.body)).toContain("payment_intent=pi_1");
    await expect(
      createRefund({ secretKey: "nope", fetch: f }, { paymentIntent: "pi", amountCents: 1 }, "k"),
    ).rejects.toThrow(/secret key/);
    await expect(
      createRefund({ secretKey: "sk_test_abc", fetch: f }, { paymentIntent: "pi", amountCents: 0 }, "k"),
    ).rejects.toThrow();
  });
});

describe("the platform subscription", () => {
  it("builds a subscription checkout that the invoice webhook will not mistake for a payment", () => {
    const b = new URLSearchParams(
      subscriptionBody({
        priceId: "price_123",
        plan: "fullframe",
        successUrl: "https://x/ok",
        cancelUrl: "https://x/no",
      }),
    );
    expect(b.get("mode")).toBe("subscription");
    expect(b.get("line_items[0][price]")).toBe("price_123");
    expect(b.get("metadata[kind]")).toBe("plan");
    expect(b.has("client_reference_id")).toBe(false);
    expect(() =>
      subscriptionBody({ priceId: "nope", plan: "fullframe", successUrl: "https://x", cancelUrl: "https://x" }),
    ).toThrow(/price id/);
  });
  it("reads plan events and ignores invoice events", () => {
    const done = {
      id: "evt_p",
      type: "checkout.session.completed",
      data: { object: { metadata: { kind: "plan", plan: "fullframe" }, customer: "cus_1", subscription: "sub_1" } },
    };
    expect(planFromEvent(done)).toEqual({
      plan: "fullframe",
      customerId: "cus_1",
      subscriptionId: "sub_1",
      ended: false,
    });
    const gone = {
      id: "evt_q",
      type: "customer.subscription.deleted",
      data: { object: { id: "sub_1", customer: "cus_1", metadata: { kind: "plan", plan: "fullframe" } } },
    };
    expect(planFromEvent(gone)?.ended).toBe(true);
    expect(
      planFromEvent({
        id: "e",
        type: "checkout.session.completed",
        data: { object: { metadata: { invoice_id: "x" } } },
      }),
    ).toBeNull();
  });
});
