import { describe, expect, it } from "vitest";
import { approx, checkPromo, formatMoney, priceLabel, priceQuote } from "../src/pricing";

const ext = {
  id: "ext",
  slug: "gallery-extension",
  name: "Gallery extension (3 months)",
  priceCents: 3000,
  maxQty: 4,
  isFee: false,
};
const rush = { id: "rush", slug: "rush", name: "Rush delivery", priceCents: 5000, maxQty: 1, isFee: true };
const extra = {
  id: "img",
  slug: "extra-images",
  name: "Extra edited images",
  priceCents: 1000,
  maxQty: 50,
  isFee: false,
};
const catalog = [ext, rush, extra];
const standard = {
  id: "std",
  name: "Standard",
  priceCents: 40000,
  mandatoryFees: [{ label: "Booking fee", cents: 2500 }],
  includedAddOns: [],
};
const plus = {
  id: "plus",
  name: "Plus",
  priceCents: 42000,
  mandatoryFees: [{ label: "Booking fee", cents: 2500 }],
  includedAddOns: ["gallery-extension"],
};
const promo = {
  code: "SPRING",
  kind: "percent",
  percentOff: 10,
  amountOffCents: null,
  minSubtotalCents: 0,
  maxUses: 5,
  uses: 0,
  expiresAt: null,
  active: true,
};

describe("quote pricing", () => {
  it("the headline price includes mandatory fees; the total is the package price", () => {
    const r = priceQuote({ package: standard, catalog, addOns: [] });
    expect(r.totalCents).toBe(40000);
    expect(r.feeCents).toBe(2500);
    expect(r.lines.find((l) => l.description.includes("Booking fee"))?.amountCents).toBe(0);
  });

  it("a bundle shows the standalone price of what it includes (Plus = Standard + $20, extension sells for $30)", () => {
    const r = priceQuote({ package: plus, catalog, addOns: [] });
    const inc = r.lines.find((l) => l.description.startsWith("Included: Gallery extension"));
    expect(inc?.standaloneCents).toBe(3000);
    expect(plus.priceCents - standard.priceCents).toBe(2000);
    expect(r.totalCents).toBe(42000);
  });

  it("optional fees stay separate from the headline; add-ons honour max quantity; unknown and zero quantities are ignored", () => {
    const r = priceQuote({
      package: standard,
      catalog,
      addOns: [
        { id: "rush", qty: 1 },
        { id: "ext", qty: 9 },
        { id: "nope", qty: 1 },
        { id: "img", qty: 0 },
      ],
    });
    expect(r.lines.find((l) => l.kind === "optional-fee")?.amountCents).toBe(5000);
    expect(r.lines.find((l) => l.description.startsWith("Gallery extension"))?.qty).toBe(4);
    expect(r.totalCents).toBe(40000 + 5000 + 12000);
  });

  it("a promo discounts goods but not fees or tax, and tax is its own line on the discounted subtotal plus fees", () => {
    const r = priceQuote({
      package: standard,
      catalog,
      addOns: [{ id: "rush", qty: 1 }],
      promo,
      taxRateBp: 887.5 as never,
    });
    // goods = 40000 - 2500 mandatory = 37500; 10% off = 3750; fees = 2500 + 5000
    expect(r.discountCents).toBe(3750);
    expect(r.subtotalCents).toBe(37500 + 7500);
    const taxable = r.subtotalCents - r.discountCents;
    expect(r.taxCents).toBe(Math.round((taxable * 887.5) / 10000));
    expect(r.totalCents).toBe(taxable + r.taxCents);
  });

  it("a fixed code cannot make the price negative", () => {
    const big = { ...promo, kind: "amount", percentOff: null, amountOffCents: 999_999 };
    const r = priceQuote({ package: standard, catalog, addOns: [], promo: big });
    expect(r.discountCents).toBe(37500);
    expect(r.totalCents).toBeGreaterThanOrEqual(0);
  });

  it("refuses expired, used-up, inactive and under-minimum codes without discounting", () => {
    const now = new Date("2027-01-01");
    expect(checkPromo({ ...promo, expiresAt: new Date("2026-01-01") }, 1000, now)).toMatch(/expired/);
    expect(checkPromo({ ...promo, uses: 5 }, 1000, now)).toMatch(/used up/);
    expect(checkPromo({ ...promo, active: false }, 1000, now)).toMatch(/not active/);
    expect(checkPromo({ ...promo, minSubtotalCents: 50000 }, 1000, now)).toMatch(/at least/);
    const r = priceQuote({ package: standard, catalog, addOns: [], promo: { ...promo, uses: 5 } });
    expect(r.discountCents).toBe(0);
    expect(r.promoError).toMatch(/used up/);
  });

  it("a gift card pays part of the total after tax and the deposit never exceeds what is due", () => {
    const r = priceQuote({
      package: standard,
      catalog,
      addOns: [],
      giftBalanceCents: 10000,
      taxRateBp: 1000,
      deposit: { percent: 50 },
    });
    expect(r.totalCents).toBe(44000);
    expect(r.giftCents).toBe(10000);
    expect(r.dueCents).toBe(34000);
    expect(r.depositCents).toBe(17000);
    const all = priceQuote({
      package: standard,
      catalog,
      addOns: [],
      giftBalanceCents: 999_999,
      deposit: { cents: 5000 },
    });
    expect(all.giftCents).toBe(40000);
    expect(all.dueCents).toBe(0);
    expect(all.depositCents).toBe(0);
  });

  it("works with no package (add-ons only) and with nothing at all", () => {
    expect(priceQuote({ catalog, addOns: [{ id: "img", qty: 3 }] }).totalCents).toBe(3000);
    expect(priceQuote({ catalog, addOns: [] }).totalCents).toBe(0);
  });
});

describe("money display", () => {
  it("shows $XX for sample prices, real amounts otherwise, and a clearly-labelled estimate in other currencies", () => {
    expect(priceLabel(12345, true)).toBe("$XX");
    expect(priceLabel(12345, false)).toBe("$123.45");
    expect(formatMoney(5000, "eur", "en-US")).toContain("50.00");
    expect(approx(10000, "eur")).toMatch(/^about .*92\.00.* \(display only\)$/);
    expect(approx(10000, "usd")).toBeNull();
  });
});
