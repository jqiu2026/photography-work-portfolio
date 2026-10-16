import { mocksEnabled } from "@jerryqiu/mocks";
import { notFound } from "next/navigation";
import { Library } from "@/components/music/ScoreParts";
import { ScoreShell } from "@/components/music/ScoreShell";

export const metadata = { title: "Library" };

export default function Page() {
  if (!mocksEnabled()) notFound();
  return (
    <ScoreShell eyebrow="Scores" title="Library">
      <Library />
    </ScoreShell>
  );
}
