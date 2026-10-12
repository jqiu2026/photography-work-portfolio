import {
  Button,
  Card,
  Container,
  Eyebrow,
  Grid,
  Heading,
  InterestHero,
  Link as UiLink,
  Section,
  Text,
} from "@halation/ui";
import { Image } from "@halation/ui/media";
import { sitePath } from "@jerryqiu/sites";
import NextLink from "next/link";
import { InterestShell } from "@/components/interest/InterestShell";
import { getFlyingContent } from "@/lib/interests";
import { getImage } from "@/lib/images";

export default async function FlyingHome() {
  const flying = await getFlyingContent();
  const cockpit = getImage("blogs", "day-one-cover");
  return (
    <InterestShell id="flying">
      <Container style={{ paddingBlock: "clamp(3rem, 9vw, 7rem)" }}>
        <InterestHero
          eyebrow="Jerry Qiu"
          title="Flying"
          intro={flying.intro}
          media={
            <Image
              asset={cockpit}
              alt="The view from a small airplane's cockpit over green countryside and clouds, a pilot in headphones in the foreground."
              sizes="(min-width: 860px) 45vw, 100vw"
              priority
            />
          }
          actions={
            <Button as={NextLink} href={sitePath("flying", "/about")}>
              The short version
            </Button>
          }
        />
      </Container>
      <Section tone="surface">
        <Container>
          <Grid min="18rem" gap={6}>
            {flying.story ? (
              <Card>
                <Eyebrow>How it started</Eyebrow>
                <Text style={{ marginTop: "0.75rem" }}>{flying.story}</Text>
              </Card>
            ) : null}
            {flying.certificates.map((c) => (
              <Card key={c.title}>
                <Eyebrow>Certificates</Eyebrow>
                <Heading as="h2" size="xl" style={{ margin: "0.75rem 0 0.5rem" }}>
                  {c.title}
                </Heading>
                <Text tone="muted" size="sm">
                  {c.note}
                </Text>
              </Card>
            ))}
            <Card>
              <Eyebrow>Club</Eyebrow>
              <Heading as="h2" size="xl" style={{ margin: "0.75rem 0 0.5rem" }}>
                {flying.club.name}
              </Heading>
              <Text tone="muted" size="sm">
                {flying.club.note} <UiLink href={flying.club.href}>@stuyaviators</UiLink>
              </Text>
            </Card>
          </Grid>
          <Text tone="muted" size="sm" style={{ marginTop: "3rem" }}>
            {flying.disclaimer}
          </Text>
        </Container>
      </Section>
    </InterestShell>
  );
}
