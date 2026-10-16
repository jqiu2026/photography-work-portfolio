import { mocksEnabled } from "@jerryqiu/mocks";
import { notFound } from "next/navigation";
import { Checkout } from "@/components/music/ScoreParts";
import { ScoreShell } from "@/components/music/ScoreShell";

export const metadata = { title: "Checkout" };

export default function Page() {
  if (!mocksEnabled()) notFound();
  return (
    <ScoreShell eyebrow="Scores" title="Checkout">
      <Checkout />
    </ScoreShell>
  );
}
