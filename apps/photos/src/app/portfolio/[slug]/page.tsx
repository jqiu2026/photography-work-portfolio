import { Container, Eyebrow, Heading, Section } from "@halation/ui";
import { Gallery, GuardScope, ProtectedGallery } from "@halation/ui/media";
import { mintAllWidths, tokenSecrets } from "@jerryqiu/protect";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { getPortfolio } from "@/lib/portfolio";
import "../../globals.css";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { categories } = await getPortfolio();
  const c = categories.find((x) => x.slug === slug);
  return c ? { title: c.name, description: `${c.name} photography by Jerry Qiu.` } : {};
}

export default async function Category({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { categories, photosIn } = await getPortfolio();
  const cat = categories.find((c) => c.slug === slug);
  const items = photosIn(slug);
  if (!cat || !items.length) notFound();
  // Strict galleries mint fresh tokens on every request, so the page is never served from a static cache.
  if (cat.level === "strict") await connection();
  const tabs = categories.filter((c) => photosIn(c.slug).length);
  return (
    <Shell cinema>
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
          {cat.level === "strict" ? (
            <>
              <GuardScope level="strict" />
              <p className="cat-note">
                These photographs are protected. Screenshots and saving are discouraged; to use an image, get in touch
                for a licence.
              </p>
              <ProtectedGallery
                items={items.map((p) => ({
                  // Only what the placeholder needs: no file URLs reach the page source.
                  asset: { id: p.id, width: p.width, height: p.height, color: p.color, blur: p.blur, files: [] },
                  alt: p.alt,
                  tokens: mintAllWidths({ id: p.id, secrets: tokenSecrets() }),
                }))}
              />
            </>
          ) : (
            <>
              <GuardScope level={cat.level} />
              <Gallery images={items} layout={items.length > 3 ? "masonry" : "justified"} glitch rowHeight={380} />
            </>
          )}
        </Container>
      </Section>
    </Shell>
  );
}
