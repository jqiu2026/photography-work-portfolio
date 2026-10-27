import type { Metadata } from "next";
import NextLink from "next/link";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/site/Markdown";
import { Mdx } from "@/components/site/Mdx";
import { PageHeader } from "@/components/site/PageHeader";
import { person } from "@/content/site";
import { getWriting } from "@/lib/content";
import { srcSet } from "@/lib/images";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = (await getWriting()).find((x) => x.slug === slug);
  if (!p) return {};
  return { title: p.title, description: p.summary, openGraph: { type: "article", publishedTime: p.date } };
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
    <article>
      <PageHeader eyebrow={`${fmt(p.date)} · ${person.name}`} title={p.title} intro={p.subtitle} />
      {cover ? (
        <div className="hb-wrap" style={{ marginBottom: "2rem" }}>
          <figure className="hb-shot" style={{ margin: 0 }}>
            <img
              src={cover.files[cover.files.length - 1].src}
              srcSet={srcSet(cover)}
              sizes="(min-width: 900px) 70vw, 100vw"
              width={cover.width}
              height={cover.height}
              alt=""
              style={{
                backgroundColor: cover.color,
                width: "100%",
                height: "auto",
                borderRadius: "var(--hm-radius-lg)",
              }}
            />
          </figure>
        </div>
      ) : null}
      <div className="hb-wrap">
        {p.body.kind === "mdx" ? <Mdx source={p.body.source} /> : <Markdown source={p.body.source} />}
      </div>
      <div className="hb-wrap">
        <nav className="hb-nextprev" aria-label="More writing">
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
      </div>
    </article>
  );
}
