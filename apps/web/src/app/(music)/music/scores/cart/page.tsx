import { mocksEnabled } from "@jerryqiu/mocks";
import { notFound } from "next/navigation";
import { CartView } from "@/components/music/ScoreParts";
import { ScoreShell } from "@/components/music/ScoreShell";

export const metadata = { title: "Cart" };

export default function Page() {
  if (!mocksEnabled()) notFound();
  return (
    <ScoreShell eyebrow="Scores" title="Cart">
      <CartView />
    </ScoreShell>
  );
}
