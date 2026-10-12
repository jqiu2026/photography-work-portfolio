import {
  Button,
  Container,
  Eyebrow,
  Grid,
  Heading,
  ProfileHeader,
  Section,
  SkillTags,
  Text,
  Timeline,
  Link,
} from "@halation/ui";
import { Image } from "@halation/ui/media";
import { InView, Parallax } from "@halation/ui/motion";
import type { Metadata } from "next";
import NextLink from "next/link";
import { SiteShell } from "@/components/site/SiteShell";
import { managed } from "@/content/about";
import { person as staticPerson } from "@/content/site";
import { getPerson } from "@/lib/profile";
import { getImage } from "@/lib/images";

export const metadata: Metadata = {
  title: "About",
  description: `About ${staticPerson.name}: background, skills and where to find me.`,
};

export default async function About() {
  const { person, socials, timeline, skills, skillTags, intro } = await getPerson();
  const portrait = getImage("site", "avatar");
  return (
    <SiteShell>
      <Container style={{ paddingTop: "clamp(3rem, 8vw, 6rem)" }}>
        <ProfileHeader
          name={person.name}
          headline={person.headline}
          location={`${person.location} · ${person.languages.join(", ")}`}
          currently={person.currently}
          links={socials}
          portrait={
            <Parallax speed={0.08}>
              <Image
                asset={portrait}
                alt={`Portrait of ${person.name}`}
                sizes="22vw"
                style={{ borderRadius: "var(--hl-radius-lg)" }}
              />
            </Parallax>
          }
          actions={
            <Button as={NextLink} href="/connect">
              Get in touch
            </Button>
          }
        />
      </Container>

      <Section>
        <Container size="md">
          <Eyebrow style={{ marginBottom: "1.5rem" }}>Introduction</Eyebrow>
          {/* TODO(owner): rewrite in your own voice (first person) */}
          <Text size="2xl" style={{ fontFamily: "var(--hl-font-display)", maxWidth: "32ch", lineHeight: 1.25 }}>
            {intro}
          </Text>
        </Container>
      </Section>

      <Section tone="surface">
        <Container size="md">
          <Heading size="4xl" display style={{ marginBottom: "2.5rem" }}>
            Timeline
          </Heading>
          <Timeline items={timeline} />
        </Container>
      </Section>

      <Section>
        <Container size="md">
          <Heading size="4xl" display style={{ marginBottom: "2.5rem" }}>
            Skills and interests
          </Heading>
          {skillTags.length ? <SkillTags tags={skillTags} /> : null}
          <Grid min="19rem" gap={8}>
            {skills.map((s) => (
              <InView key={s.title}>
                <Heading as="h3" size="xl">
                  {s.title}
                </Heading>
                <Text tone="muted" style={{ margin: "0.6rem 0 1rem" }}>
                  {s.body}
                </Text>
                <SkillTags tags={s.tags} />
              </InView>
            ))}
          </Grid>
          <Heading as="h3" size="xl" style={{ margin: "4rem 0 1rem" }}>
            Accounts I manage
          </Heading>
          <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.5rem" }}>
            {managed.map((m) => (
              <li key={m.href}>
                <Link href={m.href}>{m.label}</Link>{" "}
                <Text as="span" tone="muted" size="sm">
                  ({m.period})
                </Text>
              </li>
            ))}
          </ul>
        </Container>
      </Section>
    </SiteShell>
  );
}
