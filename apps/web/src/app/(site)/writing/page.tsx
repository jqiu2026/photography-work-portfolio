import { Container, Section } from "@placeholder/ui";
import type { Metadata } from "next";
import NextLink from "next/link";
import { PageHeader } from "@/components/site/PageHeader";
import { SiteShell } from "@/components/site/SiteShell";
import "@/components/home/home.css";
import { getWriting } from "@/lib/content";

export const metadata: Metadata = {
  title: "Writing",
  description: "Thoughts, stories and notes from my creative journey.",
  alternates: { types: { "application/rss+xml": "/writing/rss.xml" } },
};

const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" });

export default function Writing() {
  return (
    <SiteShell transparentTop={false}>
      <PageHeader eyebrow="Writing" title="Notes" intro="Thoughts, stories and notes from my creative journey." />
      <Section style={{ paddingTop: 0 }}>
        <Container size="md">
          <div className="home-writing">
            {getWriting().map((p) => (
              <NextLink key={p.slug} href={`/writing/${p.slug}`}>
                <time dateTime={p.metadata.publishedAt}>{fmt(p.metadata.publishedAt)}</time>
                <div>
                  <h2
                    style={{
                      fontFamily: "var(--ph-font-display)",
                      fontWeight: "var(--ph-display-weight)",
                      fontSize: "var(--ph-text-2xl)",
                    }}
                  >
                    {p.metadata.title}
                  </h2>
                  {p.metadata.summary ? <p>{p.metadata.summary}</p> : null}
                </div>
              </NextLink>
            ))}
          </div>
          <p style={{ marginTop: "2rem" }}>
            <a href="/writing/rss.xml">RSS feed</a>
          </p>
        </Container>
      </Section>
    </SiteShell>
  );
}
