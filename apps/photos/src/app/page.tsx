import { Button, Container, Eyebrow, Heading, Section, Text } from "@halation/ui";
import { Gallery, Image } from "@halation/ui/media";
import { InView } from "@halation/ui/motion";
import Link from "next/link";
import { Compare } from "@/components/Compare";
import { Hero } from "@/components/Hero";
import { Shell } from "@/components/Shell";
import { getPortfolio } from "@/lib/portfolio";
import "./globals.css";

export default async function Home() {
  const { categories, featured, hero, compare, photosIn } = await getPortfolio();
  if (!hero) return null;
  const files = [...hero.files].sort((a, b) => a.width - b.width);
  const src = (files.find((f) => f.width >= 1600) ?? files[files.length - 1]).src;
  const cats = categories
    .filter((c) => c.level !== "strict")
    .map((c) => ({ ...c, items: photosIn(c.slug) }))
    .filter((c) => c.items.length);
  return (
    <Shell transparentTop>
      <Hero
        src={src}
        srcSet={files.map((f) => `${f.src} ${f.width}w`).join(", ")}
        alt="A portrait of a person looking off to the side against a dark blue backdrop."
      >
        <p>Theater, events, street and aviation, shot mostly around New York.</p>
      </Hero>

      <Section>
        <Container>
          <Eyebrow style={{ marginBottom: "1rem" }}>Selected</Eyebrow>
          <Heading size="4xl" display style={{ marginBottom: "2.5rem" }}>
            Recent work
          </Heading>
          <Gallery images={featured} rowHeight={320} glitch />
        </Container>
      </Section>

      <Section tone="surface">
        <Container>
          <Compare photos={compare} />
        </Container>
      </Section>

      <Section>
        <Container>
          <Eyebrow style={{ marginBottom: "1rem" }}>Portfolio</Eyebrow>
          <Heading size="4xl" display style={{ marginBottom: "2.5rem" }}>
            By subject
          </Heading>
          <div className="cat-grid">
            {cats.map((c) => (
              <InView key={c.slug}>
                <Link className="cat-card" href={`/portfolio/${c.slug}`}>
                  <Image asset={c.items[0]} alt="" sizes="(min-width: 900px) 20vw, 50vw" fill />
                  <span>
                    {c.name}
                    <small>{c.items.length}</small>
                  </span>
                </Link>
              </InView>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container size="md" style={{ textAlign: "center" }}>
          <Heading size="4xl" display>
            Want to work together?
          </Heading>
          <Text tone="muted" style={{ margin: "1.25rem auto 2rem" }}>
            I take on events, performances and portraits. Tell me what you have in mind.
          </Text>
          <Button as={Link} href="/book" size="lg">
            Book or ask a question
          </Button>
        </Container>
      </Section>
    </Shell>
  );
}
