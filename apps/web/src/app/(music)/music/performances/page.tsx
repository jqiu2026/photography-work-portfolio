import { Container, Section, Timeline } from "@placeholder/ui";
import type { Metadata } from "next";
import { Empty } from "@/components/interest/Empty";
import { InterestShell } from "@/components/interest/InterestShell";
import { PageHeader } from "@/components/site/PageHeader";
import { music } from "@/content/interests";

export const metadata: Metadata = { title: "Performances" };

export default function Performances() {
  return (
    <InterestShell id="music">
      <PageHeader eyebrow="Music" title="Performances" />
      <Section style={{ paddingTop: 0 }}>
        <Container size="md">
          {music.performances.length ? (
            <Timeline
              items={music.performances.map((p) => ({
                title: p.title,
                org: [p.venue, p.ensemble].filter(Boolean).join(", "),
                period: p.date,
                summary: p.note,
              }))}
            />
          ) : (
            <Empty>No performances listed yet.</Empty>
          )}
        </Container>
      </Section>
    </InterestShell>
  );
}
