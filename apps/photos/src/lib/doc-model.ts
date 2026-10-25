import "server-only";
import { type Database, schema } from "@jerryqiu/db";
import { getPolicies } from "@jerryqiu/db/forms";
import { type PdfLine, renderPdf, wrapText } from "@jerryqiu/db/pdf";
import { eq } from "drizzle-orm";

export type DocKind = "invoice" | "quote" | "contract";
export const isDocKind = (k: string): k is DocKind => k === "invoice" || k === "quote" || k === "contract";

/** One shape for every studio document, so the page, the print view and the PDF all say the same thing. */
export type DocModel = {
  kind: DocKind;
  heading: string;
  number: string;
  status: string;
  business: string;
  to: { name: string; email: string; phone: string | null; address: string | null };
  meta: [string, string][];
  intro?: string;
  fields: [string, string][];
  lines: { description: string; detail?: string; cents: number }[];
  totals: [string, number, boolean?][];
  body?: string;
  notes?: string;
  filename: string;
};

const day = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

async function clientOf(db: Database, id: string) {
  const [c] = await db.select().from(schema.studioClients).where(eq(schema.studioClients.id, id));
  return { name: c?.name ?? "", email: c?.email ?? "", phone: c?.phone ?? null, address: c?.address ?? null };
}

export async function docModel(db: Database, kind: DocKind, id: string): Promise<DocModel | null> {
  const business = (await getPolicies(db)).businessName;
  if (kind === "invoice") {
    const [inv] = await db.select().from(schema.studioInvoices).where(eq(schema.studioInvoices.id, id));
    if (!inv) return null;
    const [job] = await db.select().from(schema.studioJobs).where(eq(schema.studioJobs.id, inv.jobId));
    const payments = (
      await db.select().from(schema.studioPayments).where(eq(schema.studioPayments.invoiceId, inv.id))
    ).filter((p) => p.status === "succeeded" || p.status === "refunded");
    const paid = payments.reduce((n, p) => {
      const base = p.amountCents - p.tipCents - p.surchargeCents;
      return n + base - Math.round((p.refundedCents * base) / (p.amountCents || 1));
    }, 0);
    return {
      kind,
      heading: "Invoice",
      number: inv.number,
      status: inv.status,
      business,
      to: await clientOf(db, job.clientId),
      meta: [["Job", job.title], ...(inv.dueDate ? ([["Due", inv.dueDate]] as [string, string][]) : [])],
      fields: [],
      lines: inv.lines.map((l) => ({ description: l.description, cents: l.amountCents })),
      totals: [
        ["Total", inv.totalCents],
        ...(paid ? ([["Paid so far", paid]] as [string, number][]) : []),
        ["Balance due", Math.max(0, inv.totalCents - paid), true],
      ],
      notes: "Sales tax, where it applies, is shown on the quote and added at checkout.",
      filename: `invoice-${inv.number}`,
    };
  }
  if (kind === "quote") {
    const [q] = await db.select().from(schema.studioQuotes).where(eq(schema.studioQuotes.id, id));
    if (!q) return null;
    return {
      kind,
      heading: "Quote",
      number: q.number,
      status: q.status,
      business,
      to: await clientOf(db, q.clientId),
      meta: [["Title", q.title], ...(q.validUntil ? ([["Valid until", day(q.validUntil)]] as [string, string][]) : [])],
      intro: q.intro ?? undefined,
      fields: q.fields.map((f) => [f.label, f.value]),
      lines: q.lines.map((l) => ({
        description: l.description,
        detail: l.qty > 1 ? `${l.qty} × ${(l.unitCents / 100).toFixed(2)}` : undefined,
        cents: l.amountCents,
      })),
      totals: [
        ["Subtotal", q.subtotalCents],
        ...(q.discountCents ? ([["Discount", -q.discountCents]] as [string, number][]) : []),
        ...(q.taxCents ? ([[q.taxLabel ?? "Tax", q.taxCents]] as [string, number][]) : []),
        ["Total", q.totalCents, true],
        ["Deposit to book", q.depositCents],
      ],
      notes: q.terms ?? undefined,
      filename: `quote-${q.number}`,
    };
  }
  const [c] = await db.select().from(schema.studioContracts).where(eq(schema.studioContracts.id, id));
  if (!c) return null;
  const [job] = await db.select().from(schema.studioJobs).where(eq(schema.studioJobs.id, c.jobId));
  return {
    kind,
    heading: c.title,
    number: c.kind,
    status: c.status,
    business,
    to: await clientOf(db, job.clientId),
    meta: [
      ["Job", job.title],
      ...(c.signedAt ? ([["Signed", `${c.signerName ?? ""} on ${day(c.signedAt)}`]] as [string, string][]) : []),
    ],
    fields: [],
    lines: [],
    totals: [],
    body: c.body,
    filename: `contract-${job.title}`.replace(/[^A-Za-z0-9._-]+/g, "-").slice(0, 60),
  };
}

const usd = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
export const money = usd;

export function docPdf(d: DocModel): Uint8Array {
  const out: PdfLine[] = [
    { text: d.business, size: 11 },
    { text: d.kind === "contract" ? d.heading : `${d.heading} ${d.number}`, size: 22, bold: true, gapBefore: 6 },
    { text: `Status: ${d.status}`, gapBefore: 4 },
    { text: `For: ${d.to.name} <${d.to.email}>`, gapBefore: 10 },
  ];
  if (d.to.phone) out.push({ text: `Phone: ${d.to.phone}` });
  if (d.to.address) for (const t of wrapText(`Address: ${d.to.address}`)) out.push({ text: t });
  for (const [k, v] of d.meta) out.push({ text: `${k}: ${v}` });
  if (d.intro) for (const [i, t] of wrapText(d.intro).entries()) out.push({ text: t, gapBefore: i ? 0 : 10 });
  if (d.fields.length) {
    out.push({ text: "Details", size: 13, bold: true, gapBefore: 14 });
    for (const [k, v] of d.fields) for (const t of wrapText(`${k}: ${v}`)) out.push({ text: t });
  }
  if (d.lines.length) {
    out.push({ text: "Items", size: 13, bold: true, gapBefore: 14 });
    for (const l of d.lines)
      for (const [i, t] of wrapText(`${l.description}${l.detail ? ` (${l.detail})` : ""}   ${usd(l.cents)}`).entries())
        out.push({ text: t, gapBefore: i ? 0 : 3 });
  }
  d.totals.forEach(([k, v, strong], i) =>
    out.push({ text: `${k}: ${usd(v)}`, bold: Boolean(strong), size: strong ? 13 : 11, gapBefore: i ? 0 : 12 }),
  );
  if (d.body)
    for (const para of d.body.split("\n")) for (const t of wrapText(para || " ")) out.push({ text: t, gapBefore: 0 });
  if (d.notes) {
    out.push({ text: d.kind === "quote" ? "Terms" : "Note", size: 11, bold: true, gapBefore: 14 });
    for (const para of d.notes.split("\n")) for (const t of wrapText(para || " ")) out.push({ text: t, size: 9 });
  }
  return renderPdf(`${d.heading} ${d.number}`, out);
}
