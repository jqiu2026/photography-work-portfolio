import Link from "next/link";
import { Tag } from "@/components/ui";
import { LEVEL, duration, usd } from "@/lib/format";

type Entry = {
  slug: string;
  title: string;
  year: number | null;
  forces: string | null;
  summary: string | null;
  durationSec: number | null;
  difficulty: string | null;
  fromCents: number | null;
  forSale: boolean;
  recordingCount: number;
};

export function PieceCard({ e }: { e: Entry }) {
  const meta = [e.year, duration(e.durationSec), e.difficulty ? LEVEL[e.difficulty] : ""].filter(Boolean).join(" · ");
  return (
    <Link href={`/compositions/${e.slug}`} className="mu-card">
      <h3>{e.title}</h3>
      {e.forces ? <p>{e.forces}</p> : null}
      {meta ? <p className="mu-mono">{meta}</p> : null}
      {e.summary ? <p>{e.summary}</p> : null}
      <span className="mu-tags">
        {e.recordingCount ? <Tag tone="accent">Recording</Tag> : null}
        {e.forSale && e.fromCents !== null ? <Tag>Score from {usd(e.fromCents)}</Tag> : null}
      </span>
    </Link>
  );
}
