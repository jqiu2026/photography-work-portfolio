import { Container, Prose, Section } from "@placeholder/ui";
import type { ReactNode } from "react";
import { PageHeader } from "./PageHeader";
import { SiteShell } from "./SiteShell";

/** Shared layout for legal pages. All legal text is a draft for professional review (see QUESTIONS.md Q13). */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <SiteShell transparentTop={false}>
      <PageHeader eyebrow="Legal" title={title} intro={`Last updated ${updated}. Plain-language draft.`} />
      <Section style={{ paddingTop: 0 }}>
        <Container size="sm">
          <Prose>{children}</Prose>
        </Container>
      </Section>
    </SiteShell>
  );
}
