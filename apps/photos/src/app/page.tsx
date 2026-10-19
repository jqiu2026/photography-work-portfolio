import { ProtectedImage } from "@/components/media";
import { Button, EmptyState } from "@holominimal/ui";
import { getSite } from "@jerryqiu/sites";
import type { Metadata } from "next";
import Link from "next/link";
import { HomeJourney } from "@/components/home/HomeJourney";
import { Shell } from "@/components/Shell";
import { getPublicCatalog } from "@/lib/catalog";
import { getPortfolio } from "@/lib/portfolio";
import { getWork } from "@/lib/work";
import "./globals.css";

export const metadata: Metadata = {
  title: { absolute: "Photography · Jerry Qiu" },
  description: "Photography by Jerry Qiu: theater, events, street and aviation, shot mostly around New York.",
};

const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "long", year: "numeric" });

export default async function Home() {
  const { categories, photosIn, featured, photos } = await getPortfolio();
  const projects = (await getWork()).filter((w) => w.cover).slice(0, 4);
  const { packages } = await getPublicCatalog();
  // the story opens on the featured set (one subject after another, so it shows range), then the rest
  const story = [...featured, ...photos.filter((p) => !featured.some((f) => f.id === p.id))].slice(0, 18);
  const cats = categories
    .map((c) => ({ ...c, count: photosIn(c.slug).length, cover: photosIn(c.slug)[0] }))
    .filter((c) => c.count);

  const ld = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "Jerry Qiu Photography",
    url: getSite("photos").url,
    description: "Photography by Jerry Qiu: theater, events, street and aviation, shot mostly around New York.",
  };
  return (
    <Shell intro>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <HomeJourney
        photos={story}
        subjects={categories.filter((c) => photosIn(c.slug).length).map((c) => ({ slug: c.slug, name: c.name }))}
        packages={packages.map((p) => ({
          id: p.id,
          name: p.name,
          tagline: p.tagline,
          price: p.price,
          featured: p.featured,
        }))}
      />

      {/* the end of the story: the dock and the top bar arrive here (ChromeReveal) */}
      <div className="pub-end" data-bar-end="">
        <section className="pub-section" aria-labelledby="by-kind">
          <div className="pub-wrap">
            <div className="pub-head-row">
              <h2 id="by-kind">By kind</h2>
              <Link href="/portfolio" className="pub-link">
                All photographs →
              </Link>
            </div>
            {cats.length ? null : <EmptyState>New photographs are on the way.</EmptyState>}
            <ul className="pub-cats">
              {cats.map((c) => (
                <li key={c.slug}>
                  <Link href={`/portfolio/${c.slug}`} className="pub-cat">
                    {c.cover ? (
                      <ProtectedImage asset={c.cover} alt="" sizes="(min-width: 900px) 16vw, 45vw" fill />
                    ) : null}
                    <span>
                      {c.name}
                      <small>{c.count}</small>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {projects.length ? (
          <section className="pub-section" aria-labelledby="projects">
            <div className="pub-wrap">
              <div className="pub-head-row">
                <h2 id="projects">Projects</h2>
                <Link href="/work" className="pub-link">
                  All projects →
                </Link>
              </div>
              <ul className="pub-projects">
                {projects.map((w) => (
                  <li key={w.slug}>
                    <Link href={`/work/${w.slug}`}>
                      {w.cover ? <ProtectedImage asset={w.cover} alt="" sizes="(min-width: 900px) 46vw, 92vw" /> : null}
                      <strong>{w.title}</strong>
                      <small>{[fmt(w.date), w.summary].filter(Boolean).join(" · ")}</small>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        <div className="pub-wrap">
          <div className="pub-cta-band">
            <div>
              <h2>Book a shoot</h2>
              {/* TODO(owner): rewrite in your voice. */}
              <p>Tell me about the event or the idea. I'll reply by email.</p>
            </div>
            <div className="pub-actions" style={{ margin: 0 }}>
              <Button asChild size="lg">
                <Link href="/book">Start a booking</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
