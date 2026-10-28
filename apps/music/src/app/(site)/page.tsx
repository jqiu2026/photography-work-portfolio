import { Button, EmptyState } from "@/components/ui";
import Link from "next/link";
import { PieceCard } from "@/components/PieceCard";
import { NewsletterForm } from "@/components/NewsletterForm";
import { StoryIntro } from "@jerryqiu/sites/intro";
import { getCatalog } from "@/lib/data";
import { getImage, srcSet } from "@/lib/images";
import { getMusicContent } from "@/lib/interests";

export default async function MusicHome() {
  const [music, catalog] = await Promise.all([getMusicContent(), getCatalog("{}")]);
  const img = getImage("gallery", "jry0473");
  const featured = catalog
    .filter((c) => c.featured)
    .concat(catalog.filter((c) => !c.featured))
    .slice(0, 4);
  // TODO(owner): rewrite these lines in your voice. They only name what the site holds.
  const intro = [
    { name: "Music", title: "Things I wrote, and sometimes played.", scene: "waves" as const },
    {
      name: "Compositions",
      title: "Every piece, in one catalog.",
      scene: "staff" as const,
      image: { src: img.files[1]?.src ?? img.files[0].src, srcSet: srcSet(img), alt: "", color: img.color },
    },
    { name: "Scores", title: "Scores to play.", line: "Sheet music, ready for your stand.", scene: "bars" as const },
    { name: "Listen", title: "Recordings and performances.", scene: "rings" as const },
    { name: "Commission", title: "Something new, written for you.", scene: "waves" as const },
  ];
  return (
    <div>
      <StoryIntro site="Music" accent="#ffb340" chapters={intro} />
      <div className="mu-wrap">
        <section className="mu-hero" aria-labelledby="h">
          <div>
            <p className="hm-eyebrow">Jerry Qiu</p>
            <h1 id="h" className="hm-iridescent-text">
              Music
            </h1>
            {music.intro ? <p className="mu-hero__lede">{music.intro}</p> : null}
            {/* TODO(owner): rewrite in your voice. */}
            <p className="mu-hero__lede">Things I wrote, and sometimes played.</p>
            <div className="mu-actions">
              <Button asChild>
                <Link href="/compositions">Browse compositions</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/scores">Scores to play</Link>
              </Button>
            </div>
          </div>
          <figure className="mu-photo">
            <img
              src={img.files[1]?.src ?? img.files[0].src}
              srcSet={srcSet(img)}
              sizes="(min-width: 860px) 40vw, 100vw"
              width={img.width}
              height={img.height}
              alt="A trombonist performing in a haze of colored stage light."
              style={{ backgroundColor: img.color }}
            />
          </figure>
        </section>

        <section className="mu-section" aria-labelledby="pieces">
          <h2 id="pieces" className="mu-h2">
            Pieces
          </h2>
          {featured.length ? (
            <div className="mu-grid">
              {featured.map((c) => (
                <PieceCard key={c.id} e={c} />
              ))}
            </div>
          ) : (
            <EmptyState>The catalog is being put together. Check back soon.</EmptyState>
          )}
        </section>

        {music.performances.length ? (
          <section className="mu-section" aria-labelledby="perf">
            <h2 id="perf" className="mu-h2">
              Where I've played
            </h2>
            <ul className="mu-list">
              {music.performances.slice(0, 5).map((p) => (
                <li key={`${p.title}-${p.date}`}>
                  <span>{p.title}</span>
                  <span className="mu-muted">{[p.date, p.venue].filter(Boolean).join(" · ")}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mu-section" aria-labelledby="news">
          <h2 id="news" className="mu-h2">
            New pieces, in your inbox
          </h2>
          <p className="mu-muted">A short note when something is published. No more than once a month.</p>
          <NewsletterForm />
        </section>
      </div>
    </div>
  );
}
