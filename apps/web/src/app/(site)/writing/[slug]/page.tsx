import { Breadcrumbs, Container, Eyebrow, Heading, Section, Text } from "@halation/ui";
import { Image } from "@halation/ui/media";
import { ScrollProgress } from "@halation/ui/motion";
import type { Metadata } from "next";
import NextLink from "next/link";
import { notFound } from "next/navigation";
import { MDX, RenderMarkdown } from "@jerryqiu/render";
import { SiteShell } from "@/components/site/SiteShell";
import { person } from "@/content/site";
import { getWriting } from "@/lib/content";
import "@/components/site/post.css";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = (await getWriting()).find((x) => x.slug === slug);
  if (!p) return {};
  return {
    title: p.title,
    description: p.summary,
    openGraph: { type: "article", publishedTime: p.date },
  };
}

const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const all = await getWriting();
  const i = all.findIndex((x) => x.slug === slug);
  if (i < 0) notFound();
  const p = all[i];
  const prev = all[i + 1];
  const next = all[i - 1];
  const cover = p.cover;
  return (
    <SiteShell transparentTop={false}>
      <ScrollProgress />
      <Container size="md" style={{ paddingTop: "clamp(2rem, 6vw, 4rem)" }}>
        <Breadcrumbs items={[{ label: "Writing", href: "/writing" }, { label: p.title }]} />
        <Eyebrow style={{ margin: "2.5rem 0 1rem" }}>
          {fmt(p.date)} · {person.name}
        </Eyebrow>
        <Heading as="h1" size="4xl" display>
          {p.title}
        </Heading>
        {p.subtitle ? (
          <Text size="xl" tone="muted" style={{ marginTop: "1.25rem", fontStyle: "italic" }}>
            {p.subtitle}
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
          {p.body.kind === "mdx" ? <MDX source={p.body.source} /> : <RenderMarkdown source={p.body.source} />}
        </Container>
      </Section>
      <Container size="md">
        <nav className="next-prev" aria-label="More writing">
          {prev ? (
            <NextLink href={`/writing/${prev.slug}`}>
              <span>← Older</span>
              <strong>{prev.title}</strong>
            </NextLink>
          ) : (
            <span />
          )}
          {next ? (
            <NextLink href={`/writing/${next.slug}`}>
              <span>Newer →</span>
              <strong>{next.title}</strong>
            </NextLink>
          ) : (
            <span />
          )}
        </nav>
      </Container>
    </SiteShell>
  );
}
