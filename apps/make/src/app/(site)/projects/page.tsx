import { PLACES, type Place } from "@jerryqiu/db/make";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { ProjectCard } from "@/components/ProjectCard";
import { EmptyState } from "@/components/ui";
import { getProjects } from "@/lib/data";

export const metadata: Metadata = {
  title: "Projects",
  description: "The projects I build, grouped by where they stand.",
};

const ORDER: Place[] = ["bench", "shelf", "scrap"];

export default async function Projects({ searchParams }: { searchParams: Promise<{ place?: string }> }) {
  const sp = await searchParams;
  const only = ORDER.find((p) => p === sp.place);
  const projects = await getProjects();
  const places = only ? [only] : ORDER;
  return (
    <div>
      <PageHeader
        eyebrow="Make"
        title="Projects"
        intro="Grouped by where each one stands. The workshop word comes first, the plain meaning next to it."
      />
      <div className="mk-wrap">
        <nav className="mk-row" aria-label="Show">
          <Link className="mk-link" href="/projects" aria-current={only ? undefined : "page"}>
            All
          </Link>
          {ORDER.map((p) => (
            <Link
              key={p}
              className="mk-link"
              href={`/projects?place=${p}`}
              aria-current={only === p ? "page" : undefined}
            >
              {PLACES[p].word}
            </Link>
          ))}
        </nav>
        {projects.length ? (
          places.map((place) => {
            const list = projects.filter((p) => p.place === place);
            if (!list.length) return null;
            return (
              <section key={place} className="mk-place" data-place={place} aria-labelledby={place}>
                <div className="mk-place__head">
                  <h2 id={place}>{PLACES[place].word}</h2>
                  <span className="mk-muted">{PLACES[place].plain}</span>
                </div>
                <div className="mk-grid">
                  {list.map((p) => (
                    <ProjectCard key={p.id} p={p} />
                  ))}
                </div>
              </section>
            );
          })
        ) : (
          <EmptyState>The projects are being put together. Check back soon.</EmptyState>
        )}
      </div>
    </div>
  );
}
