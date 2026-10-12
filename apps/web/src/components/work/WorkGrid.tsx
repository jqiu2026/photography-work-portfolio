import { TiltCard, InView } from "@placeholder/ui/motion";
import { Image } from "@placeholder/ui/media";
import NextLink from "next/link";
import { getImage } from "@/lib/images";
import { projectCover, type Project } from "@/lib/content";

const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "long", year: "numeric" });

export function WorkGrid({ projects }: { projects: Project[] }) {
  return (
    <div className="work-grid">
      {projects.map((p) => {
        const cover = projectCover(p);
        return (
          <InView key={p.slug}>
            <TiltCard max={3}>
              <NextLink href={`/work/${p.slug}`} className="work-card">
                <div className="work-card__media">
                  {cover ? (
                    <Image asset={getImage(cover.group, cover.id)} alt="" sizes="(min-width: 900px) 40vw, 92vw" />
                  ) : (
                    <div className="work-card__empty">{p.metadata.summary}</div>
                  )}
                </div>
                <h2>{p.metadata.title}</h2>
                <p>{[fmt(p.metadata.publishedAt), p.metadata.summary].filter(Boolean).join(" · ")}</p>
              </NextLink>
            </TiltCard>
          </InView>
        );
      })}
    </div>
  );
}
