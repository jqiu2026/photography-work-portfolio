import { Breadcrumbs, Container, Eyebrow, Heading, Section, Text } from "@placeholder/ui";
import { Image } from "@placeholder/ui/media";
import { ScrollProgress } from "@placeholder/ui/motion";
import type { Metadata } from "next";
import NextLink from "next/link";
import { notFound } from "next/navigation";
import { MDX } from "@/components/site/MDX";
import { SiteShell } from "@/components/site/SiteShell";
import { person } from "@/content/site";
import { getWriting, imageId } from "@/lib/content";
import { getImage } from "@/lib/images";
import "@/components/work/work.css";

export function generateStaticParams() {
  return getWriting().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getWriting().find((x) => x.slug === slug);
  if (!p) return {};
  return {
    title: p.metadata.title,
    description: p.metadata.summary,
    openGraph: { type: "article", publishedTime: p.metadata.publishedAt },
  };
}

const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const all = getWriting();
  const i = all.findIndex((x) => x.slug === slug);
  if (i < 0) notFound();
  const p = all[i];
  const prev = all[i + 1];
  const next = all[i - 1];
  const cover = p.metadata.image ? getImage("blogs", imageId(p.metadata.image)) : null;
  return (
    <SiteShell transparentTop={false}>
      <ScrollProgress />
      <Container size="md" style={{ paddingTop: "clamp(2rem, 6vw, 4rem)" }}>
        <Breadcrumbs items={[{ label: "Writing", href: "/writing" }, { label: p.metadata.title }]} />
        <Eyebrow style={{ margin: "2.5rem 0 1rem" }}>
          {fmt(p.metadata.publishedAt)} · {person.name}
        </Eyebrow>
        <Heading as="h1" size="4xl" display>
          {p.metadata.title}
        </Heading>
        {p.metadata.subtitle ? (
          <Text size="xl" tone="muted" style={{ marginTop: "1.25rem", fontStyle: "italic" }}>
            {p.metadata.subtitle}
          </Text>
        ) : null}
      </Container>
      {cover ? (
        <div className="work-detail__hero" style={{ marginTop: "3rem" }}>
          <Image asset={cover} alt="" sizes="100vw" priority />
        </div>
      ) : null}
      <Section>
        <Container size="sm">
          <MDX source={p.content} />
        </Container>
      </Section>
      <Container size="md">
        <nav className="next-prev" aria-label="More writing">
          {prev ? (
            <NextLink href={`/writing/${prev.slug}`}>
              <span>← Older</span>
              <strong>{prev.metadata.title}</strong>
            </NextLink>
          ) : (
            <span />
          )}
          {next ? (
            <NextLink href={`/writing/${next.slug}`}>
              <span>Newer →</span>
              <strong>{next.metadata.title}</strong>
            </NextLink>
          ) : (
            <span />
          )}
        </nav>
      </Container>
    </SiteShell>
  );
}
