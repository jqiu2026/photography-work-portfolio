import Link from "next/link";
import { Tag } from "@/components/ui";
import { PLACES, type Place } from "@jerryqiu/db/make";

type Card = {
  slug: string;
  title: string;
  summary: string | null;
  year: number | null;
  stack: string[];
  place: Place;
  cover: { id: string; alt: string; width: number | null; height: number | null } | null;
};

export function ProjectCard({ p }: { p: Card }) {
  return (
    <Link href={`/projects/${p.slug}`} className="mk-card">
      {p.cover ? (
        <figure className="mk-shot">
          <img
            src={`/api/img/${p.cover.id}`}
            alt={p.cover.alt}
            width={p.cover.width ?? undefined}
            height={p.cover.height ?? undefined}
            loading="lazy"
          />
        </figure>
      ) : null}
      <h3>{p.title}</h3>
      {p.summary ? <p>{p.summary}</p> : null}
      <span className="mk-row">
        <Tag tone="accent">{PLACES[p.place].word}</Tag>
        {p.year ? <span className="mk-mono">{p.year}</span> : null}
      </span>
      {p.stack.length ? <span className="mk-mono">{p.stack.slice(0, 5).join(" · ")}</span> : null}
    </Link>
  );
}
