import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { canSell, licenseLines, licenseNumber, licensePdf, orderTotals, passThroughFee, stampScore } from "../src";

describe("rights", () => {
  it("sells originals and public-domain arrangements once published", () => {
    expect(canSell({ status: "published", rightsType: "original", licenseOnFile: false }).ok).toBe(true);
    expect(canSell({ status: "published", rightsType: "public-domain-arrangement", licenseOnFile: false }).ok).toBe(
      true,
    );
  });
  it("holds a copyrighted arrangement until a license is on file", () => {
    const r = canSell({ status: "published", rightsType: "arrangement-copyrighted", licenseOnFile: false });
    expect(r.ok).toBe(false);
    expect(canSell({ status: "published", rightsType: "arrangement-copyrighted", licenseOnFile: true }).ok).toBe(true);
  });
  it("never sells a draft", () => {
    expect(canSell({ status: "draft", rightsType: "original", licenseOnFile: true }).ok).toBe(false);
  });
});

describe("pricing", () => {
  it("passes Stripe's fee to the buyer so the seller keeps the subtotal", () => {
    for (const s of [100, 800, 1200, 1500, 9999]) {
      const total = s + passThroughFee(s);
      const stripeKeeps = Math.round(total * 0.029 + 30);
      expect(Math.abs(total - stripeKeeps - s)).toBeLessThanOrEqual(1);
    }
  });
  it("a free order has no fee", () => {
    expect(passThroughFee(0)).toBe(0);
    expect(orderTotals([{ productId: "a", title: "A", priceCents: 500 }], 500).totalCents).toBe(0);
  });
  it("totals add up and reject a discount over the subtotal", () => {
    const t = orderTotals([
      { productId: "a", title: "A", priceCents: 800 },
      { productId: "b", title: "B", priceCents: 1200 },
    ]);
    expect(t.subtotalCents).toBe(2000);
    expect(t.totalCents).toBe(2000 + t.feeCents);
    expect(() => orderTotals([{ productId: "a", title: "A", priceCents: 100 }], 200)).toThrow();
  });
  it("rejects fractional cents", () => {
    expect(() => passThroughFee(10.5)).toThrow();
  });
});

describe("license", () => {
  it("numbers are stable and distinct per line", () => {
    const a = licenseNumber("M-000042", 0, "s");
    expect(a).toBe(licenseNumber("M-000042", 0, "s"));
    expect(a).not.toBe(licenseNumber("M-000042", 1, "s"));
    expect(a).toMatch(/^JQM-[A-Z2-9]{4}-000042-1$/);
  });
  it("names the holder and tier", () => {
    const l = licenseLines({
      licenseNo: "JQM-AAAA-00001-1",
      tier: "ensemble",
      holder: "Ada",
      organization: "The Quartet",
      email: "a@example.com",
      title: "Piece",
      issuedAt: new Date("2027-01-02T00:00:00Z"),
    }).join("\n");
    expect(l).toContain("Ensemble license");
    expect(l).toContain("Ada (The Quartet)");
  });
});

describe("stamping", () => {
  const facts = {
    licenseNo: "JQM-AAAA-00001-1",
    tier: "personal" as const,
    holder: "Ada",
    email: "a@example.com",
    title: "Piece",
    issuedAt: new Date("2027-01-02T00:00:00Z"),
  };
  it("keeps every page, adds the license page and never touches the original", async () => {
    const src = await PDFDocument.create();
    src.addPage([400, 600]);
    src.addPage([400, 600]);
    const bytes = await src.save();
    const before = Buffer.from(bytes).toString("base64");
    const out = await PDFDocument.load(await stampScore(bytes, facts));
    expect(out.getPageCount()).toBe(3);
    expect(Buffer.from(bytes).toString("base64")).toBe(before);
    expect(out.getSubject()).toContain(facts.licenseNo);
  });
  it("makes a one-page license PDF", async () => {
    expect((await PDFDocument.load(await licensePdf(facts))).getPageCount()).toBe(1);
  });
});
