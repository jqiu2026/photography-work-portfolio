import type { Metadata } from "next";
import NextLink from "next/link";
import { PageHeader } from "@/components/site/PageHeader";
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
    <div>
      <PageHeader eyebrow="Writing" title="Notes" intro="Thoughts, stories and notes from my creative journey." />
      <div className="hb-wrap hb-section">
        {posts.map((p) => (
          <NextLink key={p.slug} href={`/writing/${p.slug}`} className="hb-post">
            <time dateTime={p.date} className="hb-mono">
              {fmt(p.date)}
            </time>
            <h2>{p.title}</h2>
            {p.summary ? <span className="hb-muted">{p.summary}</span> : null}
          </NextLink>
        ))}
        <p style={{ marginTop: "2rem" }}>
          <a className="hb-link" href="/writing/rss.xml">
            RSS feed
          </a>
        </p>
      </div>
    </div>
  );
}
