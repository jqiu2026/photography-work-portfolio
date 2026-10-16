import { compositions, hasListen, hasScore, mocksEnabled, usd } from "@jerryqiu/mocks";
import { sitePath } from "@jerryqiu/sites";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ScoreShell } from "@/components/music/ScoreShell";

export const metadata = { title: "Compositions" };

export default function Compositions() {
  if (!mocksEnabled()) notFound();
  return (
    <ScoreShell eyebrow="Music" title="Compositions">
      <ol className="sc-list">
        {compositions.map((c) => (
          <li key={c.slug}>
            <div>
              <h2>
                <Link href={sitePath("music", `/compositions/${c.slug}`)}>{c.title}</Link>
              </h2>
              <p className="sc-meta">
                {c.forces} · {c.year} · {c.durationMin} min
              </p>
            </div>
            <div className="sc-tags">
              {hasListen(c) ? <span>listen</span> : null}
              {hasScore(c) ? <span>score {usd(c.score!.priceCents)}</span> : null}
            </div>
          </li>
        ))}
      </ol>
    </ScoreShell>
  );
}
