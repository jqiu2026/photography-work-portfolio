import { Image } from "@halation/ui/media";
import { Condense, Scene, Settle, StageProvider, Streak, Threshold } from "@halation/ui/stage";
import { getSite } from "@jerryqiu/sites";
import type { Metadata } from "next";
import NextLink from "next/link";
import { Footer } from "@/components/site/HubFooter";
import { HubIndex } from "@/components/site/HubIndex";
import "@/components/home/home.css";
import { getImage } from "@/lib/images";
import { getPerson } from "@/lib/profile";
import { getWriting } from "@/lib/content";

export const metadata: Metadata = {
  title: { absolute: "Jerry Qiu" },
  description: "Jerry Qiu: photographer, builder, drone pilot and musician in New York.",
};

const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

// Real photographs from the portfolio. Captions use only what the file names state (event and month).
const proof = [
  {
    id: "10-19-2025-maker-faire-coney-island-2025-129-1",
    caption: "Maker Faire, Coney Island · Oct 2025",
    alt: "A scene from Maker Faire at Coney Island.",
  },
  { id: "2026-01-17-snow-7", caption: "Snow · Jan 2026", alt: "A snowy New York street." },
  { id: "jetblue-a220-300-1", caption: "A220-300 on approach", alt: "A JetBlue Airbus A220-300 in flight." },
  {
    id: "2026-03-25-stuyopenhouse-20",
    caption: "Open House · Mar 2026",
    alt: "A moment from the Stuyvesant Open House.",
  },
  {
    id: "jry0126-enhanced-nr",
    caption: "Behind the camera",
    alt: "A person standing next to a video camera on a tripod.",
  },
] as const;

const roles = ["photographer", "builder", "drone pilot", "musician"];

export default async function Home() {
  const { person, socials } = await getPerson();
  const writing = await getWriting();
  const [featured, ...rest] = writing;
  const photos = getSite("photos");
  const music = getSite("music");
  const flying = getSite("flying");
  const hubUrl = getSite("hub").url;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.name,
    url: hubUrl,
    jobTitle: "Photographer",
    sameAs: socials.filter((s) => s.href.startsWith("http")).map((s) => s.href),
  };
  const worlds = [
    {
      site: photos,
      accent: "red" as const,
      title: "Photography",
      // TODO(owner): rewrite in your voice.
      text: "Pictures of people at work.",
      img: getImage("gallery", "jry0022-enhanced-nr"),
      alt: "",
    },
    {
      site: music,
      accent: "amber" as const,
      title: "Music",
      text: "Things I wrote, and sometimes played.",
      img: getImage("gallery", "jry0473"),
      alt: "",
    },
    {
      site: flying,
      accent: "green" as const,
      title: "Flying",
      text: "Where I've been, from above.",
      img: getImage("blogs", "day-one-cover"),
      alt: "",
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <StageProvider world="hub">
        <a className="hl-skip" href="#main">
          Skip to content
        </a>
        <HubIndex
          routes={[
            { label: "Writing", href: "/writing" },
            { label: "About", href: "/about" },
            { label: "Connect", href: "/connect" },
          ]}
        />
        <main id="main" className="home">
          <Scene id="start" label="Jerry Qiu" className="home-ignition" as="header">
            <div className="home-wrap">
              <p className="hl-eyebrow">{person.location}</p>
              <Streak as="h1" text={`${person.name}.`} className="home-name" />
              <Settle as="p" className="home-roles" when="load">
                {roles.map((r, i) => (
                  <span key={r}>
                    {r}
                    {i < roles.length - 1 ? <i aria-hidden> · </i> : null}
                  </span>
                ))}
                <span className="hl-sr-only"> in {person.location}</span>
              </Settle>
              {/* TODO(owner): rewrite in your voice. */}
              <Settle as="p" className="home-lede" when="load">
                I take photographs, build websites, fly drones and make music. I'm in New York.
              </Settle>
              <p className="home-cue" aria-hidden>
                Scroll
              </p>
            </div>
          </Scene>

          <Scene id="proof" label="Proof" className="home-proof">
            <div className="home-wrap">
              <Condense text="A few of the things I've shot." className="home-h2" />
              <ul className="home-planes">
                {proof.map((p, i) => (
                  <li key={p.id} style={{ ["--i" as string]: i } as React.CSSProperties}>
                    <figure>
                      <Image asset={getImage("gallery", p.id)} alt={p.alt} sizes="(min-width: 900px) 30vw, 70vw" />
                      <figcaption className="hl-eyebrow">{p.caption}</figcaption>
                    </figure>
                  </li>
                ))}
              </ul>
            </div>
          </Scene>

          <Scene id="what" label="What I do" className="home-what" pin={2.4}>
            <div className="home-wrap home-steps">
              {/* TODO(owner): rewrite these four lines in your voice. Facts: original About page. */}
              <p style={{ ["--c" as string]: 0.28 } as React.CSSProperties}>
                Photography is how I started, and it is still how I pay attention.
              </p>
              <p style={{ ["--c" as string]: 0.42 } as React.CSSProperties}>
                I fly drones with a Part 107 certificate.
              </p>
              <p style={{ ["--c" as string]: 0.56 } as React.CSSProperties}>I built this site.</p>
              <p style={{ ["--c" as string]: 0.7 } as React.CSSProperties}>I run the StuyAviators Instagram.</p>
            </div>
          </Scene>

          <Scene id="rooms" label="Three rooms" className="home-rooms">
            <div className="home-wrap">
              <Condense text="Three rooms. Knock on any." className="home-h2" />
              <div className="home-doors">
                {worlds.map((w) => (
                  <Threshold
                    key={w.title}
                    href={w.site.url}
                    title={w.title}
                    label={`Enter ${w.title.toLowerCase()}`}
                    accent={w.accent}
                    media={<Image asset={w.img} alt={w.alt} sizes="(min-width: 900px) 28vw, 80vw" fill />}
                  >
                    {w.text}
                  </Threshold>
                ))}
              </div>
            </div>
          </Scene>

          <Scene id="writing" label="Writing" className="home-writing">
            <div className="home-wrap">
              <p className="hl-eyebrow">Writing</p>
              {featured ? (
                <NextLink href={`/writing/${featured.slug}`} className="home-featured">
                  {featured.cover ? (
                    <span className="home-featured__img">
                      <Image asset={featured.cover} alt="" sizes="(min-width: 900px) 50vw, 100vw" />
                    </span>
                  ) : null}
                  <span className="home-featured__text">
                    <time dateTime={featured.date} className="hl-eyebrow">
                      {fmt(featured.date)}
                    </time>
                    <span className="home-featured__title">{featured.title}</span>
                    {featured.summary ? <span className="home-featured__sum">{featured.summary}</span> : null}
                  </span>
                </NextLink>
              ) : null}
              {rest.length ? (
                <ul className="home-list">
                  {rest.map((p) => (
                    <li key={p.slug}>
                      <NextLink href={`/writing/${p.slug}`}>
                        <span>{p.title}</span>
                        <time dateTime={p.date} className="hl-eyebrow">
                          {fmt(p.date)}
                        </time>
                      </NextLink>
                    </li>
                  ))}
                </ul>
              ) : null}
              <NextLink href="/writing" className="home-more">
                All writing →
              </NextLink>
            </div>
          </Scene>

          <Scene id="hello" label="Say hello" className="home-hello">
            <div className="home-wrap">
              <Condense text="Say hello." className="home-hello__title" />
              {/* TODO(owner): rewrite in your voice. */}
              <Settle as="p" className="home-lede">
                If something here made you curious, tell me. I read everything.
              </Settle>
              <div className="home-actions">
                <NextLink href="/connect" className="home-btn">
                  Get in touch
                </NextLink>
                <a href={`mailto:${person.email}`} className="home-btn home-btn--ghost">
                  {person.email}
                </a>
              </div>
            </div>
          </Scene>
        </main>
        <Footer person={person} socials={socials} worlds={worlds.map((w) => ({ label: w.title, href: w.site.url }))} />
      </StageProvider>
    </>
  );
}
