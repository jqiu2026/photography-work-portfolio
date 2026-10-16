import "server-only";
import { type Database, schema } from "@jerryqiu/db";
import { getPolicies } from "@jerryqiu/db/forms";
import { type PdfLine, renderPdf, wrapText } from "@jerryqiu/db/pdf";
import { eq } from "drizzle-orm";

const usd = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);

async function parts(db: Database, invoiceId: string) {
  const [inv] = await db.select().from(schema.studioInvoices).where(eq(schema.studioInvoices.id, invoiceId));
  const [job] = await db.select().from(schema.studioJobs).where(eq(schema.studioJobs.id, inv.jobId));
  const [client] = await db.select().from(schema.studioClients).where(eq(schema.studioClients.id, job.clientId));
  const payments = await db.select().from(schema.studioPayments).where(eq(schema.studioPayments.invoiceId, inv.id));
  const policies = await getPolicies(db);
  return {
    inv,
    job,
    client,
    payments: payments.filter((p) => p.status === "succeeded" || p.status === "refunded"),
    business: policies.businessName,
  };
}

export async function invoicePdf(db: Database, invoiceId: string): Promise<Uint8Array> {
  const { inv, job, client, payments, business } = await parts(db, invoiceId);
  const paid = payments.reduce(
    (n, p) =>
      n +
      (p.amountCents -
        p.tipCents -
        p.surchargeCents -
        Math.round((p.refundedCents * (p.amountCents - p.tipCents - p.surchargeCents)) / p.amountCents)),
    0,
  );
  const lines: PdfLine[] = [
    { text: business, size: 11 },
    { text: `Invoice ${inv.number}`, size: 22, bold: true, gapBefore: 6 },
    { text: `Status: ${inv.status}${inv.dueDate ? `   Due: ${inv.dueDate}` : ""}`, gapBefore: 4 },
    { text: `Billed to: ${client.name} <${client.email}>`, gapBefore: 10 },
    { text: `Job: ${job.title}` },
    { text: "Items", size: 13, bold: true, gapBefore: 14 },
  ];
  for (const l of inv.lines)
    for (const [i, t] of wrapText(`${l.description}   ${usd(l.amountCents)}`).entries())
      lines.push({ text: t, gapBefore: i ? 0 : 3 });
  lines.push({ text: `Total: ${usd(inv.totalCents)}`, size: 13, bold: true, gapBefore: 12 });
  if (paid) lines.push({ text: `Paid so far: ${usd(paid)}` });
  lines.push({ text: `Balance due: ${usd(Math.max(0, inv.totalCents - paid))}`, bold: true });
  lines.push({
    text: "Sales tax, where it applies, is shown on the quote and added at checkout.",
    size: 9,
    gapBefore: 18,
  });
  return renderPdf(`Invoice ${inv.number}`, lines);
}

export async function receiptPdf(db: Database, invoiceId: string): Promise<Uint8Array | null> {
  const { inv, client, payments, business } = await parts(db, invoiceId);
  if (!payments.length) return null;
  const lines: PdfLine[] = [
    { text: business },
    { text: `Receipt for invoice ${inv.number}`, size: 20, bold: true, gapBefore: 6 },
    { text: `Received from: ${client.name}`, gapBefore: 8 },
  ];
  for (const p of payments) {
    lines.push({
      text: `${(p.paidAt ?? p.createdAt).toISOString().slice(0, 10)}   ${usd(p.amountCents)}   ${p.method ?? p.provider}${p.receiptRef ? `   ref ${p.receiptRef}` : ""}`,
      gapBefore: 8,
    });
    if (p.tipCents) lines.push({ text: `   includes a tip of ${usd(p.tipCents)}`, size: 10 });
    if (p.surchargeCents) lines.push({ text: `   includes a card surcharge of ${usd(p.surchargeCents)}`, size: 10 });
    if (p.refundedCents) lines.push({ text: `   refunded: ${usd(p.refundedCents)}`, size: 10 });
  }
  lines.push({ text: "Thank you.", gapBefore: 16 });
  return renderPdf(`Receipt ${inv.number}`, lines);
}
