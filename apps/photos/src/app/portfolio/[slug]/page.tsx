import { PageTab, PageTabs } from "@holominimal/ui";
import { Container, Section, Text } from "@/components/ui";
import { PageHeader } from "@/components/PageHeader";
import { ProtectedGallery } from "@halation/ui/media";
import type { Metadata } from "next";
import Link from "next/link";
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
  const tabs = categories.filter((c) => photosIn(c.slug).length);
  return (
    <Shell cinema>
      <PageHeader eyebrow={"Portfolio"} title={cat.name} />
      <Section style={{ paddingTop: 0 }}>
        <Container>
          <PageTabs className="cat-tabs" aria-label="Subjects">
            <PageTab asChild>
              <Link href="/portfolio">All</Link>
            </PageTab>
            {tabs.map((c) => (
              <PageTab key={c.slug} asChild current={c.slug === slug}>
                <Link href={`/portfolio/${c.slug}`}>{c.name}</Link>
              </PageTab>
            ))}
          </PageTabs>
          <Text size="sm" tone="muted" className="cat-note">
            These photographs are protected. Screenshots and saving are discouraged; to use an image, get in touch for a
            licence.
          </Text>
          <ProtectedGallery
            items={items.map((p) => ({ asset: p, alt: p.alt }))}
            layout={items.length > 3 ? "masonry" : "justified"}
            rowHeight={380}
            lightbox
          />
        </Container>
      </Section>
    </Shell>
  );
}
