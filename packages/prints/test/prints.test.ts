import { describe, expect, it } from "vitest";
import {
  MOCK_CATALOG,
  addressProblem,
  createMockPrintProvider,
  createWhccProvider,
  feeCents,
  fitsProduct,
  marginCents,
  parseWebhook,
  printProviderFromEnv,
  retailCents,
  signFileLink,
  verifyFileLink,
  verifyWebhook,
} from "../src";

const ship = {
  name: "Ada Lovelace",
  line1: "12 Main St",
  city: "Brooklyn",
  region: "NY",
  postalCode: "11201",
  country: "US",
};

describe("addresses", () => {
  it("accepts a US street address and refuses PO boxes, other countries and bad ZIPs", () => {
    expect(addressProblem(ship)).toBeNull();
    expect(addressProblem({ ...ship, line1: "P.O. Box 12" })).toMatch(/PO box/);
    expect(addressProblem({ ...ship, line2: "PO Box 9" })).toMatch(/PO box/);
    expect(addressProblem({ ...ship, line1: "Post Office Box 4" })).toMatch(/PO box/);
    expect(addressProblem({ ...ship, country: "FR" })).toMatch(/United States, Canada and Mexico/);
    expect(addressProblem({ ...ship, postalCode: "1120" })).toMatch(/ZIP/);
    expect(addressProblem({ ...ship, name: "" })).toMatch(/recipient/);
    expect(addressProblem({ ...ship, country: "CA", postalCode: "M5V 2T6" })).toBeNull();
  });
});

describe("resolution", () => {
  const p8x10 = MOCK_CATALOG.find((p) => p.sku === "MOCK-PRINT-8X10")!;
  it("hides a product when the photograph is too small and flags 'good' above 300 ppi", () => {
    expect(fitsProduct(p8x10, 3000, 2400)).toMatchObject({ ok: true, good: true });
    expect(fitsProduct(p8x10, 1800, 1440)).toMatchObject({ ok: true, good: false, ppi: 180 });
    expect(fitsProduct(p8x10, 1500, 1200).ok).toBe(false);
    expect(fitsProduct(p8x10, 2000, 3000).ok).toBe(true); // portrait works the same
    expect(fitsProduct(p8x10, 4000, 1000).ok).toBe(false); // a panorama's short side is too short for an 8 x 10 crop
  });
});

describe("margin", () => {
  it("rounds retail up to 50 cents, counts the payment fee and shipping, and shows a loss", () => {
    expect(retailCents(250, 100)).toBe(500);
    expect(retailCents(333, 100)).toBe(700);
    expect(feeCents(1000)).toBe(59);
    expect(marginCents(1000, 250, 100)).toBe(1000 - 250 - 59 - 100);
    expect(marginCents(300, 250, 100)).toBeLessThan(0);
  });
});

describe("signed file links", () => {
  it("verify for the right order, item and time only", () => {
    const exp = Date.now() + 60_000;
    const sig = signFileLink("s3cret", "o1", 0, exp);
    expect(verifyFileLink("s3cret", "o1", 0, exp, sig)).toBe(true);
    expect(verifyFileLink("s3cret", "o2", 0, exp, sig)).toBe(false);
    expect(verifyFileLink("s3cret", "o1", 1, exp, sig)).toBe(false);
    expect(verifyFileLink("wrong", "o1", 0, exp, sig)).toBe(false);
    expect(verifyFileLink("s3cret", "o1", 0, exp, sig, exp + 1)).toBe(false);
  });
});

describe("mock provider", () => {
  it("is labelled, ships to valid addresses only, is idempotent per reference and cancels only before production", async () => {
    const p = createMockPrintProvider();
    expect(p.name).toBe("mock");
    expect((await p.catalog()).every((x) => /SAMPLE/.test(x.name))).toBe(true);
    expect((await p.shipping([{ sku: "MOCK-PRINT-4X6", qty: 3 }], ship)).cents).toBe(1200);
    const order = {
      reference: "ord-1",
      items: [{ sku: "MOCK-PRINT-4X6", qty: 1, fileUrl: "https://x/f", mediaId: "m" }],
      ship,
    };
    const a = await p.submit(order);
    const b = await p.submit(order);
    expect(b.providerOrderId).toBe(a.providerOrderId);
    expect(p.orders.size).toBe(1);
    await expect(p.submit({ ...order, reference: "ord-2", ship: { ...ship, line1: "PO Box 1" } })).rejects.toThrow(
      /PO box/,
    );
    await expect(
      p.submit({ ...order, reference: "ord-3", items: [{ sku: "NOPE", qty: 1, fileUrl: "u", mediaId: "m" }] }),
    ).rejects.toThrow(/Unknown product/);
    expect(await p.cancel(a.providerOrderId)).toBe(true);
    const started = await p.submit({ ...order, reference: "ord-4" });
    (p.orders.get(started.providerOrderId) as { started: boolean }).started = true;
    expect(await p.cancel(started.providerOrderId)).toBe(false);
    expect(await p.cancel("nope")).toBe(false);
  });
  it("refuses an order whose image file the lab cannot fetch", async () => {
    const p = createMockPrintProvider({ fetchFile: async () => false });
    await expect(
      p.submit({
        reference: "r",
        items: [{ sku: "MOCK-PRINT-4X6", qty: 1, fileUrl: "https://x", mediaId: "m" }],
        ship,
      }),
    ).rejects.toThrow(/could not be fetched/);
  });
});

describe("WHCC adapter (against a fake server; never the real one)", () => {
  it("authenticates, imports the order with an idempotency key, then confirms with the ConfirmationID", async () => {
    const calls: { path: string; body: unknown; headers: Record<string, string> }[] = [];
    const fake = (async (url: string, init: RequestInit) => {
      const path = new URL(url).pathname;
      calls.push({
        path,
        body: init.body ? JSON.parse(String(init.body)) : null,
        headers: (init.headers ?? {}) as Record<string, string>,
      });
      if (path === "/api/AccessToken") return new Response(JSON.stringify({ Token: "tok", ExpiresIn: 3600 }));
      if (path === "/api/OrderImport") return new Response(JSON.stringify({ ConfirmationID: "conf-9" }));
      return new Response(JSON.stringify({}));
    }) as unknown as typeof fetch;
    const p = createWhccProvider({
      baseUrl: "https://whcc.example",
      consumerKey: "k",
      consumerSecret: "s",
      fetch: fake,
    });
    const r = await p.submit({
      reference: "ord-7",
      items: [{ sku: "A", qty: 2, fileUrl: "https://signed/1", mediaId: "m" }],
      ship,
    });
    expect(r).toEqual({ providerOrderId: "conf-9", status: "submitted" });
    expect(calls.map((c) => c.path)).toEqual(["/api/AccessToken", "/api/OrderImport", "/api/OrderImport/Submit"]);
    expect(calls[1].headers.Authorization).toBe("Bearer tok");
    expect(calls[1].headers["Idempotency-Key"]).toBe("ord-7");
    expect(calls[2].body).toEqual({ ConfirmationID: "conf-9" });
    await expect(p.submit({ reference: "x", items: [], ship: { ...ship, line1: "PO Box 3" } })).rejects.toThrow(
      /PO box/,
    );
  });
  it("fails clearly on bad credentials, and cancel returns false instead of throwing", async () => {
    const bad = (async () => new Response("{}", { status: 401 })) as unknown as typeof fetch;
    const p = createWhccProvider({
      baseUrl: "https://whcc.example/placeholder",
      consumerKey: "k",
      consumerSecret: "s",
      fetch: bad,
    });
    await expect(p.catalog()).rejects.toThrow(/authentication failed/);
    expect(await p.cancel("c")).toBe(false);
  });
  it("is chosen only when all three names are set; otherwise the mock (not in production)", () => {
    expect(
      printProviderFromEnv({ WHCC_BASE_URL: "https://x", WHCC_CONSUMER_KEY: "k", WHCC_CONSUMER_SECRET: "s" })?.name,
    ).toBe("whcc");
    expect(printProviderFromEnv({ NODE_ENV: "development" })?.name).toBe("mock");
    expect(printProviderFromEnv({ NODE_ENV: "production" })).toBeNull();
    expect(printProviderFromEnv({ NODE_ENV: "production", ENABLE_MOCKS: "true" })?.name).toBe("mock");
  });
});

describe("webhooks", () => {
  it("verifies the signature and reads shipping events", () => {
    const body = JSON.stringify({
      orderId: "conf-9",
      status: "shipped",
      carrier: "UPS",
      trackingNumber: "1Z999",
      trackingUrl: "https://track/1Z999",
    });
    const { createHmac } = require("node:crypto") as typeof import("node:crypto");
    const sig = createHmac("sha256", "whsec").update(body).digest("hex");
    expect(verifyWebhook("whsec", body, sig)).toBe(true);
    expect(verifyWebhook("whsec", body, `${sig.slice(0, -1)}0`)).toBe(false);
    expect(parseWebhook(body)).toEqual({
      providerOrderId: "conf-9",
      status: "shipped",
      tracking: { carrier: "UPS", number: "1Z999", url: "https://track/1Z999" },
    });
    expect(parseWebhook(JSON.stringify({ orderId: "x", status: "weird" }))).toBeNull();
    expect(parseWebhook("not json")).toBeNull();
  });
});
