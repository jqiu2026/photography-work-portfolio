import type { ReactNode } from "react";
import { getLegalPage } from "@/lib/content-db";
import { Markdown } from "./Markdown";
import { PageHeader } from "./PageHeader";

/** Shared layout for legal pages. All legal text is a draft for professional review (see QUESTIONS.md Q13). */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div>
      <PageHeader eyebrow="Legal" title={title} intro={`Last updated ${updated}. Plain-language draft.`} />
      <div className="hb-wrap hb-section">
        <div className="hm-prose hb-prose">{children}</div>
      </div>
    </div>
  );
}

/** A legal page published in the CMS replaces the built-in draft text; otherwise `fallback` renders. */
export async function LegalOrBuiltin({ slug, fallback }: { slug: string; fallback: ReactNode }) {
  const page = await getLegalPage(slug);
  if (!page) return fallback;
  const updated = new Date(page.updatedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  return (
    <LegalPage title={page.title} updated={updated}>
      <Markdown source={page.body} />
    </LegalPage>
  );
}
