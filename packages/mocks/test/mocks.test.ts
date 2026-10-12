import { describe, expect, it } from "vitest";
import {
  MemoryStore, MockClientPortal, MockESignProvider, MockFlightSource, MockPaymentProvider, MockScoreDelivery, StudioRepo,
  TEST_CARDS, addToCart, assertMocks, cartTotal, compositions, greatCircle, hasListen, invoiceTotal, makeOrder, mocksEnabled,
  publishable, sampleRaw, airports, SHOOT_STEPS, removeFromCart,
} from "../src";

const now = new Date("2026-10-12T12:00:00Z");

describe("guard", () => {
  it("is on in development and test, off in production unless explicitly enabled", () => {
    expect(mocksEnabled({ NODE_ENV: "development" })).toBe(true);
    expect(mocksEnabled({ NODE_ENV: "test" })).toBe(true);
    expect(mocksEnabled({ NODE_ENV: "production" })).toBe(false);
    expect(mocksEnabled({ NODE_ENV: "production", ENABLE_MOCKS: "true" })).toBe(true);
    expect(() => assertMocks({ NODE_ENV: "production" })).toThrow(/disabled in production/);
  });
});

describe("MockStore", () => {
  it("round-trips JSON and falls back on garbage", () => {
    const s = new MemoryStore();
    s.set("a", { n: 1 });
    expect(s.get("a", null)).toEqual({ n: 1 });
    expect(s.get("missing", 5)).toBe(5);
    s.remove("a");
    expect(s.get("a", "x")).toBe("x");
  });
});

describe("PaymentProvider (Stripe test-mode shape)", () => {
  const p = new MockPaymentProvider(() => now);
  const card = { number: "4242 4242 4242 4242", exp: "12 / 30", cvc: "123" };
  it("creates a payment_intent shaped like Stripe's and marks it mock", async () => {
    const i = await p.createIntent({ amount: 12000, description: "Invoice", metadata: { invoice: "i1" } });
    expect(i).toMatchObject({ object: "payment_intent", amount: 12000, currency: "usd", status: "requires_payment_method", mock: true });
    expect(i.id).toMatch(/^pi_mock_/);
  });
  it("rejects tiny or fractional amounts", async () => {
    await expect(p.createIntent({ amount: 10 })).rejects.toThrow();
    await expect(p.createIntent({ amount: 100.5 })).rejects.toThrow();
  });
  it("succeeds only for the 4242 test card", async () => {
    const i = await p.createIntent({ amount: 5000 });
    const ok = await p.confirm(i, card);
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.intent.status).toBe("succeeded");
      expect(ok.receiptId).toMatch(/^rcpt_mock_/);
    }
    for (const [number, code] of [[TEST_CARDS.declined, "card_declined"], [TEST_CARDS.insufficientFunds, "insufficient_funds"], ["5555555555554444", "mock_only"]] as const) {
      const bad = await p.confirm(i, { ...card, number });
      expect(bad.ok).toBe(false);
      if (!bad.ok) expect(bad.intent.last_payment_error?.code).toBe(code);
    }
  });
  it("validates expiry and cvc and refuses a second payment of the same intent", async () => {
    const i = await p.createIntent({ amount: 5000 });
    expect((await p.confirm(i, { ...card, exp: "01 / 20" })).ok).toBe(false);
    expect((await p.confirm(i, { ...card, exp: "13 / 30" })).ok).toBe(false);
    expect((await p.confirm(i, { ...card, cvc: "1" })).ok).toBe(false);
    const done = await p.confirm(i, card);
    if (!done.ok) throw new Error("expected success");
    expect((await p.confirm(done.intent, card)).ok).toBe(false);
  });
});

describe("ESignProvider", () => {
  const e = new MockESignProvider(() => now);
  it("signs with a typed name and agreement, once", async () => {
    const env = await e.createEnvelope("k1");
    expect(env).toMatchObject({ status: "sent", mock: true });
    await expect(e.sign(env, { signerName: "A", agree: true })).rejects.toThrow(/full name/);
    await expect(e.sign(env, { signerName: "Sample Client", agree: false })).rejects.toThrow(/agree/);
    const { envelope, signature } = await e.sign(env, { signerName: "  Sample Client ", agree: true });
    expect(envelope.status).toBe("signed");
    expect(signature).toMatchObject({ signerName: "Sample Client", signedAt: now.toISOString() });
    await expect(e.sign(envelope, { signerName: "Sample Client", agree: true })).rejects.toThrow(/already signed/);
  });
});

describe("ClientPortal", () => {
  const galleries = () => [{ id: "g1", clientId: "c1", passcode: "sample-1234", clientEmail: "client.a@example.test" }];
  const portal = new MockClientPortal(galleries);
  it("opens a gallery with the passcode (case and spaces ignored) and refuses a wrong one", async () => {
    expect((await portal.withPasscode(" SAMPLE-1234 "))?.galleryId).toBe("g1");
    expect(await portal.withPasscode("nope")).toBeNull();
  });
  it("magic links are shown on screen (never emailed), single use, and unknown emails get nothing", async () => {
    const m = await portal.requestMagicLink("Client.A@example.test");
    expect(m?.shownOnScreen).toBe(true);
    expect(m?.link).toContain("/client/g/g1?ml=");
    expect((await portal.redeem(m!.token))?.via).toBe("magic-link");
    expect(await portal.redeem(m!.token)).toBeNull();
    expect(await portal.requestMagicLink("stranger@example.test")).toBeNull();
  });
});

describe("StudioRepo", () => {
  const repo = () => new StudioRepo(new MemoryStore(), () => now);
  it("seeds fake data labelled as samples", () => {
    const d = repo().data();
    expect(d.clients.every((c) => /^Sample/.test(c.name))).toBe(true);
    expect(d.shoots.every((s) => s.title.startsWith("SAMPLE"))).toBe(true);
  });
  it("walks a shoot through every step, then stops", () => {
    const r = repo();
    const s = r.addShoot("c1", "Test shoot", "2026-11-01");
    for (let i = 1; i < SHOOT_STEPS.length; i++) expect(r.advanceShoot(s.id).step).toBe(SHOOT_STEPS[i]);
    expect(r.advanceShoot(s.id).step).toBe("paid");
  });
  it("validates clients, passcodes (length, uniqueness) and invoices", () => {
    const r = repo();
    expect(() => r.addClient("A", "x")).toThrow();
    expect(() => r.createGallery("s2", "short")).toThrow(/6 characters/);
    expect(() => r.createGallery("s2", "SAMPLE-1234")).toThrow(/already used/);
    expect(r.createGallery("s2", "another-pass").passcode).toBe("another-pass");
    expect(() => r.createInvoice("s1", [{ description: "", amountCents: 0 }])).toThrow();
    const inv = r.createInvoice("s2", [{ description: "Coverage", amountCents: 20000 }, { description: "Prints", amountCents: 5000 }]);
    expect(invoiceTotal(inv)).toBe(25000);
  });
  it("toggles favourites and converts a booking into a client once", () => {
    const r = repo();
    expect(r.toggleFavourite("g1", "p3")).toEqual(["p3"]);
    expect(r.toggleFavourite("g1", "p3")).toEqual([]);
    const c1 = r.convertBooking("b1");
    const count = r.data().clients.length;
    r.addBooking({ name: "Sample Visitor", email: "visitor@example.test", topic: "Event", message: "again" });
    const second = r.data().bookings[0];
    expect(r.convertBooking(second.id).id).toBe(c1.id);
    expect(r.data().clients.length).toBe(count);
  });
});

describe("score store", () => {
  it("listen and score are independent: a recording without a score, a score without a recording", () => {
    const listenOnly = compositions.find((c) => hasListen(c) && !c.score);
    const scoreOnly = compositions.find((c) => !hasListen(c) && c.score);
    expect(listenOnly).toBeTruthy();
    expect(scoreOnly).toBeTruthy();
    expect(compositions.every((c) => c.sample)).toBe(true);
  });
  it("cart: only scores for sale, bought once, totals in cents", () => {
    expect(() => addToCart([], "sample-halation-study")).toThrow(/no score for sale/);
    let cart = addToCart([], "sample-nocturne-for-brass");
    cart = addToCart(cart, "sample-nocturne-for-brass");
    expect(cart).toHaveLength(1);
    cart = addToCart(cart, "sample-window-music");
    expect(cartTotal(cart)).toBe(2700);
    expect(removeFromCart(cart, "sample-window-music")).toHaveLength(1);
  });
  it("orders need a cart and a valid email; delivery only for purchased scores; preview is limited and watermarked", () => {
    const cart = addToCart([], "sample-three-small-pieces");
    expect(() => makeOrder([], "a@b.co", "r")).toThrow();
    expect(() => makeOrder(cart, "nope", "r")).toThrow(/email/);
    const order = makeOrder(cart, "a@b.co", "rcpt_mock_1", now);
    const d = new MockScoreDelivery();
    const f = d.deliver(order, "sample-three-small-pieces");
    expect(f.filename).toBe("sample-three-small-pieces-MOCK.txt");
    expect(new TextDecoder().decode(f.bytes)).toContain("not a real score");
    expect(() => d.deliver(order, "sample-window-music")).toThrow(/not part of the order/);
    const pages = d.preview("sample-window-music");
    expect(pages.length).toBeLessThanOrEqual(2);
    expect(pages[0].svg).toContain("MOCK PREVIEW");
    expect(d.preview("sample-halation-study")).toEqual([]);
  });
});

describe("flight data privacy", () => {
  it("never exposes tail numbers or live positions and keeps month precision", async () => {
    const flights = await new MockFlightSource().flights(now);
    for (const f of flights) {
      expect(Object.keys(f).sort()).toEqual(["aircraft", "from", "id", "month", "note", "sample", "to"].sort());
      expect(f.month).toMatch(/^\d{4}-\d{2}$/);
      expect(f.sample).toBe(true);
    }
    expect(JSON.stringify(flights)).not.toMatch(/tail|N000|live/i);
  });
  it("holds back flights that landed less than 7 days ago", () => {
    const raw = sampleRaw(now);
    const pub = publishable(raw, now);
    expect(raw.some((f) => f.id === "f8")).toBe(true);
    expect(pub.some((f) => f.id === "f8")).toBe(false);
    expect(publishable(raw, new Date(now.getTime() + 8 * 86_400_000)).some((f) => f.id === "f8")).toBe(true);
  });
  it("great-circle routes start and end at the airports", () => {
    const [a, b] = [airports[0], airports[7]];
    const r = greatCircle(a, b, 24);
    expect(r[0][0]).toBeCloseTo(a.lat, 3);
    expect(r[r.length - 1][1]).toBeCloseTo(b.lon, 3);
  });
});
