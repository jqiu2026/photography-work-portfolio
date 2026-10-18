import { Reveal } from "@holominimal/ui";
import { ProtectedImage } from "@/components/media";
import NextLink from "next/link";
import type { WorkItem } from "@/lib/work";

const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "long", year: "numeric" });

export function WorkGrid({ projects }: { projects: WorkItem[] }) {
  return (
    <Reveal className="work-grid">
      {projects.map((p, i) => {
        const cover = p.cover;
        return (
          <NextLink
            key={p.slug}
            href={`/work/${p.slug}`}
            className="work-card"
            data-hm-reveal=""
            style={{ "--hm-i": i % 2 } as React.CSSProperties}
          >
            <div className="work-card__media">
              {cover ? (
                <ProtectedImage asset={cover} alt="" sizes="(min-width: 900px) 40vw, 92vw" />
              ) : (
                <div className="work-card__empty">{p.summary}</div>
              )}
            </div>
            <h2>{p.title}</h2>
            <p>{[fmt(p.date), p.summary].filter(Boolean).join(" · ")}</p>
          </NextLink>
        );
      })}
    </Reveal>
  );
}
