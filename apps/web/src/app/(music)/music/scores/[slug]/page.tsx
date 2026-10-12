import { MockScoreDelivery, bySlug, mocksEnabled, usd } from "@jerryqiu/mocks";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/music/ScoreParts";
import { ScoreShell } from "@/components/music/ScoreShell";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: bySlug(slug)?.title ?? "Score" };
}

export default async function ScorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = bySlug(slug);
  if (!mocksEnabled() || !c?.score) notFound();
  const pages = new MockScoreDelivery().preview(slug);
  return (
    <ScoreShell eyebrow={`${c.forces} · ${c.score.pages} pages · ${c.score.format}`} title={c.title}>
      <p className="sc-price">{usd(c.score.priceCents)}</p>
      <p className="sc-note">{c.score.licence}</p>
      <h2 className="sc-eyebrow" style={{ marginTop: "2rem" }}>
        Preview ({pages.length} of {c.score.pages} pages, watermarked)
      </h2>
      <div className="sc-preview">
        {pages.map((p) => (
          // Previews are generated images, never the file (the real store watermarks and rasterises server-side).
          // biome-ignore lint/performance/noImgElement: generated SVG data URL
          <img
            key={p.n}
            alt={`Preview page ${p.n} of ${c.score!.pages}, watermarked`}
            src={`data:image/svg+xml;utf8,${encodeURIComponent(p.svg)}`}
          />
        ))}
      </div>
      <AddToCart slug={slug} />
    </ScoreShell>
  );
}
