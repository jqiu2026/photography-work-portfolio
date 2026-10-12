import { Container, Eyebrow, Heading, Section } from "@halation/ui";
import { Gallery } from "@halation/ui/media";
import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/Shell";
import { getPortfolio } from "@/lib/portfolio";
import "../globals.css";

export const metadata: Metadata = { title: "Portfolio", description: "Selected photographs by subject." };

export default async function Portfolio() {
  const { categories, photos, photosIn } = await getPortfolio();
  const tabs = categories.filter((c) => photosIn(c.slug).length);
  return (
    <Shell cinema>
      <Container className="page-head">
        <Eyebrow style={{ marginBottom: "1rem" }}>Portfolio</Eyebrow>
        <Heading as="h1" size="display" display>
          All photographs
        </Heading>
      </Container>
      <Section style={{ paddingTop: 0 }}>
        <Container>
          <nav className="cat-tabs" aria-label="Subjects">
            <Link href="/portfolio" aria-current="page">
              All
            </Link>
            {tabs.map((c) => (
              <Link key={c.slug} href={`/portfolio/${c.slug}`}>
                {c.name}
              </Link>
            ))}
          </nav>
          <Gallery images={photos} layout="masonry" glitch />
        </Container>
      </Section>
    </Shell>
  );
}
