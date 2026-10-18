import { ProtectedImage } from "@halation/ui/media";
import { Reveal, Surface } from "@holominimal/ui";
import { getSite } from "@jerryqiu/sites";
import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/Shell";
import { getPortfolio } from "@/lib/portfolio";
import { getWork } from "@/lib/work";
import "./globals.css";

export const metadata: Metadata = {
  title: { absolute: "Photography · Jerry Qiu" },
  description: "Photography by Jerry Qiu: theater, events, street and aviation, shot mostly around New York.",
};

// Draft captions, one per kind of photograph (the first photograph of that gallery). TODO(owner): rewrite every line
// in your voice and check it against the photograph.
const captions: { category: string; text: string }[] = [
  { category: "theater", text: "Stage light is generous, and brief." },
  { category: "event", text: "Most of this job is waiting for the half second where someone forgets I'm there." },
  { category: "street", text: "Snow edits the city for free." },
  { category: "macro", text: "Close enough that the world becomes a texture." },
  { category: "aviation", text: "Planes are patient. I'm not, but I try." },
];

const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "long", year: "numeric" });

export default async function Home() {
  const { categories, photosIn, hero, photos } = await getPortfolio();
  const work = await getWork();
  const selected = captions
    .map((c) => ({ ...c, p: photosIn(c.category)[0] }))
    .filter((c): c is { category: string; text: string; p: NonNullable<(typeof c)["p"]> } => !!c.p);
  const lead = hero ?? photos[0];
  // the lead photograph first, then the rest of the selection without repeating it
  const mosaic = [
    ...(lead ? [{ category: "", text: "", p: lead }] : []),
    ...selected.filter((s) => s.p.id !== lead?.id),
  ].slice(0, 6);
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
      <div className="pub-wrap">
        <header className="pub-hero">
          <p className="hm-eyebrow hm-enter" style={{ "--hm-i": 0 } as React.CSSProperties}>
            Photography · New York
          </p>
          <h1 className="hm-enter" style={{ "--hm-i": 1 } as React.CSSProperties}>
            Pictures of people at work.
          </h1>
          {/* TODO(owner): rewrite in your voice. Existing owner text from the original site. */}
          <p className="pub-lede hm-enter" style={{ "--hm-i": 2 } as React.CSSProperties}>
            Photography is how I started, and it is still how I pay attention. I make pictures of people at work, then
            spend a long time trying to make them honest.
          </p>
          <p className="pub-places hm-enter" style={{ "--hm-i": 3 } as React.CSSProperties}>
            Theater · Events · Street · Aviation
          </p>
          <div className="pub-actions hm-enter" style={{ "--hm-i": 4 } as React.CSSProperties}>
            <Link href="/portfolio" className="pub-btn">
              See the portfolio
            </Link>
            <Link href="/book" className="pub-btn pub-btn--ghost">
              Book a shoot
            </Link>
          </div>
        </header>

        <ul className="pub-mosaic" aria-label="Selected photographs">
          {mosaic.map((m, i) => (
            <li key={m.p.id ?? i} data-lead={i === 0 ? "" : undefined}>
              <Link href={m.category ? `/portfolio/${m.category}` : "/portfolio"}>
                <figure>
                  <ProtectedImage
                    asset={m.p}
                    alt={m.p.alt ?? ""}
                    sizes={i === 0 ? "(min-width: 900px) 62vw, 92vw" : "(min-width: 900px) 30vw, 92vw"}
                    priority={i < 2}
                    fill
                  />
                  {m.text ? <figcaption>{m.text}</figcaption> : null}
                </figure>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <section className="pub-section" aria-labelledby="by-kind">
        <div className="pub-wrap">
          <div className="pub-head-row">
            <h2 id="by-kind">By kind</h2>
            <Link href="/portfolio" className="pub-link">
              All photographs →
            </Link>
          </div>
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

      {work.length ? (
        <section className="pub-section" aria-labelledby="projects">
          <div className="pub-wrap">
            <div className="pub-head-row">
              <h2 id="projects">Projects</h2>
              <Link href="/work" className="pub-link">
                All projects →
              </Link>
            </div>
            <ul className="pub-projects">
              {work
                .filter((w) => w.cover)
                .slice(0, 4)
                .map((w) => (
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
            <Link href="/book" className="pub-btn">
              Start a booking
            </Link>
          </div>
        </div>
      </div>
    </Shell>
  );
}
