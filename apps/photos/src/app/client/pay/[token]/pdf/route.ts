import { getDb } from "@jerryqiu/db";
import * as st from "@jerryqiu/db/studio";
import { invoicePdf } from "@/lib/invoice-pdf";

export const dynamic = "force-dynamic";

/** The invoice as a PDF, for whoever holds the invoice link. */
export async function GET(_request: Request, ctx: { params: Promise<{ token: string }> }) {
  const db = getDb();
  const { token } = await ctx.params;
  if (!db || token.length > 80) return new Response(null, { status: 404 });
  const inv = await st.invoiceByToken(db, token);
  if (!inv) return new Response(null, { status: 404 });
  return new Response(Buffer.from(await invoicePdf(db, inv.id)), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${inv.number}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
