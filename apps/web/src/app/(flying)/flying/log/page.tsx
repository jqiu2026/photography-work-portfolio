import { Container, Section, Timeline } from "@placeholder/ui";
import type { Metadata } from "next";
import { Empty } from "@/components/interest/Empty";
import { InterestShell } from "@/components/interest/InterestShell";
import { PageHeader } from "@/components/site/PageHeader";
import { flying } from "@/content/interests";

export const metadata: Metadata = { title: "Log" };

export default function Log() {
  // Only entries marked safeToPublish are shown (no real-time location by default; see 11-legal-and-compliance.md).
  const entries = flying.log.filter((e) => e.safeToPublish);
  return (
    <InterestShell id="flying">
      <PageHeader eyebrow="Flying" title="Log" intro="Milestones and memorable flights." />
      <Section style={{ paddingTop: 0 }}>
        <Container size="md">
          {entries.length ? (
            <Timeline items={entries.map((e) => ({ title: e.title, period: e.date, summary: e.note }))} />
          ) : (
            <Empty>No entries yet.</Empty>
          )}
        </Container>
      </Section>
    </InterestShell>
  );
}
