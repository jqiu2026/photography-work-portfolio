import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, describe, expect, it } from "vitest";
import type { Database } from "../src/client";
import * as com from "../src/commerce";
import * as schema from "../src/schema";
import * as st from "../src/studio";

const here = path.dirname(fileURLToPath(import.meta.url));
let db: Database;
let clientId: string;
beforeAll(async () => {
  const d = drizzle(await PGlite.create(), { schema, casing: "snake_case" });
  await migrate(d, { migrationsFolder: path.join(here, "../drizzle") });
  db = d as unknown as Database;
  clientId = (await st.createClient(db, { name: "Quote Client", email: "q@example.com" })).id;
  await com.seedSampleCatalog(db);
});

const pkg = async (name: string) => (await com.listPackages(db)).find((p) => p.name === name)!;

describe("catalog", () => {
  it("seeds a labelled SAMPLE catalog once, with Plus = Standard + $20 and the extension at $30", async () => {
    expect(await com.seedSampleCatalog(db)).toBe(false);
    const packages = await com.listPackages(db);
    expect(packages.map((p) => p.name)).toEqual(["Essentials", "Standard", "Plus"]);
    expect(packages.every((p) => p.isSample)).toBe(true);
    expect((await pkg("Plus")).priceCents - (await pkg("Standard")).priceCents).toBe(2000);
    const ext = (await com.listAddOns(db)).find((a) => a.slug.startsWith("gallery-extension"));
    expect(ext?.priceCents).toBe(3000);
  });
  it("refuses fees above the package price, bad prices and duplicate promo codes; makes unique slugs", async () => {
    await expect(
      com.savePackage(db, { name: "Bad", priceCents: 1000, mandatoryFees: [{ label: "x", cents: 2000 }] }),
    ).rejects.toThrow(/cannot exceed/);
    await expect(com.savePackage(db, { name: "Bad", priceCents: -1 })).rejects.toThrow();
    const a = await com.savePackage(db, { name: "STANDARD", priceCents: 100 });
    expect(a.slug).toBe("standard-2");
    await com.createPromo(db, { code: "WELCOME10", percentOff: 10 });
    await expect(com.createPromo(db, { code: "welcome10", percentOff: 5 })).rejects.toThrow(/already exists/);
    await expect(com.createPromo(db, { code: "x", percentOff: 5 })).rejects.toThrow();
  });
});

describe("quotes", () => {
  it("prices on the server from the catalog (a client cannot send prices), with tax as its own line", async () => {
    await com.savePaymentsSettings(db, { taxRateBp: 888, depositPercent: 30 });
    const std = await pkg("Standard");
    const q = await com.createQuote(db, { clientId, title: "Spring shoot", packageId: std.id, promoCode: "WELCOME10" });
    expect(q.number).toMatch(/^Q\d{4}-0001$/);
    expect(q.discountCents).toBe(3750);
    expect(q.taxCents).toBe(Math.round(((q.subtotalCents - q.discountCents) * 888) / 10000));
    expect(q.totalCents).toBe(q.subtotalCents - q.discountCents + q.taxCents);
    expect(q.depositCents).toBe(Math.round(q.totalCents * 0.3));
    expect(q.isSample).toBe(true);
    await expect(
      com.createQuote(db, { clientId, title: "Nope", packageId: std.id, promoCode: "nope" }),
    ).rejects.toThrow(/does not exist/);
    await expect(com.createQuote(db, { clientId, title: "Empty" })).rejects.toThrow(/Choose a package/);
  });

  it("send, view, upsell (re-priced server-side), accept once, and the job and invoices follow", async () => {
    const std = await pkg("Standard");
    const q = await com.createQuote(db, { clientId, title: "Full flow", packageId: std.id });
    expect(await com.quoteByToken(db, "not-a-token")).toBeNull();
    const { token } = await com.sendQuote(db, q.id);
    expect((await com.quoteByToken(db, token))?.status).toBe("viewed");
    const ext = (await com.listAddOns(db)).find((a) => a.slug.startsWith("gallery-extension"))!;
    const up = await com.repriceQuote(db, token, [
      { id: ext.id, qty: 2 },
      { id: "00000000-0000-4000-8000-000000000000", qty: 5 },
    ]);
    expect(up.lines.find((l) => l.refId === ext.id)?.qty).toBe(2);
    expect(up.totalCents).toBeGreaterThan(q.totalCents);
    // removing it again returns to the original price
    expect((await com.repriceQuote(db, token, [{ id: ext.id, qty: 0 }])).totalCents).toBe(q.totalCents);
    await expect(com.acceptQuote(db, token, { name: "A" })).rejects.toThrow(/full name/);
    const accepted = await com.acceptQuote(db, token, { name: "Quote Client", ipHash: "h" });
    expect(accepted.payToken).toBeTruthy();
    expect(accepted.depositCents).toBe(q.depositCents);
    const [row] = await db
      .select()
      .from(schema.studioQuotes)
      .where((await import("drizzle-orm")).eq(schema.studioQuotes.id, q.id));
    expect(row.status).toBe("accepted");
    expect(row.acceptedHash).toBe(com.quoteHash(row));
    const invoices = await db
      .select()
      .from(schema.studioInvoices)
      .where((await import("drizzle-orm")).eq(schema.studioInvoices.jobId, accepted.jobId));
    expect(invoices.map((i) => i.totalCents).sort((a, b) => a - b)).toEqual(
      [q.depositCents, q.totalCents - q.depositCents].sort((a, b) => a - b),
    );
    expect(invoices.find((i) => i.totalCents === q.depositCents && i.status === "sent")).toBeTruthy();
    // a second accept, a changed price and a decline all fail
    await expect(com.acceptQuote(db, token, { name: "Quote Client" })).rejects.toThrow(/accepted/);
    await expect(com.repriceQuote(db, token, [])).rejects.toThrow(/no longer/);
    await expect(com.declineQuote(db, token)).rejects.toThrow(/accepted/);
  });

  it("two people accepting at once: exactly one wins and only one job and invoice set is made", async () => {
    const std = await pkg("Essentials");
    const q = await com.createQuote(db, { clientId, title: "Race", packageId: std.id });
    const { token } = await com.sendQuote(db, q.id);
    const results = await Promise.allSettled([1, 2, 3].map((n) => com.acceptQuote(db, token, { name: `Person ${n}` })));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const jobs = (await db.select().from(schema.studioJobs)).filter((j) => j.title === "Race");
    expect(jobs).toHaveLength(1);
  });

  it("expired quotes cannot be accepted; declining works once", async () => {
    const std = await pkg("Essentials");
    const q = await com.createQuote(db, { clientId, title: "Old", packageId: std.id, validDays: 1 });
    const { token } = await com.sendQuote(db, q.id);
    const later = new Date(Date.now() + 3 * 86_400_000);
    await expect(com.acceptQuote(db, token, { name: "Late Person" }, later)).rejects.toThrow(/expired/);
    const q2 = await com.createQuote(db, { clientId, title: "Decline me", packageId: std.id });
    const t2 = (await com.sendQuote(db, q2.id)).token;
    await com.declineQuote(db, t2);
    await expect(com.declineQuote(db, t2)).rejects.toThrow(/declined/);
  });
});

describe("promo, referral and gift cards", () => {
  it("a promo with max uses is redeemed on acceptance and then refused", async () => {
    await com.createPromo(db, { code: "ONCE", percentOff: 20, maxUses: 1 });
    const std = await pkg("Essentials");
    const q = await com.createQuote(db, { clientId, title: "Promo A", packageId: std.id, promoCode: "once" });
    await com.acceptQuote(db, (await com.sendQuote(db, q.id)).token, { name: "Promo Person" });
    await expect(
      com.createQuote(db, { clientId, title: "Promo B", packageId: std.id, promoCode: "once" }),
    ).rejects.toThrow(/used up/);
  });
  it("referral codes remember the referrer; gift cards pay down the total and never go negative", async () => {
    const ref = await com.createReferralCode(db, clientId, 10);
    expect(ref.kind).toBe("referral");
    expect(ref.referrerClientId).toBe(clientId);
    const card = await com.createGiftCard(db, { cents: 10000, purchaserEmail: "Buyer@Example.com" });
    const std = await pkg("Essentials");
    const q = await com.createQuote(db, { clientId, title: "Gift", packageId: std.id, giftCode: card.code });
    expect(q.giftCents).toBe(Math.min(10000, q.totalCents));
    const accepted = await com.acceptQuote(db, (await com.sendQuote(db, q.id)).token, { name: "Gift Person" });
    expect(accepted.dueCents).toBe(q.totalCents - q.giftCents);
    const after = await com.findGiftCard(db, card.code);
    expect(after?.balanceCents).toBe(10000 - q.giftCents);
    expect(await com.redeemGiftCard(db, card.id, 999_999)).toBe(10000 - q.giftCents);
    expect(await com.redeemGiftCard(db, card.id, 1)).toBe(0);
    await expect(
      com.createQuote(db, { clientId, title: "Bad gift", packageId: std.id, giftCode: "gift-nope" }),
    ).rejects.toThrow(/not valid/);
    await expect(com.createGiftCard(db, { cents: 5 })).rejects.toThrow();
  });
});

describe("editing and deleting codes and gift cards", () => {
  it("edits what a code gives but not its code, refuses fewer uses than were used, and deletes it", async () => {
    const promo = await com.createPromo(db, { code: "spring10", percentOff: 10, maxUses: 5 });
    expect(await com.updatePromo(db, promo.id, { kind: "amount", amountOffCents: 2500, maxUses: 3 })).toBe("spring10");
    const [edited] = (await com.listPromos(db)).filter((p) => p.id === promo.id);
    expect(edited).toMatchObject({
      kind: "amount",
      amountOffCents: 2500,
      percentOff: null,
      maxUses: 3,
      code: "spring10",
    });
    await com.redeemPromo(db, promo.id);
    await com.redeemPromo(db, promo.id);
    await expect(com.updatePromo(db, promo.id, { kind: "percent", percentOff: 10, maxUses: 1 })).rejects.toThrow(
      "already used",
    );
    expect(await com.deletePromo(db, promo.id)).toBe("spring10");
    expect(await com.findPromo(db, "spring10")).toBeNull();
    await expect(com.deletePromo(db, promo.id)).rejects.toThrow("gone");
  });
  it("edits a gift card's balance with a ledger line, voids it, and deletes it with its ledger", async () => {
    const card = await com.createGiftCard(db, { cents: 5000, recipientName: "Sam" });
    await com.updateGiftCard(db, card.id, { recipientName: "Sam R.", balanceCents: 4000 });
    const [after] = (await com.listGiftCards(db)).filter((g) => g.id === card.id);
    expect(after).toMatchObject({ recipientName: "Sam R.", balanceCents: 4000 });
    await expect(com.updateGiftCard(db, card.id, { balanceCents: -5 })).rejects.toThrow("negative");
    await com.setGiftCardStatus(db, card.id, "void");
    expect(await com.findGiftCard(db, card.code)).toBeNull();
    expect(await com.deleteGiftCard(db, card.id)).toBe(card.code);
    expect((await com.listGiftCards(db)).some((g) => g.id === card.id)).toBe(false);
  });
});
