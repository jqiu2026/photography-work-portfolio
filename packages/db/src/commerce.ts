import { randomBytes } from "node:crypto";
import { and, asc, desc, eq, isNull, like, sql } from "drizzle-orm";
import { z } from "zod";
import { getStudioSetting, setStudioSetting } from "./calendar";
import type { Database } from "./client";
import { StudioError } from "./errors";
import { type PriceResult, priceQuote } from "./pricing";
import * as s from "./schema";
import { createInvoice, createJob, sendInvoice } from "./studio";
import { hashToken, isIdRef, newToken, sha256Hex } from "./studio-crypto";

/** Packages, add-ons, promo and gift codes, and quotes with accept-and-pay. Plain functions; callers add auth and audit. */

const live = <T extends { deletedAt: unknown }>(t: T) => isNull(t.deletedAt as never);
const slugify = (v: string) =>
  v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

/* ---------- settings ---------- */
export const paymentsSettingsSchema = z.object({
  /** SAMPLE until the owner sets it (Q61). */
  depositPercent: z.number().min(0).max(100).default(30),
  quoteValidDays: z.number().int().min(1).max(365).default(14),
  taxRateBp: z.number().int().min(0).max(5000).default(0),
  taxLabel: z.string().default("Sales tax"),
  /** Tax is shown at checkout only; filing and remittance stay with the owner (Q52). */
  taxIsSample: z.boolean().default(true),
});
export type PaymentsSettings = z.infer<typeof paymentsSettingsSchema>;
export const getPaymentsSettings = (db: Database) => getStudioSetting(db, "payments", paymentsSettingsSchema);
export async function savePaymentsSettings(db: Database, patch: Partial<PaymentsSettings>) {
  const next = paymentsSettingsSchema.parse({ ...(await getPaymentsSettings(db)), ...patch });
  await setStudioSetting(db, "payments", next);
  return next;
}

/* ---------- packages ---------- */
export type PackageInput = {
  id?: string;
  name: string;
  tagline?: string;
  deliverables?: s.PackageDeliverable[];
  priceCents: number;
  mandatoryFees?: { label: string; cents: number }[];
  includedAddOns?: string[];
  tier?: number;
  featured?: boolean;
  visible?: boolean;
  isSample?: boolean;
};
const cleanDeliverables = (d: s.PackageDeliverable[] = []) =>
  d
    .map((x) => ({ label: x.label.trim().slice(0, 80), value: x.value.trim().slice(0, 120) }))
    .filter((x) => x.label && x.value);

export async function savePackage(db: Database, p: PackageInput, by?: string) {
  if (p.name.trim().length < 2) throw new StudioError("Name the package.");
  if (!Number.isInteger(p.priceCents) || p.priceCents < 0)
    throw new StudioError("The price is a whole number of cents.");
  const fees = (p.mandatoryFees ?? []).filter((f) => f.label.trim() && Number.isInteger(f.cents) && f.cents > 0);
  if (fees.reduce((n, f) => n + f.cents, 0) > p.priceCents)
    throw new StudioError("Mandatory fees cannot exceed the package price (they are included in it).");
  const values = {
    name: p.name.trim().slice(0, 80),
    tagline: p.tagline?.trim().slice(0, 160) || null,
    deliverables: cleanDeliverables(p.deliverables),
    priceCents: p.priceCents,
    mandatoryFees: fees,
    includedAddOns: p.includedAddOns ?? [],
    tier: p.tier ?? 1,
    featured: p.featured ?? false,
    visible: p.visible ?? true,
    isSample: p.isSample ?? true,
    updatedAt: new Date(),
    updatedBy: by,
  };
  if (p.id) {
    const [row] = await db.update(s.studioPackages).set(values).where(eq(s.studioPackages.id, p.id)).returning();
    if (!row) throw new StudioError("Unknown package.");
    return row;
  }
  const slug = await uniqueSlug(db, s.studioPackages, s.studioPackages.slug, slugify(p.name) || "package");
  const [row] = await db
    .insert(s.studioPackages)
    .values({ ...values, slug })
    .returning();
  return row;
}
export async function listPackages(db: Database, opts: { publicOnly?: boolean } = {}) {
  return db
    .select()
    .from(s.studioPackages)
    .where(and(live(s.studioPackages), opts.publicOnly ? eq(s.studioPackages.visible, true) : undefined))
    .orderBy(asc(s.studioPackages.tier), asc(s.studioPackages.sort), asc(s.studioPackages.name));
}
export async function deletePackage(db: Database, id: string) {
  await db.update(s.studioPackages).set({ deletedAt: new Date() }).where(eq(s.studioPackages.id, id));
}

/* ---------- add-ons ---------- */
export type AddOnInput = {
  id?: string;
  name: string;
  description?: string;
  priceCents: number;
  unit?: string;
  maxQty?: number;
  isFee?: boolean;
  upsell?: boolean;
  visible?: boolean;
  isSample?: boolean;
};
export async function saveAddOn(db: Database, a: AddOnInput, by?: string) {
  if (a.name.trim().length < 2) throw new StudioError("Name the add-on.");
  if (!Number.isInteger(a.priceCents) || a.priceCents < 0)
    throw new StudioError("The price is a whole number of cents.");
  const values = {
    name: a.name.trim().slice(0, 80),
    description: a.description?.trim().slice(0, 300) || null,
    priceCents: a.priceCents,
    unit: a.unit?.trim().slice(0, 30) || "each",
    maxQty: Math.max(1, Math.min(200, a.maxQty ?? 1)),
    isFee: a.isFee ?? false,
    upsell: a.upsell ?? true,
    visible: a.visible ?? true,
    isSample: a.isSample ?? true,
    updatedAt: new Date(),
    updatedBy: by,
  };
  if (a.id) {
    const [row] = await db.update(s.studioAddOns).set(values).where(eq(s.studioAddOns.id, a.id)).returning();
    if (!row) throw new StudioError("Unknown add-on.");
    return row;
  }
  const slug = await uniqueSlug(db, s.studioAddOns, s.studioAddOns.slug, slugify(a.name) || "add-on");
  const [row] = await db
    .insert(s.studioAddOns)
    .values({ ...values, slug })
    .returning();
  return row;
}
export async function listAddOns(db: Database, opts: { publicOnly?: boolean } = {}) {
  return db
    .select()
    .from(s.studioAddOns)
    .where(and(live(s.studioAddOns), opts.publicOnly ? eq(s.studioAddOns.visible, true) : undefined))
    .orderBy(asc(s.studioAddOns.sort), asc(s.studioAddOns.name));
}
export async function deleteAddOn(db: Database, id: string) {
  await db.update(s.studioAddOns).set({ deletedAt: new Date() }).where(eq(s.studioAddOns.id, id));
}

async function uniqueSlug(
  db: Database,
  table: typeof s.studioPackages | typeof s.studioAddOns,
  col: typeof s.studioPackages.slug | typeof s.studioAddOns.slug,
  base: string,
) {
  const rows = await db
    .select({ slug: col })
    .from(table)
    .where(like(col, `${base}%`));
  const taken = new Set(rows.map((r) => r.slug));
  if (!taken.has(base)) return base;
  for (let i = 2; i < 500; i++) if (!taken.has(`${base}-${i}`)) return `${base}-${i}`;
  return `${base}-${randomBytes(3).toString("hex")}`;
}

/* ---------- promo codes and gift cards ---------- */
const normCode = (c: string) => c.trim().toLowerCase().replace(/\s+/g, "");

export async function createPromo(
  db: Database,
  p: {
    code: string;
    kind?: "percent" | "amount" | "referral";
    percentOff?: number;
    amountOffCents?: number;
    minSubtotalCents?: number;
    maxUses?: number | null;
    expiresAt?: Date | null;
    referrerClientId?: string | null;
    note?: string;
  },
) {
  const code = normCode(p.code);
  if (!/^[a-z0-9_-]{3,32}$/.test(code))
    throw new StudioError("A code is 3 to 32 letters, numbers, dashes or underscores.");
  const kind = p.kind ?? "percent";
  if (kind === "amount") {
    if (!Number.isInteger(p.amountOffCents) || (p.amountOffCents as number) <= 0)
      throw new StudioError("Enter an amount off.");
  } else if (!Number.isInteger(p.percentOff) || (p.percentOff as number) < 1 || (p.percentOff as number) > 100)
    throw new StudioError("Enter a percentage between 1 and 100.");
  const [dup] = await db.select().from(s.studioPromoCodes).where(eq(s.studioPromoCodes.code, code));
  if (dup) throw new StudioError("That code already exists.");
  const [row] = await db
    .insert(s.studioPromoCodes)
    .values({
      code,
      kind,
      percentOff: kind === "amount" ? null : (p.percentOff as number),
      amountOffCents: kind === "amount" ? (p.amountOffCents as number) : null,
      minSubtotalCents: p.minSubtotalCents ?? 0,
      maxUses: p.maxUses ?? null,
      expiresAt: p.expiresAt ?? null,
      referrerClientId: p.referrerClientId ?? null,
      note: p.note?.slice(0, 200) ?? null,
    })
    .returning();
  return row;
}
export async function listPromos(db: Database) {
  return db.select().from(s.studioPromoCodes).orderBy(desc(s.studioPromoCodes.createdAt));
}
export async function setPromoActive(db: Database, id: string, active: boolean) {
  await db.update(s.studioPromoCodes).set({ active }).where(eq(s.studioPromoCodes.id, id));
}
export async function findPromo(db: Database, code: string | null | undefined) {
  if (!code?.trim()) return null;
  const [row] = await db
    .select()
    .from(s.studioPromoCodes)
    .where(eq(s.studioPromoCodes.code, normCode(code)));
  return row ?? null;
}
/** Counts one use, only while uses < maxUses (atomic). */
export async function redeemPromo(db: Database, id: string): Promise<boolean> {
  const rows = await db
    .update(s.studioPromoCodes)
    .set({ uses: sql`${s.studioPromoCodes.uses} + 1` })
    .where(
      and(
        eq(s.studioPromoCodes.id, id),
        sql`(${s.studioPromoCodes.maxUses} is null or ${s.studioPromoCodes.uses} < ${s.studioPromoCodes.maxUses})`,
      ),
    )
    .returning({ id: s.studioPromoCodes.id });
  return rows.length > 0;
}
/** A referral code for a client: a percent code that remembers who referred. */
export async function createReferralCode(db: Database, clientId: string, percentOff = 10) {
  const [c] = await db.select().from(s.studioClients).where(eq(s.studioClients.id, clientId));
  if (!c) throw new StudioError("Unknown client.");
  const base = `ref-${slugify(c.name).slice(0, 12) || "friend"}`;
  for (let i = 0; i < 20; i++) {
    const code = i ? `${base}-${randomBytes(2).toString("hex")}` : base;
    if (!(await findPromo(db, code)))
      return createPromo(db, {
        code,
        kind: "referral",
        percentOff,
        referrerClientId: clientId,
        maxUses: 1,
        note: `Referred by ${c.name}`,
      });
  }
  throw new StudioError("Could not make a referral code. Try again.");
}

export async function createGiftCard(
  db: Database,
  g: { cents: number; purchaserEmail?: string; recipientName?: string; expiresAt?: Date | null },
) {
  if (!Number.isInteger(g.cents) || g.cents < 100) throw new StudioError("A gift card is at least one dollar.");
  const code = `gift-${randomBytes(5).toString("hex")}`;
  const [row] = await db
    .insert(s.studioGiftCards)
    .values({
      code,
      initialCents: g.cents,
      balanceCents: g.cents,
      purchaserEmail: g.purchaserEmail?.trim().toLowerCase() || null,
      recipientName: g.recipientName?.trim() || null,
      expiresAt: g.expiresAt ?? null,
    })
    .returning();
  await db.insert(s.studioGiftLedger).values({ cardId: row.id, deltaCents: g.cents, note: "Issued" });
  return row;
}
export async function findGiftCard(db: Database, code: string | null | undefined, now = new Date()) {
  if (!code?.trim()) return null;
  const [row] = await db
    .select()
    .from(s.studioGiftCards)
    .where(eq(s.studioGiftCards.code, normCode(code)));
  if (!row || row.status !== "active" || (row.expiresAt && row.expiresAt < now)) return null;
  return row;
}
/** Takes up to `cents` from a card, never below zero, and logs it. Returns what was taken. */
export async function redeemGiftCard(db: Database, cardId: string, cents: number, quoteId?: string): Promise<number> {
  if (cents <= 0) return 0;
  const [card] = await db.select().from(s.studioGiftCards).where(eq(s.studioGiftCards.id, cardId));
  if (!card) return 0;
  const take = Math.min(cents, card.balanceCents);
  if (take <= 0) return 0;
  const rows = await db
    .update(s.studioGiftCards)
    .set({ balanceCents: sql`${s.studioGiftCards.balanceCents} - ${take}` })
    .where(and(eq(s.studioGiftCards.id, cardId), sql`${s.studioGiftCards.balanceCents} >= ${take}`))
    .returning();
  if (!rows.length) return 0;
  await db.insert(s.studioGiftLedger).values({ cardId, deltaCents: -take, quoteId, note: "Redeemed on a quote" });
  return take;
}

/* ---------- quotes ---------- */
export type QuoteInput = {
  clientId: string;
  title: string;
  packageId?: string | null;
  addOns?: { id: string; qty: number }[];
  promoCode?: string;
  giftCode?: string;
  intro?: string;
  terms?: string;
  taxRateBp?: number;
  taxLabel?: string;
  validDays?: number;
  jobId?: string | null;
  depositPercent?: number;
};

async function priced(
  db: Database,
  input: Pick<QuoteInput, "packageId" | "addOns" | "promoCode" | "giftCode" | "taxRateBp" | "depositPercent">,
  now: Date,
) {
  const [pkgRow] = input.packageId
    ? await db
        .select()
        .from(s.studioPackages)
        .where(and(eq(s.studioPackages.id, input.packageId), live(s.studioPackages)))
    : [];
  if (input.packageId && !pkgRow) throw new StudioError("Unknown package.");
  const catalog = await listAddOns(db);
  const promo = await findPromo(db, input.promoCode);
  if (input.promoCode?.trim() && !promo) throw new StudioError("That promo code does not exist.");
  const gift = await findGiftCard(db, input.giftCode, now);
  if (input.giftCode?.trim() && !gift) throw new StudioError("That gift card is not valid.");
  const settings = await getPaymentsSettings(db);
  const result: PriceResult = priceQuote({
    package: pkgRow ?? null,
    catalog,
    addOns: input.addOns ?? [],
    promo,
    giftBalanceCents: gift?.balanceCents ?? 0,
    taxRateBp: input.taxRateBp ?? settings.taxRateBp,
    deposit: { percent: input.depositPercent ?? settings.depositPercent },
    now,
  });
  if (result.promoError) throw new StudioError(result.promoError);
  return { result, pkg: pkgRow ?? null, promo, gift, settings };
}

async function nextQuoteNumber(db: Database, now: Date) {
  const year = now.getUTCFullYear();
  const rows = await db
    .select({ n: s.studioQuotes.number })
    .from(s.studioQuotes)
    .where(like(s.studioQuotes.number, `Q${year}-%`));
  const max = rows.reduce((m, r) => Math.max(m, Number(r.n.split("-")[1]) || 0), 0);
  return `Q${year}-${String(max + 1).padStart(4, "0")}`;
}

export async function createQuote(db: Database, input: QuoteInput, by?: string, now = new Date()) {
  const [client] = await db
    .select()
    .from(s.studioClients)
    .where(and(eq(s.studioClients.id, input.clientId), live(s.studioClients)));
  if (!client) throw new StudioError("Pick a client.");
  if (input.title.trim().length < 2) throw new StudioError("Give the quote a title.");
  const { result, pkg, gift, settings } = await priced(db, input, now);
  if (!result.lines.length) throw new StudioError("Choose a package or at least one add-on.");
  const days = input.validDays ?? settings.quoteValidDays;
  const [row] = await db
    .insert(s.studioQuotes)
    .values({
      number: await nextQuoteNumber(db, now),
      clientId: client.id,
      jobId: input.jobId ?? null,
      title: input.title.trim().slice(0, 160),
      intro: input.intro?.trim().slice(0, 2000) || null,
      terms: input.terms?.trim().slice(0, 6000) || null,
      packageId: pkg?.id ?? null,
      lines: result.lines,
      subtotalCents: result.subtotalCents,
      discountCents: result.discountCents,
      taxRateBp: input.taxRateBp ?? settings.taxRateBp,
      taxCents: result.taxCents,
      taxLabel: (input.taxLabel ?? settings.taxLabel) || "Sales tax",
      totalCents: result.totalCents,
      giftCents: result.giftCents,
      depositCents: result.depositCents,
      promoCode: input.promoCode?.trim().toLowerCase() || null,
      giftCode: gift?.code ?? null,
      validUntil: new Date(now.getTime() + days * 86_400_000),
      isSample: Boolean(pkg?.isSample),
      updatedBy: by,
    })
    .returning();
  return row;
}

export async function listQuotes(db: Database) {
  return db
    .select({ quote: s.studioQuotes, client: s.studioClients })
    .from(s.studioQuotes)
    .innerJoin(s.studioClients, eq(s.studioClients.id, s.studioQuotes.clientId))
    .where(live(s.studioQuotes))
    .orderBy(desc(s.studioQuotes.createdAt));
}

export async function sendQuote(db: Database, id: string, now = new Date()) {
  const [q] = await db.select().from(s.studioQuotes).where(eq(s.studioQuotes.id, id));
  if (!q) throw new StudioError("Unknown quote.");
  if (q.status === "accepted" || q.status === "void") throw new StudioError(`This quote is ${q.status}.`);
  const { token, hash } = newToken();
  await db
    .update(s.studioQuotes)
    .set({ status: "sent", tokenHash: hash, sentAt: now, updatedAt: now })
    .where(eq(s.studioQuotes.id, id));
  return { token };
}

export async function quoteByToken(db: Database, token: string, now = new Date()) {
  const [q] = await db
    .select()
    .from(s.studioQuotes)
    .where(isIdRef(token) ? eq(s.studioQuotes.id, token.slice(3)) : eq(s.studioQuotes.tokenHash, hashToken(token)));
  if (!q || q.status === "draft" || q.status === "void" || q.deletedAt) return null;
  if ((q.status === "sent" || q.status === "viewed") && q.validUntil && q.validUntil < now) {
    await db.update(s.studioQuotes).set({ status: "expired" }).where(eq(s.studioQuotes.id, q.id));
    return { ...q, status: "expired" as const };
  }
  if (q.status === "sent") {
    await db
      .update(s.studioQuotes)
      .set({ status: "viewed", viewedAt: now })
      .where(and(eq(s.studioQuotes.id, q.id), eq(s.studioQuotes.status, "sent")));
    return { ...q, status: "viewed" as const, viewedAt: now };
  }
  return q;
}

/** Upsells: the client picks extra add-ons on the quote page; the whole quote is re-priced on the server. */
export async function repriceQuote(
  db: Database,
  token: string,
  extra: { id: string; qty: number }[],
  now = new Date(),
) {
  const q = await quoteByToken(db, token, now);
  if (!q || (q.status !== "sent" && q.status !== "viewed"))
    throw new StudioError("This quote can no longer be changed.");
  const upsellable = new Set((await listAddOns(db)).filter((a) => a.upsell && a.visible).map((a) => a.id));
  const base = q.lines
    .filter((l) => (l.kind === "addon" || l.kind === "optional-fee") && l.refId && l.unitCents > 0 && l.amountCents > 0)
    .map((l) => ({ id: l.refId as string, qty: l.qty }));
  const chosen = new Map(base.map((b) => [b.id, b.qty]));
  for (const e of extra) {
    if (!upsellable.has(e.id)) continue;
    if (e.qty <= 0) chosen.delete(e.id);
    else chosen.set(e.id, e.qty);
  }
  const { result } = await priced(
    db,
    {
      packageId: q.packageId,
      addOns: [...chosen].map(([id, qty]) => ({ id, qty })),
      promoCode: q.promoCode ?? undefined,
      giftCode: q.giftCode ?? undefined,
      taxRateBp: q.taxRateBp,
    },
    now,
  );
  const [row] = await db
    .update(s.studioQuotes)
    .set({
      lines: result.lines,
      subtotalCents: result.subtotalCents,
      discountCents: result.discountCents,
      taxCents: result.taxCents,
      totalCents: result.totalCents,
      giftCents: result.giftCents,
      depositCents: result.depositCents,
      updatedAt: now,
    })
    .where(and(eq(s.studioQuotes.id, q.id), sql`${s.studioQuotes.status} in ('sent','viewed')`))
    .returning();
  if (!row) throw new StudioError("This quote can no longer be changed.");
  return row;
}

export const quoteHash = (
  q: Pick<
    s.StudioQuote,
    "lines" | "totalCents" | "taxCents" | "discountCents" | "giftCents" | "depositCents" | "title" | "terms"
  >,
) =>
  sha256Hex(
    JSON.stringify([
      q.title,
      q.lines,
      q.totalCents,
      q.taxCents,
      q.discountCents,
      q.giftCents,
      q.depositCents,
      q.terms ?? "",
    ]),
  );

/**
 * Accepting a quote (typed name, consent). Only one caller can win the status change. It records who and what was
 * accepted (content hash), books the job, redeems the promo and gift card, and creates a deposit invoice (sent, so the
 * client can pay at once) plus a draft balance invoice. Returns the deposit invoice link token, if there is one.
 */
export async function acceptQuote(
  db: Database,
  token: string,
  who: { name: string; ipHash?: string },
  now = new Date(),
) {
  if (who.name.trim().length < 2) throw new StudioError("Type your full name to accept.");
  const q = await quoteByToken(db, token, now);
  if (!q) throw new StudioError("This quote link is not valid.");
  if (q.status === "expired") throw new StudioError("This quote has expired. Ask for a new one.");
  if (q.status !== "sent" && q.status !== "viewed") throw new StudioError(`This quote is ${q.status}.`);
  const claimed = await db
    .update(s.studioQuotes)
    .set({
      status: "accepted",
      acceptedAt: now,
      acceptedBy: who.name.trim().slice(0, 120),
      acceptedIpHash: who.ipHash ?? null,
      acceptedHash: quoteHash(q),
      updatedAt: now,
    })
    .where(and(eq(s.studioQuotes.id, q.id), sql`${s.studioQuotes.status} in ('sent','viewed')`))
    .returning();
  if (!claimed.length) throw new StudioError("This quote was just accepted or changed. Reload the page.");

  if (q.promoCode) {
    const promo = await findPromo(db, q.promoCode);
    if (promo) await redeemPromo(db, promo.id);
  }
  let giftTaken = 0;
  if (q.giftCode && q.giftCents > 0) {
    const card = await findGiftCard(db, q.giftCode, now);
    if (card) giftTaken = await redeemGiftCard(db, card.id, q.giftCents, q.id);
  }
  const due = Math.max(0, q.totalCents - giftTaken);
  const deposit = Math.min(due, q.depositCents);

  let jobId = q.jobId;
  if (!jobId) {
    const job = await createJob(db, { clientId: q.clientId, title: q.title, feeCents: q.totalCents });
    jobId = job.id;
  }
  await db.update(s.studioJobs).set({ feeCents: q.totalCents, updatedAt: now }).where(eq(s.studioJobs.id, jobId));
  let payToken: string | null = null;
  let invoiceId: string | null = null;
  if (due > 0) {
    const first = deposit > 0 ? deposit : due;
    const inv = await createInvoice(db, {
      jobId,
      lines: [
        {
          description: deposit > 0 ? `Deposit for ${q.title} (${q.number})` : `${q.title} (${q.number})`,
          amountCents: first,
        },
      ],
    });
    invoiceId = inv.id;
    payToken = (await sendInvoice(db, inv.id, now)).token;
    if (deposit > 0 && due - deposit > 0)
      await createInvoice(db, {
        jobId,
        lines: [{ description: `Balance for ${q.title} (${q.number})`, amountCents: due - deposit }],
      });
  }
  await db.update(s.studioQuotes).set({ jobId, invoiceId, giftCents: giftTaken }).where(eq(s.studioQuotes.id, q.id));
  return { payToken, jobId, depositCents: deposit, dueCents: due };
}

export async function declineQuote(db: Database, token: string, now = new Date()) {
  const q = await quoteByToken(db, token, now);
  if (!q) throw new StudioError("This quote link is not valid.");
  const rows = await db
    .update(s.studioQuotes)
    .set({ status: "declined", updatedAt: now })
    .where(and(eq(s.studioQuotes.id, q.id), sql`${s.studioQuotes.status} in ('sent','viewed')`))
    .returning();
  if (!rows.length) throw new StudioError(`This quote is ${q.status}.`);
}

/**
 * SAMPLE catalog for a fresh install: clearly labelled, every price a placeholder (Q61). Plus = Standard + $20 and the
 * extension's standalone price is $30, as in the owner's illustration (also placeholders). Shared with the public
 * `/packages` page so it still works before a database exists.
 */
export const SAMPLE_CATALOG = {
  addOns: [
    {
      name: "Gallery extension (3 more months)",
      description: "Keeps your gallery online for three more months.",
      priceCents: 3000,
      unit: "per 3 months",
      maxQty: 4,
      upsell: true,
      isFee: false,
    },
    {
      name: "Extra edited images",
      description: "Additional fully edited photographs.",
      priceCents: 1000,
      unit: "per image",
      maxQty: 50,
      upsell: true,
      isFee: false,
    },
    {
      name: "Rush delivery",
      description: "Gallery within 48 hours.",
      priceCents: 5000,
      unit: "each",
      maxQty: 1,
      upsell: true,
      isFee: true,
    },
    {
      name: "Travel beyond the included radius",
      description: "Charged per trip.",
      priceCents: 4000,
      unit: "per trip",
      maxQty: 3,
      upsell: true,
      isFee: true,
    },
  ],
  packages: [
    {
      name: "Essentials",
      tagline: "A short shoot, a polished gallery.",
      tier: 1,
      priceCents: 20000,
      includedAddOns: [] as string[],
      deliverables: [
        { label: "Coverage", value: "1 hour" },
        { label: "Edited images", value: "25" },
        { label: "Gallery access", value: "3 months" },
      ],
    },
    {
      name: "Standard",
      tagline: "Room to breathe.",
      tier: 2,
      featured: true,
      priceCents: 40000,
      includedAddOns: [] as string[],
      deliverables: [
        { label: "Coverage", value: "2 hours" },
        { label: "Edited images", value: "60" },
        { label: "Gallery access", value: "3 months" },
      ],
    },
    {
      name: "Plus",
      tagline: "Standard, with more time online.",
      tier: 3,
      priceCents: 42000,
      includedAddOns: ["gallery-extension-3-more-months"],
      deliverables: [
        { label: "Coverage", value: "2 hours" },
        { label: "Edited images", value: "60" },
        { label: "Gallery access", value: "6 months" },
      ],
    },
  ],
  mandatoryFees: [{ label: "Booking fee", cents: 2500 }],
};

export async function seedSampleCatalog(db: Database) {
  if ((await listPackages(db)).length) return false;
  for (const a of SAMPLE_CATALOG.addOns) await saveAddOn(db, a);
  for (const p of SAMPLE_CATALOG.packages) await savePackage(db, { ...p, mandatoryFees: SAMPLE_CATALOG.mandatoryFees });
  return true;
}

/** Prices a quote without saving it (used to ask the tax provider what tax applies before the quote is created). */
export async function previewQuote(db: Database, input: Omit<QuoteInput, "clientId" | "title">, now = new Date()) {
  const { result } = await priced(db, { ...input, taxRateBp: 0 }, now);
  return result;
}
