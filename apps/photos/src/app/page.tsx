import { MailIcon, PhoneIcon } from "@holominimal/ui";
import { Button, EmptyState } from "@holominimal/ui";
import { getSite } from "@jerryqiu/sites";
import { person } from "@jerryqiu/sites/profile";
import type { Metadata } from "next";
import Link from "next/link";
import { HomeStory } from "@/components/home/HomeStory";
import { Shell } from "@/components/Shell";
import { END, pickSlots } from "@/content/home-story";
import { getPublicCatalog } from "@/lib/catalog";
import { getPortfolio } from "@/lib/portfolio";
import "./globals.css";

export const metadata: Metadata = {
  title: { absolute: "Photography · Jerry Qiu" },
  description: "Photography by Jerry Qiu: theater, events, street and aviation, shot mostly around New York.",
};

export default async function Home() {
  const { categories, photosIn, featured, photos } = await getPortfolio();
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
        <section id="finale" className="hj-end" aria-labelledby="hj-finale-title">
          <div className="hj-end-inner">
            <div className="hj-end-copy">
              <h2 id="hj-finale-title" tabIndex={-1}>
                <span className="hm-sr-only">{END.line}</span>
                <span aria-hidden="true">
                  {END.lead} <br />
                  <em className="hj-emph hm-iridescent-text">{END.emph}</em>
                </span>
              </h2>
              <p className="hj-end-lede">{END.lede}</p>
              <p className="hj-end-mail">
                <span>{END.email}</span>
                <Button asChild variant="secondary" size="sm">
                  <a href={`mailto:${person.bookingEmail}`}>
                    <MailIcon /> {person.bookingEmail}
                  </a>
                </Button>
                <Button asChild variant="secondary" size="sm">
                  <a href={person.phoneHref}>
                    <PhoneIcon /> {person.phone}
                  </a>
                </Button>
              </p>
            </div>
            <div className="hj-actions hj-end-cta">
              <Button asChild size="lg">
                <Link href={END.primary.href}>{END.primary.label}</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href={END.secondary.href}>{END.secondary.label}</Link>
              </Button>
            </div>
            <div className="hj-next">
              <h3>{END.next.title}</h3>
              <ol>
                {END.next.steps.map((st) => (
                  <li key={st.n}>
                    <small>{st.n}</small>
                    <b>{st.title}</b>
                    <span>{st.text}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      </div>
    </Shell>
  );
}
