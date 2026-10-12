import { MockBanner } from "@jerryqiu/sites/mock";
import type { ReactNode } from "react";
import { InterestShell } from "@/components/interest/InterestShell";
import "./score.css";

/** Typographic-score page frame (compositions and the score store). Always labelled MOCK until Phase 3. */
export function ScoreShell({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <InterestShell id="music">
      <MockBanner what="The score store is a local mock with sample compositions" />
      <div className="sc-wrap">
        <p className="sc-eyebrow">{eyebrow}</p>
        <h1 className="sc-title">{title}</h1>
        <div className="sc-staff" aria-hidden="true" />
        {children}
      </div>
    </InterestShell>
  );
}
