import { compositions, hasScore, mocksEnabled, usd } from "@jerryqiu/mocks";
import { sitePath } from "@jerryqiu/sites";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ScoreShell } from "@/components/music/ScoreShell";

export const metadata = { title: "Scores" };

export default function Scores() {
  if (!mocksEnabled()) notFound();
  return (
    <ScoreShell eyebrow="Music" title="Scores">
      <p className="sc-note">
        Preview a score, then buy it. Listening is separate: a recording may or may not exist for a piece.
      </p>
      <ol className="sc-list">
        {compositions.filter(hasScore).map((c) => (
          <li key={c.slug}>
            <div>
              <h2>
                <Link href={sitePath("music", `/scores/${c.slug}`)}>{c.title}</Link>
              </h2>
              <p className="sc-meta">
                {c.forces} · {c.score!.pages} pages
              </p>
            </div>
            <div className="sc-tags">
              <span>{usd(c.score!.priceCents)}</span>
            </div>
          </li>
        ))}
      </ol>
      <p style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
        <Link className="sc-btn sc-btn--ghost" href={sitePath("music", "/scores/cart")}>
          Cart
        </Link>
        <Link className="sc-btn sc-btn--ghost" href={sitePath("music", "/scores/library")}>
          Library
        </Link>
      </p>
    </ScoreShell>
  );
}
