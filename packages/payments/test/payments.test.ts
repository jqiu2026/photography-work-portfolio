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
