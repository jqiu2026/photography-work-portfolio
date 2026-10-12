import { Breadcrumbs, Container, Heading, Eyebrow, Section, Text } from "@placeholder/ui";
import { Gallery, Image, type GalleryImage } from "@placeholder/ui/media";
import { cookies } from "next/headers";
import NextLink from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MDX } from "@/components/site/MDX";
import { PasswordGate } from "@/components/site/PasswordGate";
import { SiteShell } from "@/components/site/SiteShell";
import "@/components/work/work.css";
import { person } from "@/content/site";
import { getProjects, imageId, projectCover } from "@/lib/content";
import { getImage } from "@/lib/images";

export function generateStaticParams() {
  return getProjects().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getProjects().find((x) => x.slug === slug);
  if (!p) return {};
  return {
    title: p.metadata.title,
    description: p.metadata.summary,
    openGraph: { images: [`/api/og/generate?title=${encodeURIComponent(p.metadata.title)}`] },
  };
}

const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "long", year: "numeric" });

export default async function Project({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const all = getProjects();
  const i = all.findIndex((x) => x.slug === slug);
  if (i < 0) notFound();
  const p = all[i];
  const prev = all[i + 1];
  const next = all[i - 1];

  if (p.metadata.protected && (await cookies()).get("authToken")?.value !== "authenticated") {
    return (
      <SiteShell transparentTop={false}>
        <Container size="sm" style={{ paddingBlock: "8rem" }}>
          <Heading as="h1" size="3xl" display>
            {p.metadata.title}
          </Heading>
          <Text tone="muted" style={{ margin: "1rem 0 2rem" }}>
            This project is password protected.
          </Text>
          <PasswordGate />
        </Container>
      </SiteShell>
    );
  }

  const cover = projectCover(p);
  const images: GalleryImage[] = p.metadata.images.map((src, n) => ({
    ...getImage("projects", imageId(src)),
    alt: `${p.metadata.title}, photograph ${n + 1}`,
  }));

  return (
    <SiteShell transparentTop={false}>
      <Container style={{ paddingTop: "clamp(2rem, 6vw, 4rem)" }}>
        <Breadcrumbs items={[{ label: "Work", href: "/work" }, { label: p.metadata.title }]} />
        <Eyebrow style={{ margin: "2.5rem 0 1rem" }}>{fmt(p.metadata.publishedAt)}</Eyebrow>
        <Heading as="h1" size="4xl" display style={{ maxWidth: "20ch" }}>
          {p.metadata.title}
        </Heading>
        {p.metadata.summary ? (
          <Text size="xl" tone="muted" style={{ marginTop: "1.25rem" }}>
            {p.metadata.summary}
          </Text>
        ) : null}
        <dl className="work-detail__meta">
          <div>
            <dt>Credit</dt>
            <dd>
              {p.metadata.team?.length ? p.metadata.team.map((t) => `${t.name}, ${t.role}`).join(" · ") : person.name}
            </dd>
          </div>
          <div>
            <dt>Date</dt>
            <dd>{fmt(p.metadata.publishedAt)}</dd>
          </div>
        </dl>
      </Container>
      {cover ? (
        <div className="work-detail__hero" style={{ marginTop: "3rem" }}>
          <Image
            asset={getImage(cover.group, cover.id)}
            alt={`${p.metadata.title}, cover photograph`}
            sizes="100vw"
            priority
          />
        </div>
      ) : null}
      <Section>
        <Container size="md">
          <MDX source={p.content} />
        </Container>
      </Section>
      {images.length > 1 ? (
        <Section tone="surface">
          <Container>
            <Gallery images={images} rowHeight={300} />
          </Container>
        </Section>
      ) : null}
      <Container>
        <nav className="next-prev" aria-label="More projects">
          {prev ? (
            <NextLink href={`/work/${prev.slug}`}>
              <span>← Previous</span>
              <strong>{prev.metadata.title}</strong>
            </NextLink>
          ) : (
            <span />
          )}
          {next ? (
            <NextLink href={`/work/${next.slug}`}>
              <span>Next →</span>
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
