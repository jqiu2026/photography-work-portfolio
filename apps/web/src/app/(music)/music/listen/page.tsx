import { Container, Grid, Heading, Section, Text } from "@placeholder/ui";
import { EmbedFacade } from "@placeholder/ui";
import type { Metadata } from "next";
import { Empty } from "@/components/interest/Empty";
import { InterestShell } from "@/components/interest/InterestShell";
import { PageHeader } from "@/components/site/PageHeader";
import { getMusicContent } from "@/lib/interests";

export const metadata: Metadata = { title: "Listen" };

export default async function Listen() {
  const music = await getMusicContent();
  return (
    <InterestShell id="music">
      <PageHeader
        eyebrow="Music"
        title="Listen"
        intro="Recordings and performances. Players load only when you press play."
      />
      <Section style={{ paddingTop: 0 }}>
        <Container>
          {music.recordings.length ? (
            <Grid min="20rem" gap={8}>
              {music.recordings.map((r) => (
                <div key={r.id}>
                  <EmbedFacade
                    provider={r.provider}
                    id={r.id}
                    title={r.title}
                    ratio={r.provider === "youtube" ? "16 / 9" : "16 / 6"}
                  />
                  <Heading as="h2" size="xl" style={{ marginTop: "1rem" }}>
                    {r.title}
                  </Heading>
                  {r.note ? (
                    <Text tone="muted" size="sm">
                      {r.note}
                    </Text>
                  ) : null}
                </div>
              ))}
            </Grid>
          ) : (
            <Empty>No recordings yet.</Empty>
          )}
        </Container>
      </Section>
    </InterestShell>
  );
}
