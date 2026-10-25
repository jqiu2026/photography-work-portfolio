import { getDb } from "@jerryqiu/db";
import { canSeeSection } from "@/components/studio/sections";
import { guardedRoute } from "@/lib/route-guard";
import { docModel, docPdf, isDocKind } from "@/lib/doc-model";

const SECTION = { invoice: "invoices", quote: "quotes", contract: "contracts" } as const;
export const dynamic = "force-dynamic";

/** A studio document as a PDF (inline to view, or `?download=1` to save), for whoever may see money pages. */
export const GET = guardedRoute(
  "studio.access",
  async (req, ctx: { params: Promise<{ kind: string; id: string }> }, user) => {
    const { kind, id } = await ctx.params;
    const db = getDb();
    if (!db || !isDocKind(kind) || !/^[0-9a-f-]{36}$/i.test(id)) return new Response(null, { status: 404 });
    if (!canSeeSection(user.role, SECTION[kind])) return new Response(null, { status: 404 });
    const d = await docModel(db, kind, id);
    if (!d) return new Response(null, { status: 404 });
    const save = new URL(req.url).searchParams.has("download");
    return new Response(Buffer.from(docPdf(d)), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${save ? "attachment" : "inline"}; filename="${d.filename}.pdf"`,
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex",
      },
    });
  },
);
