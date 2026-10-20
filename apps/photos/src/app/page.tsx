import { ProtectedImage } from "@/components/media";
import { Button, EmptyState } from "@holominimal/ui";
import { getSite } from "@jerryqiu/sites";
import { person } from "@jerryqiu/sites/profile";
import type { Metadata } from "next";
import Link from "next/link";
import { HomeInquiry } from "@/components/home/HomeInquiry";
import { HomeStory } from "@/components/home/HomeStory";
import { Shell } from "@/components/Shell";
import { END, pickSlots } from "@/content/home-story";
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
  const slots = pickSlots(photos);
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
      {/* the cinematic layer is on from the first paint unless reduced motion or Calm is chosen (see HomeStory) */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            'try{var c=0;try{c=localStorage.getItem("hj-calm")==="1"}catch(e){}if(!c&&!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.setAttribute("data-hj-motion","")}catch(e){}',
        }}
      />
      <HomeStory
        slots={slots}
        subjects={cats.map((c) => ({ slug: c.slug, name: c.name, count: c.count }))}
        packages={packages.map((p) => ({
          id: p.id,
          name: p.name,
          tagline: p.tagline,
          price: p.price,
          featured: p.featured,
          isSample: p.isSample,
          deliverables: p.deliverables,
          fees: p.fees,
        }))}
      />

      {/* the coda: the plain site, for skimming and direct navigation. The dock and the top bar arrive here (ChromeReveal). */}
      <div className="pub-end hj-coda" data-bar-end="">
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

        <section id="finale" className="hj-end" aria-labelledby="hj-finale-title">
          <div className="hj-end-inner">
            <div className="hj-end-copy">
              <h2 id="hj-finale-title" tabIndex={-1}>
                {END.line}
              </h2>
              <div className="hj-actions">
                <Button asChild size="lg">
                  <Link href={END.primary.href}>{END.primary.label}</Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href={END.secondary.href}>{END.secondary.label}</Link>
                </Button>
              </div>
            </div>
            <HomeInquiry email={person.bookingEmail} />
          </div>
        </section>
      </div>
    </Shell>
  );
}
