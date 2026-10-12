import { Breadcrumbs, Container, Eyebrow, Heading, Section, Text } from "@placeholder/ui";
import { Gallery, Image, type GalleryImage } from "@placeholder/ui/media";
import { Blocks, MDX } from "@jerryqiu/render";
import { getSite } from "@jerryqiu/sites";
import { person } from "@jerryqiu/sites/profile";
import { cookies } from "next/headers";
import NextLink from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Shell } from "@/components/Shell";
import { PasswordGate } from "@/components/work/PasswordGate";
import "@/components/work/work.css";
import { getWork } from "@/lib/work";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = (await getWork()).find((x) => x.slug === slug);
  if (!p) return {};
  return { title: p.title, description: p.summary };
}

const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "long", year: "numeric" });

export default async function Project({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const all = await getWork();
  const i = all.findIndex((x) => x.slug === slug);
  if (i < 0) notFound();
  const p = all[i];
  const prev = all[i + 1];
  const next = all[i - 1];

  if (p.protectedPage && (await cookies()).get("authToken")?.value !== "authenticated") {
    return (
      <Shell>
        <Container size="sm" style={{ paddingBlock: "8rem" }}>
          <Heading as="h1" size="3xl" display>
            {p.title}
          </Heading>
          <Text tone="muted" style={{ margin: "1rem 0 2rem" }}>
            This project is password protected.
          </Text>
          <PasswordGate />
        </Container>
      </Shell>
    );
  }

  const images: GalleryImage[] = p.images;
  const url = `${getSite("photos").url}/work/${p.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: p.title,
    description: p.summary,
    dateCreated: p.date,
    url,
    creator: { "@type": "Person", name: person.name },
    ...(p.cover?.files.length ? { image: `${getSite("photos").url}${p.cover.files.at(-1)?.src}` } : {}),
  };

  return (
    <Shell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Container style={{ paddingTop: "clamp(2rem, 6vw, 4rem)" }}>
        <Breadcrumbs items={[{ label: "Work", href: "/work" }, { label: p.title }]} />
        <Eyebrow style={{ margin: "2.5rem 0 1rem" }}>{fmt(p.date)}</Eyebrow>
        <Heading as="h1" size="4xl" display style={{ maxWidth: "20ch" }}>
          {p.title}
        </Heading>
        {p.summary ? (
          <Text size="xl" tone="muted" style={{ marginTop: "1.25rem" }}>
            {p.summary}
          </Text>
        ) : null}
        <dl className="work-detail__meta">
          <div>
            <dt>Credit</dt>
            <dd>{p.credits.length ? p.credits.map((t) => `${t.name}, ${t.role}`).join(" · ") : person.name}</dd>
          </div>
          <div>
            <dt>Date</dt>
            <dd>{fmt(p.date)}</dd>
          </div>
        </dl>
      </Container>
      {p.cover ? (
        <div className="work-detail__hero" style={{ marginTop: "3rem" }}>
          <Image asset={p.cover} alt={`${p.title}, cover photograph`} sizes="100vw" priority />
        </div>
      ) : null}
      <Section>
        <Container size="md">
          {p.body.kind === "mdx" ? <MDX source={p.body.source} /> : <Blocks blocks={p.body.blocks} title={p.title} />}
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
              <strong>{prev.title}</strong>
            </NextLink>
          ) : (
            <span />
          )}
          {next ? (
            <NextLink href={`/work/${next.slug}`}>
              <span>Next →</span>
              <strong>{next.title}</strong>
            </NextLink>
          ) : (
            <span />
          )}
        </nav>
      </Container>
    </Shell>
  );
}
