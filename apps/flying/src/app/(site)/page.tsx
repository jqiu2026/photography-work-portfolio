import { getSite } from "@jerryqiu/sites";
import Link from "next/link";
import { Button, EmptyState } from "@/components/ui";
import { getPublicFlights } from "@/lib/data";
import { getImage, srcSet } from "@/lib/images";
import { getFlyingContent } from "@/lib/interests";
import { StoryIntro } from "@jerryqiu/sites/intro";

const TOOLS = [
  ["Crosswind", "/tools/crosswind", "Headwind and crosswind for a runway."],
  ["Density altitude", "/tools/density-altitude", "How thin the air really is."],
  ["Weather decoder", "/tools/weather", "A METAR or TAF in plain words."],
  ["Trip estimate", "/tools/trip", "Time and fuel, leg by leg, with a wind."],
  ["Weight and balance", "/tools/weight-balance", "Load it, find the center of gravity."],
] as const;

export default async function FlyingHome() {
  const [flying, { flights }] = await Promise.all([getFlyingContent(), getPublicFlights()]);
  const cockpit = getImage("blogs", "day-one-cover");
  void getSite;
  const plane = getImage("gallery", "jetblue-a220-300-1");
  const pic = (i: typeof plane) => ({
    src: i.files[1]?.src ?? i.files[0].src,
    srcSet: srcSet(i),
    alt: "",
    color: i.color,
  });
  // TODO(owner): rewrite these lines in your voice. They only name what the site holds.
  const intro = [
    { name: "Flying", title: "I'm learning to read the sky.", scene: "horizon" as const },
    { name: "The log", title: "Where I've been, from above.", scene: "route" as const },
    { name: "Tools", title: "Tools I built to learn.", scene: "clouds" as const },
    { name: "Aircraft", title: "On approach.", scene: "clouds" as const, image: pic(plane) },
    { name: "Arrival", title: "Have a look around.", scene: "runway" as const, image: pic(cockpit) },
  ];
  return (
    <div>
      <StoryIntro site="Flying" accent="#6fd8ff" chapters={intro} />
      <div className="fl-wrap">
        <section className="fl-hero" aria-labelledby="h">
          <p className="hm-eyebrow">Jerry Qiu</p>
          <h1 id="h" className="hm-iridescent-text">
            Flying
          </h1>
          {/* TODO(owner): rewrite in your voice. */}
          <p>I'm learning to read the sky.</p>
          <div className="fl-row">
            <Button asChild>
              <Link href="/tools">Learning tools</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/log">The log</Link>
            </Button>
          </div>
        </section>

        <section className="fl-section fl-tool" aria-labelledby="start">
          <figure className="fl-shot">
            <img
              src={cockpit.files[1]?.src ?? cockpit.files[0].src}
              srcSet={srcSet(cockpit)}
              sizes="(min-width: 900px) 46vw, 100vw"
              width={cockpit.width}
              height={cockpit.height}
              alt="The view from a small airplane's cockpit over green countryside and clouds, a pilot in headphones in the foreground."
              style={{ backgroundColor: cockpit.color }}
            />
          </figure>
          <div className="fl-stack">
            <h2 id="start" className="fl-h2">
              Where I've started
            </h2>
            {flying.story ? <p style={{ margin: 0 }}>{flying.story}</p> : null}
            <ul className="fl-list">
              {flying.certificates.map((c) => (
                <li key={c.title}>
                  <strong>{c.title}</strong>
                  <span className="fl-muted">{c.note}</span>
                </li>
              ))}
              <li>
                <strong>{flying.club.name}</strong>
                <span className="fl-muted">
                  {flying.club.note}{" "}
                  <a className="fl-link" href={flying.club.href}>
                    @stuyaviators
                  </a>
                </span>
              </li>
            </ul>
          </div>
        </section>

        <section className="fl-section" aria-labelledby="tools">
          <h2 id="tools" className="fl-h2">
            Tools I built to learn
          </h2>
          <div className="fl-cards">
            {TOOLS.map(([name, href, blurb]) => (
              <Link key={href} href={href} className="fl-card">
                <h3>{name}</h3>
                <p>{blurb}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="fl-section" aria-labelledby="log">
          <h2 id="log" className="fl-h2">
            The log
          </h2>
          {flying.log.length || flights.length ? (
            <ul className="fl-list">
              {flying.log.slice(0, 4).map((e) => (
                <li key={`${e.title}-${e.date}`}>
                  <span>{e.title}</span>
                  <span className="fl-mono">{e.date}</span>
                </li>
              ))}
              {flights.slice(0, 3).map((f) => (
                <li key={f.id}>
                  <span>
                    {f.from} to {f.to}
                    {f.aircraft ? `, ${f.aircraft}` : ""}
                  </span>
                  <span className="fl-mono">{f.month}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState>Nothing logged yet. Entries appear here once I've published them.</EmptyState>
          )}
          <p>
            <Link className="fl-link" href="/log">
              Open the log
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
