import { Container, Eyebrow, Heading, Section } from "@placeholder/ui";
import { Gallery } from "@placeholder/ui/media";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { categories, photosIn } from "@/content/portfolio";
import "../../globals.css";

export function generateStaticParams() {
  return categories.filter((c) => photosIn(c.slug).length).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = categories.find((x) => x.slug === slug);
  return c ? { title: c.name, description: `${c.name} photography by Jerry Qiu.` } : {};
}

export default async function Category({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cat = categories.find((c) => c.slug === slug);
  const items = photosIn(slug);
  if (!cat || !items.length) notFound();
  const tabs = categories.filter((c) => photosIn(c.slug).length);
  return (
    <Shell>
      <Container className="page-head">
        <Eyebrow style={{ marginBottom: "1rem" }}>Portfolio</Eyebrow>
        <Heading as="h1" size="display" display>
          {cat.name}
        </Heading>
      </Container>
      <Section style={{ paddingTop: 0 }}>
        <Container>
          <nav className="cat-tabs" aria-label="Subjects">
            <Link href="/portfolio">All</Link>
            {tabs.map((c) => (
              <Link key={c.slug} href={`/portfolio/${c.slug}`} aria-current={c.slug === slug ? "page" : undefined}>
                {c.name}
              </Link>
            ))}
          </nav>
          <Gallery images={items} layout={items.length > 3 ? "masonry" : "justified"} glitch rowHeight={380} />
        </Container>
      </Section>
    </Shell>
  );
}
