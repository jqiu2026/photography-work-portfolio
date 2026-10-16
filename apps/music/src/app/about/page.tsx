import { Container, Section, SkillTags, Text } from "@halation/ui";
import type { Metadata } from "next";
import { Empty } from "@/components/interest/Empty";
import { InterestShell } from "@/components/interest/InterestShell";
import { PageHeader } from "@/components/site/PageHeader";
import { getMusicContent } from "@/lib/interests";

export const metadata: Metadata = { title: "About" };

export default async function About() {
  const music = await getMusicContent();
  return (
    <InterestShell id="music">
      <PageHeader eyebrow="Music" title="Background" />
      <Section style={{ paddingTop: 0 }}>
        <Container size="md">
          {music.story ? <Text size="xl">{music.story}</Text> : <Empty>This page is being put together.</Empty>}
          {music.repertoire.length ? (
            <div style={{ marginTop: "2.5rem" }}>
              <Text tone="muted" size="sm" style={{ marginBottom: "0.75rem" }}>
                Repertoire
              </Text>
              <SkillTags tags={music.repertoire} />
            </div>
          ) : null}
        </Container>
      </Section>
    </InterestShell>
  );
}
