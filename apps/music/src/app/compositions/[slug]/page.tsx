import { bySlug, mocksEnabled } from "@jerryqiu/mocks";
import { notFound } from "next/navigation";
import { ScoreShell } from "@/components/music/ScoreShell";
import { Paths } from "@/components/music/ScoreParts";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: bySlug(slug)?.title ?? "Composition" };
}

export default async function Composition({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = bySlug(slug);
  if (!mocksEnabled() || !c) notFound();
  return (
    <ScoreShell eyebrow={`${c.forces} · ${c.year} · ${c.durationMin} min`} title={c.title}>
      <Paths c={c} />
    </ScoreShell>
  );
}
