import "server-only";
import { type Database, schema } from "@jerryqiu/db";
import * as bill from "@jerryqiu/db/billing";
import { sendTemplate } from "@jerryqiu/email";
import { getSite } from "@jerryqiu/sites";
import { eq } from "drizzle-orm";

const usd = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);

/** Emails the pay link for an invoice that has just been sent. */
export async function emailInvoice(db: Database, invoiceId: string, token: string) {
  const [inv] = await db.select().from(schema.studioInvoices).where(eq(schema.studioInvoices.id, invoiceId));
  if (!inv) return;
  const [job] = await db.select().from(schema.studioJobs).where(eq(schema.studioJobs.id, inv.jobId));
  const [client] = await db.select().from(schema.studioClients).where(eq(schema.studioClients.id, job.clientId));
  await sendTemplate(
    db,
    client.email,
    "invoice-sent",
    {
      name: client.name,
      title: inv.number,
      amount: usd(inv.totalCents),
      date: inv.dueDate ?? undefined,
      link: `${getSite("photos").url}/client/pay/${token}`,
      linkLabel: "Pay the invoice",
    },
    { related: { type: "invoice", id: inv.id } },
  );
}

/** Runs the daily billing jobs: recurring invoices that are due, and instalments that fall due within a week. Safe to re-run. */
export async function runBillingJobs(db: Database, now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  const recurring = await bill.runRecurring(db, today, now);
  const installments = await bill.sendDueInstallments(db, today, 7, now);
  for (const r of recurring) await emailInvoice(db, r.invoiceId, r.token);
  for (const i of installments) await emailInvoice(db, i.invoice.id, i.token);
  return { recurring: recurring.length, installments: installments.length };
}
