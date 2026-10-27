import * as mk from "@jerryqiu/db/make";
import Link from "next/link";
import { NoDb, StudioHead } from "@/components/studio/StudioBits";
import { Button, Tag } from "@/components/ui";
import { studioPage } from "@/lib/studio-page";

export const dynamic = "force-dynamic";

export default async function Projects() {
  const { db } = await studioPage();
  if (!db) return <NoDb />;
  const projects = await mk.listAdmin(db);
  return (
    <>
      <StudioHead title="Projects">
        <Button asChild>
          <Link href="/studio/projects/new">New project</Link>
        </Button>
      </StudioHead>
      <section className="st-card">
        {projects.length ? (
          projects.map((p) => (
            <div key={p.id} className="st-rowline">
              <Link className="mk-link" href={`/studio/projects/${p.id}`}>
                {p.title}
              </Link>
              <span className="mk-row">
                <Tag tone={p.published ? "success" : "neutral"}>{p.published ? "published" : "draft"}</Tag>
                <Tag>{mk.PLACES[mk.placeOf(p.status)].word}</Tag>
                {p.unchecked ? <Tag tone="warning">{p.unchecked} to check</Tag> : null}
              </span>
            </div>
          ))
        ) : (
          <p className="mk-muted">No projects yet.</p>
        )}
      </section>
    </>
  );
}
