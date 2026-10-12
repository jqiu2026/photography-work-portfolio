import { Container, Section, Text } from "@placeholder/ui";
import type { Metadata } from "next";
import { InterestShell } from "@/components/interest/InterestShell";
import { PageHeader } from "@/components/site/PageHeader";
import { flying } from "@/content/interests";

export const metadata: Metadata = { title: "About" };

export default function About() {
  return (
    <InterestShell id="flying">
      <PageHeader eyebrow="Flying" title="The short version" />
      <Section style={{ paddingTop: 0 }}>
        <Container size="md">
          <Text size="xl">
            {flying.story ??
              "I'm a certified drone pilot (FAA Part 107) and I run the Instagram account for the StuyAviators club."}
          </Text>
          <Text tone="muted" style={{ marginTop: "2rem" }}>
            {flying.disclaimer}
          </Text>
        </Container>
      </Section>
    </InterestShell>
  );
}
