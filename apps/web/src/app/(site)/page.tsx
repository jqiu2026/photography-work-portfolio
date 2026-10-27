import { getMakeUrl, getSite } from "@jerryqiu/sites";
import type { Metadata } from "next";
import NextLink from "next/link";
import { Nexus } from "@/components/home/Nexus";
import type { RealmLink } from "@/components/home/nexus/realms";
import { Button } from "@/components/site/ui";
import { getWriting } from "@/lib/content";
import { getImage, srcSet } from "@/lib/images";
import { getPerson } from "@/lib/profile";

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
  const hubUrl = getSite("hub").url;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.name,
    url: hubUrl,
    jobTitle: "Photographer",
    sameAs: socials.filter((s) => s.href.startsWith("http")).map((s) => s.href),
  };
  // TODO(owner): rewrite these lines in your voice.
  const realms: RealmLink[] = [
    { key: "exposure", site: "Photography", href: getSite("photos").url, line: "Pictures of people at work." },
    { key: "resonance", site: "Music", href: getSite("music").url, line: "Things I wrote, and sometimes played." },
    { key: "altitude", site: "Flying", href: getSite("flying").url, line: "Where I've been, from above." },
    { key: "forge", site: "Make", href: getMakeUrl(), line: "Things I build, and what I learned." },
  ];
  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <div className="hb-wrap">
        <Nexus realms={realms}>
          <section className="hb-hero" aria-labelledby="h">
            <p className="hm-eyebrow">The Nexus · {person.location}</p>
            <h1 id="h" className="hm-iridescent-text">
              {person.name}.
            </h1>
            <p className="hb-roles">
              {roles.map((r, i) => (
                <span key={r}>
                  {r}
                  {i < roles.length - 1 ? <i aria-hidden> · </i> : null}
                </span>
              ))}
              <span className="hb-sr"> in {person.location}</span>
            </p>
            {/* TODO(owner): rewrite in your voice. */}
            <p className="hb-lede">I take photographs, build websites, fly drones and make music. I'm in New York.</p>
            <div className="hb-row">
              <Button asChild>
                <NextLink href="/writing">Read my writing</NextLink>
              </Button>
              <Button asChild variant="secondary">
                <NextLink href="/connect">Get in touch</NextLink>
              </Button>
            </div>
          </section>
        </Nexus>

        <section className="hb-section" aria-labelledby="proof">
          <h2 id="proof" className="hb-h2">
            A few of the things I've shot.
          </h2>
          <ul className="hb-strip">
            {proof.map((p) => {
              const img = getImage("gallery", p.id);
              return (
                <li key={p.id}>
                  <figure>
                    <img
                      src={img.files[1]?.src ?? img.files[0].src}
                      srcSet={srcSet(img)}
                      sizes="(min-width: 900px) 20vw, 60vw"
                      width={img.width}
                      height={img.height}
                      alt={p.alt}
                      loading="lazy"
                      style={{ backgroundColor: img.color }}
                    />
                    <figcaption>{p.caption}</figcaption>
                  </figure>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="hb-section" aria-labelledby="what">
          <h2 id="what" className="hb-h2">
            What I do
          </h2>
          <div className="hb-lines">
            {/* TODO(owner): rewrite these four lines in your voice. Facts: original About page. */}
            <p>Photography is how I started, and it is still how I pay attention.</p>
            <p>I fly drones with a Part 107 certificate.</p>
            <p>I built this site.</p>
            <p>I run the StuyAviators Instagram.</p>
          </div>
        </section>

        <section className="hb-section" aria-labelledby="writing">
          <h2 id="writing" className="hb-h2">
            Writing
          </h2>
          {featured ? (
            <NextLink href={`/writing/${featured.slug}`} className="hb-featured">
              {featured.cover ? (
                <img
                  src={featured.cover.files[1]?.src ?? featured.cover.files[0].src}
                  srcSet={srcSet(featured.cover)}
                  sizes="(min-width: 900px) 40vw, 100vw"
                  width={featured.cover.width}
                  height={featured.cover.height}
                  alt=""
                  loading="lazy"
                  style={{ backgroundColor: featured.cover.color }}
                />
              ) : null}
              <span className="hb-stack">
                <time dateTime={featured.date} className="hb-mono">
                  {fmt(featured.date)}
                </time>
                <strong style={{ fontSize: "var(--hm-text-2xl)", fontWeight: 500 }}>{featured.title}</strong>
                {featured.summary ? <span className="hb-muted">{featured.summary}</span> : null}
              </span>
            </NextLink>
          ) : null}
          {rest.map((p) => (
            <NextLink key={p.slug} href={`/writing/${p.slug}`} className="hb-post">
              <strong>{p.title}</strong>
              <time dateTime={p.date} className="hb-mono">
                {fmt(p.date)}
              </time>
            </NextLink>
          ))}
          <p>
            <NextLink className="hb-link" href="/writing">
              All writing
            </NextLink>
          </p>
        </section>

        <section className="hb-section" aria-labelledby="hello">
          <h2 id="hello" className="hb-h2">
            Say hello.
          </h2>
          {/* TODO(owner): rewrite in your voice. */}
          <p className="hb-lede">If something here made you curious, tell me. I read everything.</p>
          <div className="hb-row">
            <Button asChild>
              <NextLink href="/connect">Get in touch</NextLink>
            </Button>
            <Button asChild variant="ghost">
              <a href={`mailto:${person.email}`}>{person.email}</a>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
