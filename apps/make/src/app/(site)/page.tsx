import { day } from "@/lib/day";
import { PLACES } from "@jerryqiu/db/make";
import Link from "next/link";
import { ProjectCard } from "@/components/ProjectCard";
import { Button, EmptyState } from "@/components/ui";
import { getNow, getProjects } from "@/lib/data";

export default async function MakeHome() {
  const [projects, now] = await Promise.all([getProjects(), getNow()]);
  const bench = projects.filter((p) => p.place === "bench");
  const shelf = projects.filter((p) => p.place === "shelf");
  return (
    <div>
      <div className="mk-wrap">
        <section className="mk-hero" aria-labelledby="h">
          <p className="hm-eyebrow">Jerry Qiu</p>
          <h1 id="h" className="hm-iridescent-text">
            Make
          </h1>
          {/* TODO(owner): rewrite in your voice. */}
          <p>A small showcase of things I build, with write-ups of how they work and what I learned.</p>
          <div className="mk-row">
            <Button asChild>
              <Link href="/projects">See the projects</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/now">What I'm doing now</Link>
            </Button>
          </div>
        </section>

        {projects.length ? (
          <>
            {bench.length ? (
              <section className="mk-place" data-place="bench" aria-labelledby="bench">
                <div className="mk-place__head">
                  <h2 id="bench">{PLACES.bench.word}</h2>
                  <span className="mk-muted">{PLACES.bench.plain}</span>
                </div>
                <div className="mk-grid">
                  {bench.map((p) => (
                    <ProjectCard key={p.id} p={p} />
                  ))}
                </div>
              </section>
            ) : null}
            {shelf.length ? (
              <section className="mk-place" data-place="shelf" aria-labelledby="shelf">
                <div className="mk-place__head">
                  <h2 id="shelf">{PLACES.shelf.word}</h2>
                  <span className="mk-muted">{PLACES.shelf.plain}</span>
                </div>
                <div className="mk-grid">
                  {shelf.map((p) => (
                    <ProjectCard key={p.id} p={p} />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        ) : (
          <section className="mk-section">
            <EmptyState>The projects are being put together. Check back soon.</EmptyState>
          </section>
        )}

        {now.length ? (
          <section className="mk-section" aria-labelledby="now">
            <h2 id="now" className="mk-h2">
              Now
            </h2>
            <ul className="mk-list">
              {now.slice(0, 3).map((n) => (
                <li key={n.id}>
                  <span>{n.body}</span>
                  <span className="mk-mono">{day(n.createdAt)}</span>
                </li>
              ))}
            </ul>
            <p>
              <Link className="mk-link" href="/now">
                Everything I've logged
              </Link>
            </p>
          </section>
        ) : null}
      </div>
    </div>
  );
}
