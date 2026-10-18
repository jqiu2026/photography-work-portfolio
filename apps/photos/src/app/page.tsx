import { ProtectedImage } from "@/components/media";
import { Button, EmptyState, Reveal, Surface } from "@holominimal/ui";
import { getSite } from "@jerryqiu/sites";
import type { Metadata } from "next";
import Link from "next/link";
import { HomeStory } from "@/components/home/HomeStory";
import { Shell } from "@/components/Shell";
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
    <Shell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <HomeStory
        photos={story}
        subjects={categories.filter((c) => photosIn(c.slug).length).map((c) => ({ slug: c.slug, name: c.name }))}
      />

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

      <section className="pub-section" aria-labelledby="studio">
        <div className="pub-wrap">
          <div className="pub-head-row">
            <h2 id="studio">Working with me</h2>
            <Link href="/features" className="pub-link">
              Everything the studio does →
            </Link>
          </div>
          <Reveal className="pub-studio">
            <Surface
              variant="outlined"
              padding="lg"
              interactive
              lit
              data-hm-reveal=""
              style={{ "--hm-i": 0 } as React.CSSProperties}
            >
              <h3>Book</h3>
              <p>Pick a free time or send an inquiry. A deposit holds your date.</p>
              <Link href="/how-it-works">How it works →</Link>
            </Surface>
            <Surface
              variant="outlined"
              padding="lg"
              interactive
              lit
              data-hm-reveal=""
              style={{ "--hm-i": 1 } as React.CSSProperties}
            >
              <h3>Deliver</h3>
              <p>Private, protected galleries with proofing, selections and downloads.</p>
              <Link href="/galleries">About galleries →</Link>
            </Surface>
            <Surface
              variant="outlined"
              padding="lg"
              interactive
              lit
              data-hm-reveal=""
              style={{ "--hm-i": 2 } as React.CSSProperties}
            >
              <h3>Stay in one place</h3>
              <p>Paperwork, payments, messages and progress in a client portal.</p>
              <Link href="/client-portal">Portal tour →</Link>
            </Surface>
            <Surface
              variant="outlined"
              padding="lg"
              interactive
              lit
              data-hm-reveal=""
              style={{ "--hm-i": 3 } as React.CSSProperties}
            >
              <h3>Know the cost</h3>
              <p>Packages list what you receive. Prices are set per shoot.</p>
              <Link href="/packages">Packages →</Link>
            </Surface>
          </Reveal>
        </div>
      </section>

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
    </Shell>
  );
}
