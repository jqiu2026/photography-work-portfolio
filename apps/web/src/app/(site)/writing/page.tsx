import { Container, Section } from "@halation/ui";
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

export default async function Writing() {
  const posts = await getWriting();
  return (
    <SiteShell transparentTop={false}>
      <PageHeader eyebrow="Writing" title="Notes" intro="Thoughts, stories and notes from my creative journey." />
      <Section style={{ paddingTop: 0 }}>
        <Container size="md">
          <div className="home-writing">
            {posts.map((p) => (
              <NextLink key={p.slug} href={`/writing/${p.slug}`}>
                <time dateTime={p.date}>{fmt(p.date)}</time>
                <div>
                  <h2
                    style={{
                      fontFamily: "var(--hl-font-display)",
                      fontWeight: "var(--hl-display-weight)",
                      fontSize: "var(--hl-text-2xl)",
                    }}
                  >
                    {p.title}
                  </h2>
                  {p.summary ? <p>{p.summary}</p> : null}
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
