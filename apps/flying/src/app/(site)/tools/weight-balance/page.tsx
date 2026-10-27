import type { Metadata } from "next";
import { LearningNotice } from "@/components/LearningNotice";
import { PageHeader } from "@/components/PageHeader";
import { WeightBalanceTool } from "@/components/tools/WeightBalanceTool";

export const metadata: Metadata = {
  title: "Weight and balance",
  description: "Total weight and center of gravity against an envelope you enter.",
};

export default function Page() {
  return (
    <div>
      <PageHeader
        eyebrow="Tools"
        title="Weight and balance"
        intro="Total weight and center of gravity against an envelope you enter."
      />
      <div className="fl-wrap fl-section">
        <LearningNotice />
        <WeightBalanceTool />
      </div>
    </div>
  );
}
