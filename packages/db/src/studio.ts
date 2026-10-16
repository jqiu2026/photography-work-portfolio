import { and, asc, desc, eq, isNull, like, sql } from "drizzle-orm";
import { confirmForInvoice } from "./calendar";
import type { Database } from "./client";
import { StudioError } from "./errors";
import * as s from "./schema";
import { hashPasscode, hashToken, invoiceNumber, newToken, sha256Hex, totalOf, verifyPasscode } from "./studio-crypto";

/**
 * Studio repository (Phase 3). Plain async functions over the shared schema; callers (server actions) add authorization,
 * rate limits and the audit log. Money is integer cents; tokens and passcodes are stored only as hashes.
 */
export const JOB_STEPS = ["inquiry", "booked", "shot", "editing", "delivered", "paid"] as const;
export type JobStep = (typeof JOB_STEPS)[number];

export { StudioError };

const email = (v: string) => v.trim().toLowerCase();
const isEmail = (v: string) => /^\S+@\S+\.\S+$/.test(v.trim());
const live = <T extends { deletedAt: unknown }>(t: T) => isNull(t.deletedAt as never);

/* ---- clients ---- */
export async function listClients(db: Database) {
  return db.select().from(s.studioClients).where(live(s.studioClients)).orderBy(asc(s.studioClients.name));
}
export async function createClient(
  db: Database,
  input: { name: string; email: string; phone?: string; notes?: string },
  by?: string,
) {
  if (input.name.trim().length < 2) throw new StudioError("Enter the client's name.");
  if (!isEmail(input.email)) throw new StudioError("Enter a valid email address.");
  const existing = await db
    .select()
    .from(s.studioClients)
    .where(and(eq(s.studioClients.email, email(input.email)), live(s.studioClients)));
  if (existing.length) throw new StudioError("A client with that email already exists.");
  const [row] = await db
    .insert(s.studioClients)
    .values({
      name: input.name.trim(),
      email: email(input.email),
      phone: input.phone?.trim() || null,
      notes: input.notes?.trim() || null,
      updatedBy: by,
    })
    .returning();
  return row;
}

/* ---- jobs ---- */
export async function listJobs(db: Database) {
  return db
    .select({ job: s.studioJobs, client: s.studioClients })
    .from(s.studioJobs)
    .innerJoin(s.studioClients, eq(s.studioJobs.clientId, s.studioClients.id))
    .where(live(s.studioJobs))
    .orderBy(desc(s.studioJobs.date), desc(s.studioJobs.createdAt));
}
export async function createJob(
  db: Database,
  input: { clientId: string; title: string; date?: string | null; location?: string; type?: string; feeCents?: number },
  by?: string,
) {
  const [c] = await db
    .select()
    .from(s.studioClients)
    .where(and(eq(s.studioClients.id, input.clientId), live(s.studioClients)));
  if (!c) throw new StudioError("Pick a client.");
  if (input.title.trim().length < 2) throw new StudioError("Give the job a title.");
  if (input.feeCents !== undefined && (!Number.isInteger(input.feeCents) || input.feeCents < 0))
    throw new StudioError("The fee must be a whole number of cents.");
  const [row] = await db
    .insert(s.studioJobs)
    .values({
      clientId: c.id,
      title: input.title.trim(),
      date: input.date || null,
      location: input.location?.trim() || null,
      type: input.type ?? "event",
      feeCents: input.feeCents ?? 0,
      updatedBy: by,
    })
    .returning();
  return row;
}
export async function advanceJob(db: Database, id: string, by?: string) {
  const [j] = await db
    .select()
    .from(s.studioJobs)
    .where(and(eq(s.studioJobs.id, id), live(s.studioJobs)));
  if (!j) throw new StudioError("Unknown job.");
  const i = JOB_STEPS.indexOf(j.status as JobStep);
  if (i < 0 || i >= JOB_STEPS.length - 1) return j;
  const [row] = await db
    .update(s.studioJobs)
    .set({ status: JOB_STEPS[i + 1], updatedAt: new Date(), updatedBy: by })
    .where(eq(s.studioJobs.id, id))
    .returning();
  return row;
}

/* ---- galleries ---- */
export async function listGalleries(db: Database) {
  return db
    .select({ gallery: s.studioGalleries, job: s.studioJobs })
    .from(s.studioGalleries)
    .innerJoin(s.studioJobs, eq(s.studioGalleries.jobId, s.studioJobs.id))
    .where(live(s.studioGalleries))
    .orderBy(desc(s.studioGalleries.createdAt));
}
export async function createGallery(
  db: Database,
  input: {
    jobId: string;
    title?: string;
    passcode?: string;
    accessMode?: "passcode" | "magic-link" | "both";
    mediaIds?: string[];
  },
  by?: string,
) {
  const [j] = await db
    .select()
    .from(s.studioJobs)
    .where(and(eq(s.studioJobs.id, input.jobId), live(s.studioJobs)));
  if (!j) throw new StudioError("Unknown job.");
  const mode = input.accessMode ?? "passcode";
  if (mode !== "magic-link") {
    if (!input.passcode || input.passcode.trim().length < 6)
      throw new StudioError("A passcode needs at least 6 characters.");
    // passcodes must be unique among live galleries (the portal opens a gallery from the passcode alone)
    const all = await db
      .select({ h: s.studioGalleries.passcodeHash })
      .from(s.studioGalleries)
      .where(live(s.studioGalleries));
    for (const g of all)
      if (await verifyPasscode(input.passcode, g.h)) throw new StudioError("That passcode is already used.");
  }
  const [row] = await db
    .insert(s.studioGalleries)
    .values({
      jobId: j.id,
      title: (input.title ?? j.title).trim(),
      accessMode: mode,
      passcodeHash: input.passcode ? await hashPasscode(input.passcode) : null,
      updatedBy: by,
    })
    .returning();
  if (input.mediaIds?.length)
    await db
      .insert(s.studioGalleryItems)
      .values(input.mediaIds.map((mediaId, i) => ({ galleryId: row.id, mediaId, sort: i })));
  return row;
}
export async function publishGallery(db: Database, id: string, by?: string) {
  const [row] = await db
    .update(s.studioGalleries)
    .set({ status: "published", updatedAt: new Date(), updatedBy: by })
    .where(eq(s.studioGalleries.id, id))
    .returning();
  return row;
}
/** Finds a published, unexpired gallery by passcode. Scans live galleries (a studio has tens); callers rate limit. */
export async function openGalleryWithPasscode(db: Database, passcode: string, now = new Date()) {
  const rows = await db
    .select()
    .from(s.studioGalleries)
    .where(and(live(s.studioGalleries), eq(s.studioGalleries.status, "published")));
  for (const g of rows) {
    if (g.accessMode === "magic-link") continue;
    if (g.expiresAt && g.expiresAt < now) continue;
    if (await verifyPasscode(passcode, g.passcodeHash)) return g;
  }
  return null;
}
export async function galleryItems(db: Database, galleryId: string) {
  return db
    .select({ mediaId: s.studioGalleryItems.mediaId, sort: s.studioGalleryItems.sort })
    .from(s.studioGalleryItems)
    .where(and(eq(s.studioGalleryItems.galleryId, galleryId), eq(s.studioGalleryItems.hidden, false)))
    .orderBy(asc(s.studioGalleryItems.sort));
}
export async function toggleFavorite(db: Database, galleryId: string, mediaId: string): Promise<string[]> {
  const inGallery = await db
    .select()
    .from(s.studioGalleryItems)
    .where(and(eq(s.studioGalleryItems.galleryId, galleryId), eq(s.studioGalleryItems.mediaId, mediaId)));
  if (!inGallery.length) throw new StudioError("That photograph is not in this gallery.");
  const existing = await db
    .select()
    .from(s.studioFavorites)
    .where(and(eq(s.studioFavorites.galleryId, galleryId), eq(s.studioFavorites.mediaId, mediaId)));
  if (existing.length)
    await db
      .delete(s.studioFavorites)
      .where(and(eq(s.studioFavorites.galleryId, galleryId), eq(s.studioFavorites.mediaId, mediaId)));
  else await db.insert(s.studioFavorites).values({ galleryId, mediaId });
  return (
    await db
      .select({ m: s.studioFavorites.mediaId })
      .from(s.studioFavorites)
      .where(eq(s.studioFavorites.galleryId, galleryId))
  ).map((r) => r.m);
}
export async function favorites(db: Database, galleryId: string) {
  return (
    await db
      .select({ m: s.studioFavorites.mediaId })
      .from(s.studioFavorites)
      .where(eq(s.studioFavorites.galleryId, galleryId))
  ).map((r) => r.m);
}

/* ---- contracts ---- */
export async function createContract(db: Database, input: { jobId: string; title: string; body: string }, by?: string) {
  const [j] = await db.select().from(s.studioJobs).where(eq(s.studioJobs.id, input.jobId));
  if (!j) throw new StudioError("Unknown job.");
  if (!input.body.trim()) throw new StudioError("The contract text is empty.");
  const [row] = await db
    .insert(s.studioContracts)
    .values({ jobId: j.id, title: input.title.trim() || "Agreement", body: input.body, updatedBy: by })
    .returning();
  return row;
}
/** Marks sent and returns the one-time link token (only its hash is stored). */
export async function sendContract(db: Database, id: string, now = new Date()) {
  const [c] = await db.select().from(s.studioContracts).where(eq(s.studioContracts.id, id));
  if (!c) throw new StudioError("Unknown contract.");
  if (c.status === "signed") throw new StudioError("This contract is already signed.");
  const { token, hash } = newToken();
  await db
    .update(s.studioContracts)
    .set({ status: "sent", tokenHash: hash, sentAt: now, updatedAt: now })
    .where(eq(s.studioContracts.id, id));
  return { token };
}
export async function contractByToken(db: Database, token: string, now = new Date()) {
  const [c] = await db
    .select()
    .from(s.studioContracts)
    .where(eq(s.studioContracts.tokenHash, hashToken(token)));
  if (!c || c.status === "void" || c.status === "draft") return null;
  if (c.status === "sent") {
    await db.update(s.studioContracts).set({ status: "viewed", viewedAt: now }).where(eq(s.studioContracts.id, c.id));
    return { ...c, status: "viewed" as const };
  }
  return c;
}
export async function signContract(
  db: Database,
  token: string,
  input: { signerName: string; agree: boolean; ipHash?: string; userAgent?: string },
  now = new Date(),
) {
  const [c] = await db
    .select()
    .from(s.studioContracts)
    .where(eq(s.studioContracts.tokenHash, hashToken(token)));
  if (!c || c.status === "void" || c.status === "draft") throw new StudioError("This signing link is not valid.");
  if (c.status === "signed") throw new StudioError("This contract is already signed.");
  if (input.signerName.trim().length < 2) throw new StudioError("Type your full name to sign.");
  if (!input.agree) throw new StudioError("Tick the box to agree before signing.");
  const [row] = await db
    .update(s.studioContracts)
    .set({
      status: "signed",
      signedAt: now,
      signerName: input.signerName.trim(),
      signerIpHash: input.ipHash ?? null,
      signerUserAgent: input.userAgent?.slice(0, 300) ?? null,
      documentSha256: sha256Hex(c.body),
      updatedAt: now,
    })
    .where(and(eq(s.studioContracts.id, c.id), sql`${s.studioContracts.status} <> 'signed'`))
    .returning();
  if (!row) throw new StudioError("This contract is already signed.");
  return row;
}
export async function listContracts(db: Database) {
  return db
    .select({ contract: s.studioContracts, job: s.studioJobs })
    .from(s.studioContracts)
    .innerJoin(s.studioJobs, eq(s.studioContracts.jobId, s.studioJobs.id))
    .where(live(s.studioContracts))
    .orderBy(desc(s.studioContracts.createdAt));
}

/* ---- invoices and payments ---- */
async function nextInvoiceNumber(db: Database, now: Date) {
  const year = now.getUTCFullYear();
  const rows = await db
    .select({ n: s.studioInvoices.number })
    .from(s.studioInvoices)
    .where(like(s.studioInvoices.number, `${year}-%`));
  const max = rows.reduce((m, r) => Math.max(m, Number(r.n.split("-")[1]) || 0), 0);
  return invoiceNumber(year, max + 1);
}
export async function createInvoice(
  db: Database,
  input: { jobId: string; lines: s.InvoiceLine[]; dueDate?: string | null },
  by?: string,
  now = new Date(),
) {
  const [j] = await db.select().from(s.studioJobs).where(eq(s.studioJobs.id, input.jobId));
  if (!j) throw new StudioError("Unknown job.");
  const lines = input.lines
    .filter((l) => l.description.trim() && Number.isInteger(l.amountCents) && l.amountCents > 0)
    .map((l) => ({ description: l.description.trim(), amountCents: l.amountCents }));
  if (!lines.length) throw new StudioError("Add at least one line with an amount.");
  const [row] = await db
    .insert(s.studioInvoices)
    .values({
      jobId: j.id,
      number: await nextInvoiceNumber(db, now),
      lines,
      totalCents: totalOf(lines),
      dueDate: input.dueDate ?? null,
      updatedBy: by,
    })
    .returning();
  return row;
}
export async function sendInvoice(db: Database, id: string, now = new Date()) {
  const [i] = await db.select().from(s.studioInvoices).where(eq(s.studioInvoices.id, id));
  if (!i) throw new StudioError("Unknown invoice.");
  if (i.status === "paid" || i.status === "void") throw new StudioError(`This invoice is ${i.status}.`);
  const { token, hash } = newToken();
  await db
    .update(s.studioInvoices)
    .set({ status: "sent", tokenHash: hash, sentAt: now, updatedAt: now })
    .where(eq(s.studioInvoices.id, id));
  return { token };
}
export async function invoiceByToken(db: Database, token: string) {
  const [i] = await db
    .select()
    .from(s.studioInvoices)
    .where(eq(s.studioInvoices.tokenHash, hashToken(token)));
  return i && i.status !== "void" && i.status !== "draft" ? i : null;
}
export async function listInvoices(db: Database) {
  return db
    .select({ invoice: s.studioInvoices, job: s.studioJobs })
    .from(s.studioInvoices)
    .innerJoin(s.studioJobs, eq(s.studioInvoices.jobId, s.studioJobs.id))
    .where(live(s.studioInvoices))
    .orderBy(desc(s.studioInvoices.createdAt));
}
/**
 * Records a payment once per (provider, providerRef): safe to call from retries and duplicate webhooks. Marks the invoice
 * partial or paid from the sum of succeeded payments, and moves the job to "paid" when every invoice of the job is paid.
 */
export async function recordPayment(
  db: Database,
  input: {
    invoiceId: string;
    provider: string;
    providerRef: string;
    amountCents: number;
    status: "succeeded" | "failed" | "pending" | "refunded";
    receiptRef?: string;
    raw?: Record<string, unknown>;
  },
  now = new Date(),
) {
  const [inv] = await db.select().from(s.studioInvoices).where(eq(s.studioInvoices.id, input.invoiceId));
  if (!inv) throw new StudioError("Unknown invoice.");
  const inserted = await db
    .insert(s.studioPayments)
    .values({
      invoiceId: inv.id,
      provider: input.provider,
      providerRef: input.providerRef,
      amountCents: input.amountCents,
      status: input.status,
      receiptRef: input.receiptRef ?? null,
      raw: input.raw ?? null,
      paidAt: input.status === "succeeded" ? now : null,
    })
    .onConflictDoNothing()
    .returning();
  const duplicate = inserted.length === 0;
  if (!duplicate && input.status === "succeeded") {
    const paid = await db
      .select({ a: s.studioPayments.amountCents })
      .from(s.studioPayments)
      .where(and(eq(s.studioPayments.invoiceId, inv.id), eq(s.studioPayments.status, "succeeded")));
    const sum = paid.reduce((n, p) => n + p.a, 0);
    const status = sum >= inv.totalCents ? "paid" : "partial";
    await db
      .update(s.studioInvoices)
      .set({ status, paidAt: status === "paid" ? now : null, updatedAt: now })
      .where(eq(s.studioInvoices.id, inv.id));
    // A paid deposit confirms the held appointment and books the job (it does not mark the whole job paid).
    const confirmed = status === "paid" ? await confirmForInvoice(db, inv.id, now) : [];
    if (status === "paid" && !confirmed.length) {
      const siblings = await db
        .select({ st: s.studioInvoices.status })
        .from(s.studioInvoices)
        .where(and(eq(s.studioInvoices.jobId, inv.jobId), live(s.studioInvoices)));
      if (siblings.every((x) => x.st === "paid" || x.st === "void"))
        await db.update(s.studioJobs).set({ status: "paid", updatedAt: now }).where(eq(s.studioJobs.id, inv.jobId));
    }
  }
  return { duplicate, payment: inserted[0] ?? null };
}

/* ---- bookings (inquiries / leads) ---- */
export type InquiryInput = {
  name: string;
  email: string;
  message: string;
  topic?: string;
  phone?: string;
  shootType?: string;
  eventDate?: string | null;
  location?: string;
  budget?: string;
  guests?: number | null;
  source?: string;
  referrer?: string;
  utm?: Record<string, string>;
  details?: Record<string, string>;
};

/**
 * Explainable 0 to 100 lead score: a base of 10, plus 20 for a date within a year, 15 for a stated budget, 10 each for a
 * phone number, a known shoot type, a location and a message of 80+ characters, and 15 for a referral or returning client.
 */
export function scoreLead(i: InquiryInput, now = new Date()): number {
  let n = 10;
  if (i.eventDate) {
    const days = (new Date(i.eventDate).getTime() - now.getTime()) / 86_400_000;
    if (days >= -1 && days <= 365) n += 20;
  }
  if (i.budget?.trim()) n += 15;
  if (i.phone?.trim()) n += 10;
  if (i.shootType?.trim()) n += 10;
  if (i.location?.trim()) n += 10;
  if (i.message.trim().length >= 80) n += 10;
  if (/referral|returning|friend/i.test(i.source ?? "")) n += 15;
  return Math.min(100, n);
}

export async function addInquiry(db: Database, input: InquiryInput, now = new Date()) {
  if (input.name.trim().length < 2) throw new StudioError("Enter your name.");
  if (!isEmail(input.email)) throw new StudioError("Enter a valid email address.");
  if (input.message.trim().length < 5) throw new StudioError("Tell me a little about the shoot.");
  const clean = (v?: string | null, max = 200) => (v?.trim() ? v.trim().slice(0, max) : null);
  const [row] = await db
    .insert(s.studioBookings)
    .values({
      name: input.name.trim().slice(0, 120),
      email: email(input.email),
      topic: input.topic?.trim().slice(0, 60) || input.shootType?.trim().slice(0, 60) || "General",
      message: input.message.trim().slice(0, 5000),
      phone: clean(input.phone, 40),
      shootType: clean(input.shootType, 40),
      eventDate: input.eventDate && /^\d{4}-\d{2}-\d{2}$/.test(input.eventDate) ? input.eventDate : null,
      location: clean(input.location),
      budget: clean(input.budget, 60),
      guests: Number.isInteger(input.guests) && (input.guests as number) >= 0 ? (input.guests as number) : null,
      source: clean(input.source, 80),
      referrer: clean(input.referrer, 300),
      utm: input.utm ?? null,
      details: input.details ?? null,
      score: scoreLead(input, now),
    })
    .returning();
  return row;
}
export async function addBooking(
  db: Database,
  input: { name: string; email: string; topic?: string; message: string },
) {
  return addInquiry(db, input);
}
export async function listBookings(db: Database) {
  return db.select().from(s.studioBookings).orderBy(desc(s.studioBookings.createdAt));
}
export async function convertBooking(db: Database, id: string, by?: string) {
  const [b] = await db.select().from(s.studioBookings).where(eq(s.studioBookings.id, id));
  if (!b) throw new StudioError("Unknown booking.");
  const [existing] = await db
    .select()
    .from(s.studioClients)
    .where(and(eq(s.studioClients.email, b.email), live(s.studioClients)));
  const client = existing ?? (await createClient(db, { name: b.name, email: b.email }, by));
  await db
    .update(s.studioBookings)
    .set({ status: "converted", clientId: client.id })
    .where(eq(s.studioBookings.id, id));
  return client;
}

/* ---- webhooks ---- */
/** True the first time an event id is seen, false for a replay. */
export async function claimWebhookEvent(db: Database, id: string, provider: string, type: string): Promise<boolean> {
  const r = await db.insert(s.webhookEvents).values({ id, provider, type }).onConflictDoNothing().returning();
  return r.length > 0;
}
