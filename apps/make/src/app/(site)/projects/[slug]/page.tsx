import { PLACES } from "@jerryqiu/db/make";
import { getMakeUrl } from "@jerryqiu/sites";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/Markdown";
import { PageHeader } from "@/components/PageHeader";
import { Button, Tag } from "@/components/ui";
import { getProject } from "@/lib/data";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = await getProject((await params).slug);
  if (!d) return { title: "Not found" };
  return { title: d.project.title, description: d.project.summary ?? undefined };
}

const KIND: Record<string, string> = { demo: "Try it", source: "Source", writeup: "Write-up", other: "Link" };

export default async function Project({ params }: Props) {
  const { slug } = await params;
  const d = await getProject(slug);
  if (!d) notFound();
  const { project: p, place, images, now } = d;
  const ld = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: p.title,
    author: { "@type": "Person", name: "Jerry Qiu" },
    url: `${getMakeUrl()}/projects/${p.slug}`,
    ...(p.summary ? { description: p.summary } : {}),
    ...(p.year ? { dateCreated: String(p.year) } : {}),
  };
  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }}
      />
      <PageHeader eyebrow={`${PLACES[place].word}: ${PLACES[place].plain}`} title={p.title} intro={p.summary} />
      <div className="mk-wrap mk-section mk-detail">
        <div className="mk-stack">
          {images.map((i) => (
            <figure key={i.id} className="mk-shot">
              <img
                src={`/api/img/${i.id}`}
                alt={i.alt}
                width={i.width ?? undefined}
                height={i.height ?? undefined}
                loading="lazy"
              />
              {i.caption ? <figcaption>{i.caption}</figcaption> : null}
            </figure>
          ))}
          {p.body ? <Markdown>{p.body}</Markdown> : null}
          {p.lessons ? (
            <section aria-labelledby="learned" className="mk-stack">
              <h2 id="learned" className="mk-h2">
                What I learned
              </h2>
              <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{p.lessons}</p>
            </section>
          ) : null}
        </div>
        <aside className="mk-stack" aria-label="About this project">
          <dl className="mk-facts">
            {p.year ? (
              <>
                <dt>Year</dt>
                <dd>{p.year}</dd>
              </>
            ) : null}
            {p.role ? (
              <>
                <dt>My part</dt>
                <dd>{p.role}</dd>
              </>
            ) : null}
            <dt>Status</dt>
            <dd>{PLACES[place].plain}</dd>
          </dl>
          {p.stack.length ? (
            <div className="mk-tags">
              {p.stack.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
          ) : null}
          {p.links.length ? (
            <div className="mk-row">
              {p.links.map((l) => (
                <Button key={l.url} asChild variant={l.kind === "demo" ? "primary" : "secondary"}>
                  <a href={l.url} rel="noopener noreferrer">
                    {l.label || KIND[l.kind]}
                  </a>
                </Button>
              ))}
            </div>
          ) : null}
          {now.length ? (
            <section className="mk-note" aria-labelledby="lately">
              <h2 id="lately" className="mk-h2" style={{ fontSize: "var(--hm-text-md)" }}>
                Lately
              </h2>
              {now.map((n) => (
                <p key={n.id} style={{ margin: "0 0 0.4rem" }}>
                  {n.body}
                </p>
              ))}
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
