import type { Metadata } from "next";
import Link from "next/link";
import { AddToCart } from "@/components/AddToCart";
import { PageHeader } from "@/components/PageHeader";
import { PieceCard } from "@/components/PieceCard";
import { EmptyState } from "@/components/ui";
import { getBundles, getCatalog } from "@/lib/data";
import { usd } from "@/lib/format";

export const metadata: Metadata = {
  title: "Scores",
  description: "Scores by Jerry Qiu to play: PDF with a license, a copy made for you.",
};

export default async function Scores() {
  const [pieces, bundles] = await Promise.all([getCatalog(JSON.stringify({ forSale: true })), getBundles()]);
  return (
    <main id="main">
      <PageHeader
        eyebrow="Music"
        title="Scores"
        intro="Download the score and play it. Each copy is made for you with your name and license number. Personal, ensemble and institution licenses."
      />
      <div className="mu-wrap mu-section mu-stack">
        {bundles.length ? (
          <section aria-labelledby="bundles" className="mu-stack">
            <h2 id="bundles" className="mu-h2">
              Bundles
            </h2>
            <div className="mu-grid">
              {bundles.map((b) => {
                const whole = b.parts.reduce((n, p) => n + p.priceCents, 0);
                return (
                  <div key={b.id} className="mu-card">
                    <h3>{b.title}</h3>
                    {b.description ? <p>{b.description}</p> : null}
                    <p className="mu-mono">{b.parts.length} scores</p>
                    <p>
                      <span className="mu-price">{usd(b.priceCents)}</span>{" "}
                      <span className="mu-muted">
                        <s>{usd(whole)}</s> separately
                      </span>
                    </p>
                    <div className="mu-row">
                      <AddToCart productId={b.id} label="Add bundle" />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}
        <section aria-labelledby="all" className="mu-stack">
          <h2 id="all" className="mu-h2">
            All scores
          </h2>
          {pieces.length ? (
            <div className="mu-grid">
              {pieces.map((c) => (
                <PieceCard key={c.id} e={c} />
              ))}
            </div>
          ) : (
            <EmptyState>
              No scores are for sale yet. Check back soon, or <Link href="/commission">ask for one</Link>.
            </EmptyState>
          )}
        </section>
      </div>
    </main>
  );
}
