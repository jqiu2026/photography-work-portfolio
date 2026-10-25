import { eq, or, sql } from "drizzle-orm";
import type { Database } from "./client";
import { StudioError } from "./errors";
import * as s from "./schema";

/**
 * Everything the studio holds about one client, as plain data the owner can hand over on request. Money records are
 * included as they stand. Nothing here carries a password hash or a token.
 */
export async function exportClientData(db: Database, clientId: string) {
  const [client] = await db.select().from(s.studioClients).where(eq(s.studioClients.id, clientId));
  if (!client) throw new StudioError("That client was not found.");
  const jobs = await db.select().from(s.studioJobs).where(eq(s.studioJobs.clientId, clientId));
  const jobIds = jobs.map((j) => j.id);
  const forJobs = async <T>(rows: (id: string) => Promise<T[]>) => (await Promise.all(jobIds.map(rows))).flat();
  const [bookings, messages, quotes, appointments, mail, subscriber] = await Promise.all([
    db
      .select()
      .from(s.studioBookings)
      .where(or(eq(s.studioBookings.clientId, clientId), eq(s.studioBookings.email, client.email))),
    db.select().from(s.studioMessages).where(eq(s.studioMessages.clientId, clientId)),
    db.select().from(s.studioQuotes).where(eq(s.studioQuotes.clientId, clientId)),
    db.select().from(s.appointments).where(eq(s.appointments.clientId, clientId)),
    db.select().from(s.emailLog).where(eq(s.emailLog.toEmail, client.email)),
    db.select().from(s.studioSubscribers).where(eq(s.studioSubscribers.email, client.email)),
  ]);
  const invoices = await forJobs((id) => db.select().from(s.studioInvoices).where(eq(s.studioInvoices.jobId, id)));
  const contracts = await forJobs((id) => db.select().from(s.studioContracts).where(eq(s.studioContracts.jobId, id)));
  return {
    exportedAt: new Date().toISOString(),
    client,
    jobs,
    invoices,
    contracts,
    quotes,
    bookings,
    messages,
    appointments,
    emails: mail.map((m) => ({ kind: m.kind, subject: m.subject, sentAt: m.createdAt })),
    newsletter: subscriber.map((x) => ({ email: x.email, createdAt: x.createdAt })),
  };
}

/**
 * Erases a person's contact details, as they ask under privacy law. Invoices, payments and signed contracts stay (the
 * law requires keeping them for tax and disputes) but lose their link to a name: the client becomes "Erased client".
 * Messages, booking requests, the portal account, the newsletter entry and logged email addresses are removed or blanked.
 */
export async function eraseClient(db: Database, clientId: string) {
  const [client] = await db.select().from(s.studioClients).where(eq(s.studioClients.id, clientId));
  if (!client) throw new StudioError("That client was not found.");
  if (client.name === ERASED) throw new StudioError("That client was already erased.");
  const email = client.email;
  const mask = `erased-${clientId.slice(0, 8)}@erased.invalid`;
  await db.transaction(async (tx) => {
    await tx.delete(s.studioMessages).where(eq(s.studioMessages.clientId, clientId));
    await tx.delete(s.clientAccounts).where(eq(s.clientAccounts.clientId, clientId));
    await tx.delete(s.studioSubscribers).where(eq(s.studioSubscribers.email, email));
    await tx
      .update(s.studioBookings)
      .set({ name: ERASED, email: mask, phone: null, message: "Erased at the person's request." })
      .where(or(eq(s.studioBookings.clientId, clientId), eq(s.studioBookings.email, email)));
    await tx
      .update(s.emailLog)
      .set({ toEmail: mask, bodyText: "Erased.", bodyHtml: null })
      .where(eq(s.emailLog.toEmail, email));
    await tx
      .update(s.studioClients)
      .set({
        name: ERASED,
        email: mask,
        phone: null,
        address: null,
        notes: null,
        tags: sql`'[]'::jsonb`,
        deletedAt: new Date(),
      })
      .where(eq(s.studioClients.id, clientId));
  });
  return { masked: mask };
}
const ERASED = "Erased client";
