import { Container, Eyebrow, Heading, InterestHero, Section, Text } from "@placeholder/ui";
import { Image } from "@placeholder/ui/media";
import { sitePath } from "@jerryqiu/sites";
import Link from "next/link";
import { Button } from "@placeholder/ui";
import { Empty } from "@/components/interest/Empty";
import { InterestShell } from "@/components/interest/InterestShell";
import { music } from "@/content/interests";
import { getImage } from "@/lib/images";

export default function MusicHome() {
  const img = getImage("gallery", "jry0473");
  return (
    <InterestShell id="music">
      <Container style={{ paddingBlock: "clamp(3rem, 9vw, 7rem)" }}>
        <InterestHero
          eyebrow="Jerry Qiu"
          title="Music"
          intro={music.intro}
          media={
            <Image
              asset={img}
              alt="A trombonist performing in a haze of coloured stage light."
              sizes="(min-width: 860px) 45vw, 100vw"
              priority
            />
          }
          actions={
            <Button as={Link} href={sitePath("music", "/listen")}>
              Listen
            </Button>
          }
        />
      </Container>
      {music.story || music.instruments.length ? (
        <Section tone="surface">
          <Container size="md">
            <Eyebrow style={{ marginBottom: "1rem" }}>Background</Eyebrow>
            {music.story ? (
              <Heading size="3xl" display style={{ maxWidth: "24ch" }}>
                {music.story}
              </Heading>
            ) : null}
            {music.instruments.length ? (
              <Text tone="muted" style={{ marginTop: "1.5rem" }}>
                Instruments: {music.instruments.join(", ")}
              </Text>
            ) : null}
          </Container>
        </Section>
      ) : (
        <Section tone="surface">
          <Container size="md">
            <Empty>This page is being put together. Check back soon.</Empty>
          </Container>
        </Section>
      )}
    </InterestShell>
  );
}
