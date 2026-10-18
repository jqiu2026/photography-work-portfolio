import { PageTab, PageTabs } from "@holominimal/ui";
import { Container, EmptyState, Section } from "@/components/ui";
import { PageHeader } from "@/components/PageHeader";
import { ProtectedGallery } from "@halation/ui/media";
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
      <PageHeader eyebrow={"Portfolio"} title={"All photographs"} />
      <Section style={{ paddingTop: 0 }}>
        <Container>
          <PageTabs className="cat-tabs" aria-label="Subjects">
            <PageTab asChild current>
              <PageTab asChild>
                <Link href="/portfolio">All</Link>
              </PageTab>
            </PageTab>
            {tabs.map((c) => (
              <PageTab key={c.slug} asChild>
                <Link href={`/portfolio/${c.slug}`}>{c.name}</Link>
              </PageTab>
            ))}
          </PageTabs>
          {photos.length ? (
            <ProtectedGallery items={photos.map((p) => ({ asset: p, alt: p.alt }))} layout="masonry" lightbox />
          ) : (
            <EmptyState>New photographs are on the way. Projects has the latest work.</EmptyState>
          )}
        </Container>
      </Section>
    </Shell>
  );
}
