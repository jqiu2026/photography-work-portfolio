import { RIGHTS_LABELS, TIERS } from "@jerryqiu/scores";
import { getSite } from "@jerryqiu/sites";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/AddToCart";
import { PageHeader } from "@/components/PageHeader";
import { Player } from "@/components/Player";
import { Tag } from "@/components/ui";
import { getWork } from "@/lib/data";
import { LEVEL, TIER_LABEL, duration, usd } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getWork((await params).slug);
  if (!page) return { title: "Not found" };
  return { title: page.work.title, description: page.work.summary ?? `${page.work.title} by Jerry Qiu.` };
}

export default async function Piece({ params }: Props) {
  const { slug } = await params;
  const page = await getWork(slug);
  if (!page) notFound();
  const { work, files, products, saleBlocked, items } = page;
  const recordings = items.filter((i) => i.kind === "recording" && i.provider && i.embedId);
  const performances = items.filter((i) => i.kind === "performance");
  const preview = files.find((f) => f.kind === "full-score" && f.mime === "application/pdf" && f.previewPages > 0);
  const url = `${getSite("music").url}/compositions/${work.slug}`;
  const ld = {
    "@context": "https://schema.org",
    "@type": "MusicComposition",
    name: work.title,
    composer: { "@type": "Person", name: "Jerry Qiu" },
    url,
    ...(work.year ? { dateCreated: String(work.year) } : {}),
  };
  return (
    <main id="main">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }}
      />
      <PageHeader eyebrow={work.genre ?? "Composition"} title={work.title} intro={work.summary} />
      <div className="mu-wrap mu-section mu-piece">
        <div className="mu-stack">
          {recordings.length ? (
            <section aria-labelledby="listen" className="mu-stack">
              <h2 id="listen" className="mu-h2">
                Listen
              </h2>
              {recordings.map((r) => (
                <Player
                  key={r.id}
                  provider={r.provider as string}
                  id={r.embedId as string}
                  title={r.title}
                  note={r.note ?? undefined}
                />
              ))}
            </section>
          ) : null}
          {work.programNote ? (
            <section aria-labelledby="note" className="mu-stack">
              <h2 id="note" className="mu-h2">
                Program note
              </h2>
              <div className="hm-prose mu-voice">
                {work.programNote.split(/\n{2,}/).map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </section>
          ) : null}
          {preview ? (
            <section aria-labelledby="look" className="mu-stack">
              <h2 id="look" className="mu-h2">
                Look inside
              </h2>
              <iframe
                className="mu-preview"
                title={`Preview of the score of ${work.title}`}
                src={`/api/preview/${preview.id}#toolbar=0&navpanes=0`}
                loading="lazy"
              />
              <p className="mu-muted">The first {preview.previewPages} pages. The full score comes with a license.</p>
            </section>
          ) : null}
          {performances.length ? (
            <section aria-labelledby="perfs" className="mu-stack">
              <h2 id="perfs" className="mu-h2">
                Performances
              </h2>
              <ul className="mu-list">
                {performances.map((p) => (
                  <li key={p.id}>
                    <span>{[p.title, p.ensemble].filter(Boolean).join(", ")}</span>
                    <span className="mu-muted">{[p.date, p.venue].filter(Boolean).join(" · ")}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="mu-stack" aria-label="Details and score">
          <dl className="mu-facts">
            {work.year ? (
              <>
                <dt>Year</dt>
                <dd>{work.year}</dd>
              </>
            ) : null}
            {work.forces ? (
              <>
                <dt>For</dt>
                <dd>{work.forces}</dd>
              </>
            ) : null}
            {work.durationSec ? (
              <>
                <dt>Length</dt>
                <dd>{duration(work.durationSec)}</dd>
              </>
            ) : null}
            {work.difficulty ? (
              <>
                <dt>Level</dt>
                <dd>{LEVEL[work.difficulty] ?? work.difficulty}</dd>
              </>
            ) : null}
            <dt>Rights</dt>
            <dd>{RIGHTS_LABELS[work.rightsType]}</dd>
          </dl>
          {work.instruments.length ? (
            <div className="mu-tags">
              {work.instruments.map((i) => (
                <Link key={i} href={`/compositions?instrument=${encodeURIComponent(i)}`}>
                  <Tag>{i}</Tag>
                </Link>
              ))}
            </div>
          ) : null}

          <section className="mu-buy" aria-labelledby="score">
            <h2 id="score" className="mu-h2" style={{ margin: 0 }}>
              Score
            </h2>
            {products.length ? (
              <>
                {products.map((p) => (
                  <div key={p.id} className="mu-offer">
                    <div className="mu-row" style={{ justifyContent: "space-between" }}>
                      <strong>{p.title}</strong>
                      <span className="mu-price">{p.priceCents === 0 ? "Free" : usd(p.priceCents)}</span>
                    </div>
                    <p className="mu-muted" style={{ margin: 0 }}>
                      {TIER_LABEL[p.tier]}: {TIERS[p.tier].summary}
                    </p>
                    {p.description ? <p style={{ margin: 0 }}>{p.description}</p> : null}
                    <div className="mu-row">
                      <AddToCart productId={p.id} />
                    </div>
                  </div>
                ))}
                <p className="mu-muted" style={{ margin: 0 }}>
                  A card fee is added at checkout. Every copy is made for you, with your name and license number on it.{" "}
                  <Link className="mu-link" href="/licensing">
                    What the licenses allow
                  </Link>
                  .
                </p>
              </>
            ) : (
              <p className="mu-muted" style={{ margin: 0 }}>
                {saleBlocked ?? "There is no score for sale for this piece."}{" "}
                <Link className="mu-link" href="/commission">
                  Ask about it
                </Link>
                .
              </p>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
