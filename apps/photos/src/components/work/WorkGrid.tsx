import { TiltCard, InView } from "@halation/ui/motion";
import { Image } from "@halation/ui/media";
import NextLink from "next/link";
import type { WorkItem } from "@/lib/work";

const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "long", year: "numeric" });

export function WorkGrid({ projects }: { projects: WorkItem[] }) {
  return (
    <div className="work-grid">
      {projects.map((p) => {
        const cover = p.cover;
        return (
          <InView key={p.slug}>
            <TiltCard max={3}>
              <NextLink href={`/work/${p.slug}`} className="work-card">
                <div className="work-card__media">
                  {cover ? (
                    <Image asset={cover} alt="" sizes="(min-width: 900px) 40vw, 92vw" />
                  ) : (
                    <div className="work-card__empty">{p.summary}</div>
                  )}
                </div>
                <h2>{p.title}</h2>
                <p>{[fmt(p.date), p.summary].filter(Boolean).join(" · ")}</p>
              </NextLink>
            </TiltCard>
          </InView>
        );
      })}
    </div>
  );
}
