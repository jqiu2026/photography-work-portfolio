import { Container, Prose, Section } from "@halation/ui";
import type { ReactNode } from "react";
import { getLegalPage } from "@/lib/content-db";
import { RenderMarkdownBare } from "@jerryqiu/render";
import { PageHeader } from "./PageHeader";
import { SiteShell } from "./SiteShell";

/** Shared layout for legal pages. All legal text is a draft for professional review (see QUESTIONS.md Q13). */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <SiteShell>
      <PageHeader eyebrow="Legal" title={title} intro={`Last updated ${updated}. Plain-language draft.`} />
      <Section style={{ paddingTop: 0 }}>
        <Container size="sm">
          <Prose>{children}</Prose>
        </Container>
      </Section>
    </SiteShell>
  );
}

/** A legal page published in the CMS replaces the built-in draft text; otherwise `fallback` renders. */
export async function LegalOrBuiltin({ slug, fallback }: { slug: string; fallback: ReactNode }) {
  const page = await getLegalPage(slug);
  if (!page) return fallback;
  const updated = new Date(page.updatedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  return (
    <LegalPage title={page.title} updated={updated}>
      <RenderMarkdownBare source={page.body} />
    </LegalPage>
  );
}
