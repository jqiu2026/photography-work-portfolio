import { and, asc, desc, eq, gte, ilike, isNotNull, isNull, lte, or, sql } from "drizzle-orm";
import type { Database } from "./client";
import { claimRun, notify } from "./automation";
import { StudioError } from "./errors";
import * as s from "./schema";

/**
 * Business operations: expenses and mileage (with a tax-time CSV), testimonials that cannot go public without recorded
 * consent, gear with double-booking warnings, and one call sheet per job. Money is integer cents.
 */

/* ---- expenses and mileage ---- */

export const EXPENSE_CATEGORIES = [
  "gear",
  "software",
  "travel",
  "meals",
  "marketing",
  "insurance",
  "education",
  "office",
  "fees",
  "other",
] as const;

/** Placeholder rate in cents per mile. TODO(owner): set the current IRS standard mileage rate with your accountant. */
export const DEFAULT_MILEAGE_CENTS = 70;

const isDay = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));

export type ExpenseInput = {
  kind?: "expense" | "mileage";
  spentOn: string;
  category?: string;
  description?: string;
  vendor?: string;
  /** Dollars-and-cents already converted to cents. Ignored for mileage. */
  amountCents?: number;
  /** Miles, may have one decimal place (mileage only). */
  miles?: number;
  rateCentsPerMile?: number;
  jobId?: string | null;
  receiptNote?: string;
};

export async function addExpense(db: Database, input: ExpenseInput) {
  if (!isDay(input.spentOn)) throw new StudioError("Enter the date.");
  const kind = input.kind ?? "expense";
  let amountCents = Math.round(input.amountCents ?? 0);
  let tenth: number | null = null;
  let rate: number | null = null;
  if (kind === "mileage") {
    const miles = input.miles ?? 0;
    if (!(miles > 0) || miles > 5000) throw new StudioError("Enter the miles driven (more than 0).");
    tenth = Math.round(miles * 10);
    rate = Math.round(input.rateCentsPerMile ?? DEFAULT_MILEAGE_CENTS);
    if (rate < 0 || rate > 500) throw new StudioError("That mileage rate looks wrong.");
    amountCents = Math.round((tenth * rate) / 10);
  } else if (!(amountCents > 0)) throw new StudioError("Enter the amount.");
  if (amountCents > 100_000_000) throw new StudioError("That amount is too large.");
  const category = kind === "mileage" ? "travel" : (input.category ?? "other");
  if (!(EXPENSE_CATEGORIES as readonly string[]).includes(category)) throw new StudioError("Pick a category.");
  const [row] = await db
    .insert(s.studioExpenses)
    .values({
      kind,
      spentOn: input.spentOn,
      category,
      description: (input.description ?? "").trim().slice(0, 300),
      vendor: input.vendor?.trim().slice(0, 120) || null,
      amountCents,
      tenthMiles: tenth,
      rateCentsPerMile: rate,
      jobId: input.jobId || null,
      receiptNote: input.receiptNote?.trim().slice(0, 300) || null,
    })
    .returning();
  return row as s.StudioExpense;
}

export async function deleteExpense(db: Database, id: string) {
  await db.delete(s.studioExpenses).where(eq(s.studioExpenses.id, id));
}

export async function listExpenses(db: Database, range?: { from?: string; to?: string }) {
  const where = [
    range?.from ? gte(s.studioExpenses.spentOn, range.from) : undefined,
    range?.to ? lte(s.studioExpenses.spentOn, range.to) : undefined,
  ].filter(Boolean);
  return db
    .select({ expense: s.studioExpenses, jobTitle: s.studioJobs.title })
    .from(s.studioExpenses)
    .leftJoin(s.studioJobs, eq(s.studioExpenses.jobId, s.studioJobs.id))
    .where(where.length ? and(...(where as never[])) : undefined)
    .orderBy(desc(s.studioExpenses.spentOn), desc(s.studioExpenses.createdAt));
}

export type ExpenseSummary = {
  totalCents: number;
  miles: number;
  byCategory: { category: string; cents: number }[];
};
export function summarizeExpenses(rows: s.StudioExpense[]): ExpenseSummary {
  const by = new Map<string, number>();
  let total = 0;
  let tenths = 0;
  for (const r of rows) {
    total += r.amountCents;
    tenths += r.tenthMiles ?? 0;
    by.set(r.category, (by.get(r.category) ?? 0) + r.amountCents);
  }
  return {
    totalCents: total,
    miles: tenths / 10,
    byCategory: [...by].map(([category, cents]) => ({ category, cents })).sort((a, b) => b.cents - a.cents),
  };
}

const csvCell = (v: string | number | null | undefined) => {
  let t = String(v ?? "");
  // a cell that starts with = + - @ would run as a formula in a spreadsheet
  if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`;
  return /[",\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};
/** One row per entry, for the accountant. */
export function expensesCsv(rows: { expense: s.StudioExpense; jobTitle: string | null }[]): string {
  const head = [
    "Date",
    "Type",
    "Category",
    "Description",
    "Vendor",
    "Job",
    "Miles",
    "Rate (cents per mile)",
    "Amount (USD)",
    "Receipt",
  ];
  const lines = rows.map(({ expense: e, jobTitle }) =>
    [
      e.spentOn,
      e.kind,
      e.category,
      e.description,
      e.vendor,
      jobTitle,
      e.tenthMiles != null ? (e.tenthMiles / 10).toFixed(1) : "",
      e.rateCentsPerMile ?? "",
      (e.amountCents / 100).toFixed(2),
      e.receiptNote,
    ]
      .map(csvCell)
      .join(","),
  );
  return `${[head.map(csvCell).join(","), ...lines].join("\r\n")}\r\n`;
}

/* ---- testimonials ---- */

export async function addTestimonial(
  db: Database,
  input: {
    displayName: string;
    quote: string;
    role?: string;
    clientId?: string | null;
    jobId?: string | null;
    consent?: { note: string };
  },
) {
  if (input.displayName.trim().length < 2) throw new StudioError("Enter how the person wants to be named.");
  if (input.quote.trim().length < 10) throw new StudioError("Enter what they said.");
  const [row] = await db
    .insert(s.studioTestimonials)
    .values({
      displayName: input.displayName.trim().slice(0, 80),
      quote: input.quote.trim().slice(0, 1200),
      role: input.role?.trim().slice(0, 80) || null,
      clientId: input.clientId || null,
      jobId: input.jobId || null,
      consentAt: input.consent ? new Date() : null,
      consentNote: input.consent?.note.trim().slice(0, 300) || null,
    })
    .returning();
  return row as s.StudioTestimonial;
}

export async function recordConsent(db: Database, id: string, note: string) {
  if (note.trim().length < 3) throw new StudioError("Say how they agreed (for example: email of 3 March).");
  await db
    .update(s.studioTestimonials)
    .set({ consentAt: new Date(), consentNote: note.trim().slice(0, 300) })
    .where(eq(s.studioTestimonials.id, id));
}

/** Publishing needs recorded consent; withdrawing consent also takes it down. */
export async function setTestimonialPublished(db: Database, id: string, on: boolean) {
  const [t] = await db.select().from(s.studioTestimonials).where(eq(s.studioTestimonials.id, id)).limit(1);
  if (!t) throw new StudioError("That testimonial no longer exists.");
  if (on && !t.consentAt) throw new StudioError("Record their consent first. Nothing goes public without it.");
  await db
    .update(s.studioTestimonials)
    .set({ publishedAt: on ? new Date() : null })
    .where(eq(s.studioTestimonials.id, id));
}

export async function withdrawConsent(db: Database, id: string) {
  await db
    .update(s.studioTestimonials)
    .set({ consentAt: null, consentNote: null, publishedAt: null })
    .where(eq(s.studioTestimonials.id, id));
}

export async function deleteTestimonial(db: Database, id: string) {
  await db.delete(s.studioTestimonials).where(eq(s.studioTestimonials.id, id));
}

export async function listTestimonials(db: Database) {
  return db.select().from(s.studioTestimonials).orderBy(desc(s.studioTestimonials.createdAt));
}

/** What the public site may show: published and consented only. */
export async function publicTestimonials(db: Database) {
  return db
    .select({
      id: s.studioTestimonials.id,
      displayName: s.studioTestimonials.displayName,
      role: s.studioTestimonials.role,
      quote: s.studioTestimonials.quote,
    })
    .from(s.studioTestimonials)
    .where(and(isNotNull(s.studioTestimonials.publishedAt), isNotNull(s.studioTestimonials.consentAt)))
    .orderBy(desc(s.studioTestimonials.publishedAt));
}

/* ---- gear ---- */

export const GEAR_KINDS = ["camera", "lens", "light", "drone", "audio", "other"] as const;

export async function addGear(db: Database, input: { name: string; kind?: string; notes?: string }) {
  if (input.name.trim().length < 2) throw new StudioError("Enter the name of the gear.");
  const kind = input.kind ?? "other";
  if (!(GEAR_KINDS as readonly string[]).includes(kind)) throw new StudioError("Pick a kind.");
  const [row] = await db
    .insert(s.studioGear)
    .values({ name: input.name.trim().slice(0, 100), kind, notes: input.notes?.trim().slice(0, 300) || null })
    .returning();
  return row as s.StudioGearRow;
}

export async function retireGear(db: Database, id: string, retired: boolean) {
  await db
    .update(s.studioGear)
    .set({ retiredAt: retired ? new Date() : null })
    .where(eq(s.studioGear.id, id));
}

export async function listGear(db: Database) {
  return db.select().from(s.studioGear).orderBy(asc(s.studioGear.kind), asc(s.studioGear.name));
}

/** Put a piece of gear on a job's day. Returns the other jobs that already have it that day (a warning, not a block). */
export async function assignGear(db: Database, input: { gearId: string; jobId: string; onDate: string }) {
  if (!isDay(input.onDate)) throw new StudioError("Enter the date.");
  await db.insert(s.studioGearUses).values(input).onConflictDoNothing();
  return gearConflicts(db, input.gearId, input.onDate);
}
export async function unassignGear(db: Database, input: { gearId: string; jobId: string; onDate: string }) {
  await db
    .delete(s.studioGearUses)
    .where(
      and(
        eq(s.studioGearUses.gearId, input.gearId),
        eq(s.studioGearUses.jobId, input.jobId),
        eq(s.studioGearUses.onDate, input.onDate),
      ),
    );
}
/** Jobs holding this gear on this day; more than one is a double booking. */
export async function gearConflicts(db: Database, gearId: string, onDate: string) {
  const rows = await db
    .select({ jobId: s.studioGearUses.jobId, title: s.studioJobs.title })
    .from(s.studioGearUses)
    .innerJoin(s.studioJobs, eq(s.studioGearUses.jobId, s.studioJobs.id))
    .where(and(eq(s.studioGearUses.gearId, gearId), eq(s.studioGearUses.onDate, onDate)));
  return rows.length > 1 ? rows : [];
}
export async function gearUses(db: Database, from: string) {
  return db
    .select({
      gearId: s.studioGearUses.gearId,
      jobId: s.studioGearUses.jobId,
      onDate: s.studioGearUses.onDate,
      jobTitle: s.studioJobs.title,
    })
    .from(s.studioGearUses)
    .innerJoin(s.studioJobs, eq(s.studioGearUses.jobId, s.studioJobs.id))
    .where(gte(s.studioGearUses.onDate, from))
    .orderBy(asc(s.studioGearUses.onDate));
}

/* ---- call sheets ---- */

export type CallSheetInput = {
  callTime?: string;
  location?: string;
  notes?: string;
  shots?: { text: string; done?: boolean }[];
  contacts?: { name: string; role?: string; phone?: string }[];
};
export async function saveCallSheet(db: Database, jobId: string, input: CallSheetInput) {
  const shots = (input.shots ?? [])
    .map((x) => ({ text: x.text.trim().slice(0, 200), done: Boolean(x.done) }))
    .filter((x) => x.text)
    .slice(0, 100);
  const contacts = (input.contacts ?? [])
    .map((c) => ({
      name: c.name.trim().slice(0, 80),
      role: (c.role ?? "").trim().slice(0, 60),
      phone: (c.phone ?? "").trim().slice(0, 40),
    }))
    .filter((c) => c.name)
    .slice(0, 30);
  const values = {
    callTime: input.callTime?.trim().slice(0, 40) || null,
    location: input.location?.trim().slice(0, 200) || null,
    notes: input.notes?.trim().slice(0, 4000) || null,
    shots,
    contacts,
    updatedAt: new Date(),
  };
  const [row] = await db
    .insert(s.studioCallSheets)
    .values({ jobId, ...values })
    .onConflictDoUpdate({ target: s.studioCallSheets.jobId, set: values })
    .returning();
  return row as s.StudioCallSheet;
}
export async function getCallSheet(db: Database, jobId: string) {
  const [row] = await db.select().from(s.studioCallSheets).where(eq(s.studioCallSheets.jobId, jobId)).limit(1);
  return row ?? null;
}
export async function listCallSheets(db: Database) {
  return db
    .select({ sheet: s.studioCallSheets, job: s.studioJobs })
    .from(s.studioCallSheets)
    .innerJoin(s.studioJobs, eq(s.studioCallSheets.jobId, s.studioJobs.id))
    .orderBy(desc(s.studioJobs.date));
}

/** How many of each are on file (for the Studio overview and the features page). */
export async function businessCounts(db: Database) {
  const [e] = await db.select({ c: sql<number>`count(*)::int` }).from(s.studioExpenses);
  const [g] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(s.studioGear)
    .where(isNull(s.studioGear.retiredAt));
  const [t] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(s.studioTestimonials)
    .where(isNotNull(s.studioTestimonials.publishedAt));
  const [c] = await db.select({ c: sql<number>`count(*)::int` }).from(s.studioCallSheets);
  return { expenses: e?.c ?? 0, gear: g?.c ?? 0, testimonials: t?.c ?? 0, callSheets: c?.c ?? 0 };
}

/* ---- search across the studio ---- */

export type SearchHit = {
  kind: "client" | "job" | "gallery" | "invoice" | "testimonial" | "expense";
  id: string;
  label: string;
  detail: string;
  href: string;
};

/** Escapes % and _ so a search for "50%" matches the text, not everything. */
const like = (q: string) => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

/**
 * A few best matches from each part of the studio for one query (name, email, title, number, quote text). Deleted
 * records never appear. Two letters or more; at most 5 per kind.
 */
export async function searchStudio(db: Database, query: string): Promise<SearchHit[]> {
  const q = query.trim().slice(0, 80);
  if (q.length < 2) return [];
  const pat = like(q);
  const [clients, jobs, galleries, invoices, testimonials, expenses] = await Promise.all([
    db
      .select({ id: s.studioClients.id, name: s.studioClients.name, email: s.studioClients.email })
      .from(s.studioClients)
      .where(
        and(isNull(s.studioClients.deletedAt), or(ilike(s.studioClients.name, pat), ilike(s.studioClients.email, pat))),
      )
      .limit(5),
    db
      .select({
        id: s.studioJobs.id,
        title: s.studioJobs.title,
        date: s.studioJobs.date,
        location: s.studioJobs.location,
      })
      .from(s.studioJobs)
      .where(and(isNull(s.studioJobs.deletedAt), or(ilike(s.studioJobs.title, pat), ilike(s.studioJobs.location, pat))))
      .limit(5),
    db
      .select({ id: s.studioGalleries.id, title: s.studioGalleries.title, slug: s.studioGalleries.slug })
      .from(s.studioGalleries)
      .where(
        and(
          isNull(s.studioGalleries.deletedAt),
          or(ilike(s.studioGalleries.title, pat), ilike(s.studioGalleries.slug, pat)),
        ),
      )
      .limit(5),
    db
      .select({ id: s.studioInvoices.id, number: s.studioInvoices.number, status: s.studioInvoices.status })
      .from(s.studioInvoices)
      .where(ilike(s.studioInvoices.number, pat))
      .limit(5),
    db
      .select({
        id: s.studioTestimonials.id,
        name: s.studioTestimonials.displayName,
        quote: s.studioTestimonials.quote,
      })
      .from(s.studioTestimonials)
      .where(or(ilike(s.studioTestimonials.displayName, pat), ilike(s.studioTestimonials.quote, pat)))
      .limit(5),
    db
      .select({
        id: s.studioExpenses.id,
        description: s.studioExpenses.description,
        vendor: s.studioExpenses.vendor,
        on: s.studioExpenses.spentOn,
      })
      .from(s.studioExpenses)
      .where(or(ilike(s.studioExpenses.description, pat), ilike(s.studioExpenses.vendor, pat)))
      .limit(5),
  ]);
  return [
    ...clients.map(
      (c): SearchHit => ({ kind: "client", id: c.id, label: c.name, detail: c.email, href: "/studio/clients" }),
    ),
    ...jobs.map(
      (j): SearchHit => ({
        kind: "job",
        id: j.id,
        label: j.title,
        detail: [j.date, j.location].filter(Boolean).join(" · ") || "Job",
        href: "/studio/shoots",
      }),
    ),
    ...galleries.map(
      (g): SearchHit => ({
        kind: "gallery",
        id: g.id,
        label: g.title,
        detail: g.slug ? `/g/${g.slug}` : "Gallery",
        href: `/studio/gallery/${g.id}`,
      }),
    ),
    ...invoices.map(
      (i): SearchHit => ({
        kind: "invoice",
        id: i.id,
        label: `Invoice ${i.number}`,
        detail: i.status,
        href: "/studio/invoices",
      }),
    ),
    ...testimonials.map(
      (t): SearchHit => ({
        kind: "testimonial",
        id: t.id,
        label: t.name,
        detail: t.quote.slice(0, 70),
        href: "/studio/testimonials",
      }),
    ),
    ...expenses.map(
      (e): SearchHit => ({
        kind: "expense",
        id: e.id,
        label: e.description || e.vendor || "Expense",
        detail: `${e.on}${e.vendor ? ` · ${e.vendor}` : ""}`,
        href: "/studio/expenses",
      }),
    ),
  ];
}

/* ---- usage-rights tracker ---- */

export type LicenseState = "perpetual" | "active" | "expiring" | "expired";
/** `expiring` is the last 60 days of a term. A signed license with no end date is perpetual. */
export function licenseState(expiresAt: Date | null, now = new Date(), soonDays = 60): LicenseState {
  if (!expiresAt) return "perpetual";
  if (expiresAt.getTime() < now.getTime()) return "expired";
  return expiresAt.getTime() - now.getTime() <= soonDays * 86_400_000 ? "expiring" : "active";
}

/** Signed contracts and licenses that grant usage rights (personal or commercial), with where they stand today. */
export async function listLicenses(db: Database, now = new Date()) {
  const rows = await db
    .select({ contract: s.studioContracts, job: s.studioJobs, client: s.studioClients })
    .from(s.studioContracts)
    .innerJoin(s.studioJobs, eq(s.studioContracts.jobId, s.studioJobs.id))
    .innerJoin(s.studioClients, eq(s.studioJobs.clientId, s.studioClients.id))
    .where(
      and(
        isNotNull(s.studioContracts.signedAt),
        isNotNull(s.studioContracts.usageRights),
        isNull(s.studioContracts.deletedAt),
      ),
    )
    .orderBy(asc(s.studioContracts.licenseExpiresAt));
  return rows.map((r) => ({
    id: r.contract.id,
    title: r.contract.title,
    kind: r.contract.kind,
    jobTitle: r.job.title,
    clientName: r.client.name,
    clientEmail: r.client.email,
    personal: Boolean(r.contract.usageRights?.personal),
    commercial: Boolean(r.contract.usageRights?.commercial),
    termMonths: r.contract.usageRights?.termMonths ?? null,
    signedAt: r.contract.signedAt as Date,
    expiresAt: r.contract.licenseExpiresAt,
    state: licenseState(r.contract.licenseExpiresAt, now),
  }));
}

/**
 * Tells the owner (once per license, in the activity feed) when a license is in its last 30 days or has just ended.
 * Each license is claimed by a unique key, so the hourly job never repeats itself.
 */
export async function remindLicenses(db: Database, now = new Date()) {
  let told = 0;
  for (const l of await listLicenses(db, now)) {
    if (!l.expiresAt) continue;
    const soon = l.expiresAt.getTime() - now.getTime();
    const phase = soon < 0 ? "ended" : soon <= 30 * 86_400_000 ? "soon" : null;
    if (!phase) continue;
    const ok = await claimRun(db, {
      key: `license-${phase}:${l.id}`,
      rule: "license-expiring",
      entityType: "contract",
      entityId: l.id,
    });
    if (!ok) continue;
    await notify(db, {
      kind: "license",
      title:
        phase === "ended"
          ? `License ended: ${l.clientName}, ${l.jobTitle}`
          : `License ends ${l.expiresAt.toISOString().slice(0, 10)}: ${l.clientName}, ${l.jobTitle}`,
      body:
        phase === "ended"
          ? "The client's use of these photographs is no longer covered."
          : "Ask whether they want to renew.",
      link: "/studio/rights",
    });
    told++;
  }
  return told;
}
