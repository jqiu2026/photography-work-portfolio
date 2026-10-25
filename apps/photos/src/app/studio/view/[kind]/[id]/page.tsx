import { getDb } from "@jerryqiu/db";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/auth";
import { DocPaper } from "@/components/studio/DocPaper";
import { canSeeSection } from "@/components/studio/sections";
import { docModel, isDocKind } from "@/lib/doc-model";

export const dynamic = "force-dynamic";
export const metadata = { title: "Document", robots: { index: false, follow: false } };

const SECTION = { invoice: "invoices", quote: "quotes", contract: "contracts" } as const;

/** A studio document laid out like paper: read it, print it, or save it as a PDF. */
export default async function ViewDoc({
  params,
  searchParams,
}: { params: Promise<{ kind: string; id: string }>; searchParams: Promise<{ print?: string }> }) {
  const { kind, id } = await params;
  const q = await searchParams;
  if (!isDocKind(kind) || !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const user = await requirePageUser("studio.access", `/studio/view/${kind}/${id}`);
  if (!canSeeSection(user.role, SECTION[kind])) notFound();
  const db = getDb();
  const doc = db ? await docModel(db, kind, id) : null;
  if (!doc) notFound();
  return <DocPaper doc={doc} id={id} back={`/studio/${SECTION[kind]}`} autoPrint={q.print === "1"} />;
}
