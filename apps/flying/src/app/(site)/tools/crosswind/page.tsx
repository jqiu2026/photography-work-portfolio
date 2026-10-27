import type { Metadata } from "next";
import { LearningNotice } from "@/components/LearningNotice";
import { PageHeader } from "@/components/PageHeader";
import { CrosswindTool } from "@/components/tools/CrosswindTool";

export const metadata: Metadata = {
  title: "Crosswind",
  description: "Headwind and crosswind components for a runway and a wind.",
};

export default function Page() {
  return (
    <div>
      <PageHeader
        eyebrow="Tools"
        title="Crosswind"
        intro="Headwind and crosswind components for a runway and a wind."
      />
      <div className="fl-wrap fl-section">
        <LearningNotice />
        <CrosswindTool />
      </div>
    </div>
  );
}
