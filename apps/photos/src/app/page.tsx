import { ProtectedImage } from "@halation/ui/media";
import { Condense, Scene, Settle, StageProvider, Streak } from "@halation/ui/stage";
import { getSite } from "@jerryqiu/sites";
import { ShellIndex } from "@jerryqiu/sites/index-control";
import type { Metadata } from "next";
import Link from "next/link";
import { Aperture } from "@/components/Aperture";
import { nav } from "@/content/nav";
import { getPortfolio } from "@/lib/portfolio";
import { getWork } from "@/lib/work";
import "./globals.css";
import "./home.css";

export const metadata: Metadata = {
  title: { absolute: "Photography · Jerry Qiu" },
  description: "Photography by Jerry Qiu: theater, events, street and aviation, shot mostly around New York.",
};

// Draft captions, one per kind of photograph (the first photograph of that gallery). TODO(owner): rewrite every line
// in your voice and check it against the photograph.
const slidePlan: { category: string; text: string }[] = [
  { category: "theater", text: "Stage light is generous, and brief." },
  { category: "event", text: "Most of this job is waiting for the half second where someone forgets I'm there." },
  { category: "street", text: "Snow edits the city for free." },
  { category: "macro", text: "Close enough that the world becomes a texture." },
  { category: "aviation", text: "Planes are patient. I'm not, but I try." },
];

const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "long", year: "numeric" });

export default async function Home() {
  const { photos, hero, categories, photosIn } = await getPortfolio();
  const work = await getWork();
  const slides = slidePlan
    .map((s) => ({ ...s, p: photosIn(s.category)[0] }))
    .filter((s): s is { category: string; text: string; p: NonNullable<(typeof s)["p"]> } => !!s.p);
  const cats = categories
    .map((c) => ({ ...c, count: photosIn(c.slug).length, cover: photosIn(c.slug)[0] }))
    .filter((c) => c.count);
  const lead = hero ?? photos[0];
  const hub = getSite("hub");

  const ld = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "Jerry Qiu Photography",
    url: getSite("photos").url,
    description: "Photography by Jerry Qiu: theater, events, street and aviation, shot mostly around New York.",
  };
  return (
    <StageProvider world="photos" cinema>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <a className="hl-skip" href="#main">
        Skip to content
      </a>
      <ShellIndex routes={[{ label: "Home", href: "/" }, ...nav]} />
      <main id="main" className="pg">
        <Scene id="open" label="Photography" as="header" className="pg-open">
          <div className="pg-wrap pg-open__grid">
            <div>
              <p className="hl-eyebrow">Jerry Qiu · Photography</p>
              <Streak as="h1" text="Pictures of people at work." className="pg-title" />
              {/* TODO(owner): rewrite in your voice. Existing owner text from the original site. */}
              <Settle as="p" className="pg-lede" when="load">
                Photography is how I started, and it is still how I pay attention. I make pictures of people at work,
                then spend a long time trying to make them honest.
              </Settle>
              <Settle as="p" className="pg-places" when="load">
                Theater · Events · Street · Aviation · New York
              </Settle>
            </div>
            {lead ? (
              <figure className="pg-open__photo">
                <ProtectedImage
                  asset={lead}
                  alt={lead.alt ?? "A portrait photograph."}
                  sizes="(min-width: 900px) 36vw, 90vw"
                  priority
                />
              </figure>
            ) : null}
          </div>
        </Scene>

        <Scene id="aperture" label="Aperture" pin={slides.length * 1.1} className="pg-aperture">
          <Aperture
            slides={slides.map((s) => ({
              key: s.category,
              caption: s.text,
              node: <ProtectedImage asset={s.p} alt={s.p.alt ?? ""} sizes="(min-width: 900px) 60vw, 100vw" fill />,
            }))}
          />
        </Scene>

        <Scene id="portfolio" label="Photographs" className="pg-portfolio">
          <div className="pg-wrap">
            <Condense text="Everything I've shot, by kind." className="pg-h2" />
            <ul className="pg-cats">
              {cats.map((c) => (
                <li key={c.slug}>
                  <Link href={`/portfolio/${c.slug}`} className="pg-cat">
                    {c.cover ? (
                      <ProtectedImage asset={c.cover} alt="" sizes="(min-width: 900px) 22vw, 70vw" fill />
                    ) : null}
                    <span className="pg-cat__label">
                      {c.name}
                      <small>{c.count}</small>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Scene>

        {work.length ? (
          <Scene id="work" label="Projects" className="pg-work">
            <div className="pg-wrap">
              <Condense text="Projects, start to finish." className="pg-h2" />
              <ul className="pg-projects">
                {work.slice(0, 4).map((w) => (
                  <li key={w.slug}>
                    <Link href={`/work/${w.slug}`}>
                      {w.cover ? <ProtectedImage asset={w.cover} alt="" sizes="(min-width: 900px) 46vw, 92vw" /> : null}
                      <span className="pg-projects__t">{w.title}</span>
                      <span className="hl-eyebrow">{[fmt(w.date), w.summary].filter(Boolean).join(" · ")}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/work" className="pg-more">
                All projects →
              </Link>
            </div>
          </Scene>
        ) : null}

        <Scene id="platform" label="The platform" className="pg-work">
          <div className="pg-wrap">
            <Condense text="The studio behind the pictures." className="pg-h2" />
            <Settle as="p" className="pg-lede">
              This site is also a working platform for running a photography business: booking, quotes, contracts,
              payments, private galleries and a client portal. Every part is listed with an honest status.
            </Settle>
            <ul className="mk-cards" aria-label="Platform highlights">
              <li>
                <h3>Book</h3>
                <p>Pick a free time or send an inquiry. Deposits hold your date.</p>
                <Link href="/how-it-works" className="pg-more">
                  How it works →
                </Link>
              </li>
              <li>
                <h3>Deliver</h3>
                <p>Private, protected galleries with proofing, selections and downloads.</p>
                <Link href="/galleries" className="pg-more">
                  Galleries →
                </Link>
              </li>
              <li>
                <h3>One place for clients</h3>
                <p>Paperwork, payments, messages and progress in a portal.</p>
                <Link href="/client-portal" className="pg-more">
                  Portal tour →
                </Link>
              </li>
              <li>
                <h3>Every feature, with a status</h3>
                <p>Live, Preview or Soon: no claim without a badge.</p>
                <Link href="/features" className="pg-more">
                  Features →
                </Link>
              </li>
            </ul>
          </div>
        </Scene>

        <Scene id="video" label="Video" className="pg-video">
          <div className="pg-wrap pg-split">
            <Condense text="Moving pictures." className="pg-h2" />
            <div>
              <Settle as="p" className="pg-lede">
                Video work lives on its own page.
              </Settle>
              <Link href="/video" className="pg-more">
                Watch →
              </Link>
            </div>
          </div>
        </Scene>

        <Scene id="book" label="Book a shoot" className="pg-book">
          <div className="pg-wrap pg-split">
            <Condense text="Book a shoot." className="pg-h2" />
            <div>
              {/* TODO(owner): rewrite in your voice. */}
              <Settle as="p" className="pg-lede">
                Tell me about the event or the idea. I'll reply by email.
              </Settle>
              <div className="pg-actions">
                <Link href="/book" className="pg-btn">
                  Start a booking
                </Link>
                <Link href="/client" className="pg-btn pg-btn--ghost">
                  Clients: your gallery
                </Link>
              </div>
            </div>
          </div>
        </Scene>

        <Scene id="hello" label="Say hello" className="pg-hello">
          <div className="pg-wrap">
            <Condense text="Say hello." className="pg-hello__t" />
            <Settle as="p" className="pg-lede">
              A question about a photograph, a licence, a rehearsal? Write.
            </Settle>
            <div className="pg-actions">
              <Link href="/book" className="pg-btn">
                Get in touch
              </Link>
            </div>
          </div>
        </Scene>
      </main>
      <footer className="hl-footer">
        <div className="hl-footer__in">
          <p className="hl-footer__note">
            © {new Date().getFullYear()} Jerry Qiu. All photographs are © Jerry Qiu, all rights reserved, unless stated.
          </p>
          <Link href="/privacy">Privacy</Link>
          <a className="hl-return" href={hub.url} data-return-to-hub>
            jerryqiu.com
          </a>
        </div>
      </footer>
    </StageProvider>
  );
}
