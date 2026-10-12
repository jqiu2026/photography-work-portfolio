import { Container, Eyebrow, Heading, Section, Text } from "@placeholder/ui";
import { Gallery } from "@placeholder/ui/media";
import type { Metadata } from "next";
import { Empty } from "@/components/interest/Empty";
import { InterestShell } from "@/components/interest/InterestShell";
import { PageHeader } from "@/components/site/PageHeader";
import { getFlyingContent } from "@/lib/interests";
import { getImage } from "@/lib/images";

export const metadata: Metadata = { title: "Aircraft" };

export default async function Aircraft() {
  const flying = await getFlyingContent();
  const photos = flying.photographed.map((id, i) => ({
    ...getImage("gallery", id),
    alt: `Airliner photograph ${i + 1}`,
  }));
  return (
    <InterestShell id="flying">
      <PageHeader eyebrow="Flying" title="Aircraft" />
      <Section style={{ paddingTop: 0 }}>
        <Container>
          <Heading as="h2" size="2xl" display style={{ marginBottom: "1rem" }}>
            Flown
          </Heading>
          {flying.aircraftFlown.length ? (
            flying.aircraftFlown.map((a) => (
              <Text key={a.name}>
                {a.name}
                {a.note ? `: ${a.note}` : ""}
              </Text>
            ))
          ) : (
            <Empty>No aircraft listed yet.</Empty>
          )}
          <Eyebrow style={{ margin: "4rem 0 1rem" }}>Photographed</Eyebrow>
          <Gallery images={photos} rowHeight={340} />
        </Container>
      </Section>
    </InterestShell>
  );
}
