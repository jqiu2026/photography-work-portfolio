import type { Metadata } from "next";
import { LearningNotice } from "@/components/LearningNotice";
import { PageHeader } from "@/components/PageHeader";
import { DensityTool } from "@/components/tools/DensityTool";

export const metadata: Metadata = {
  title: "Density altitude",
  description: "Pressure altitude, standard temperature and density altitude.",
};

export default function Page() {
  return (
    <div>
      <PageHeader
        eyebrow="Tools"
        title="Density altitude"
        intro="Pressure altitude, standard temperature and density altitude."
      />
      <div className="fl-wrap fl-section">
        <LearningNotice />
        <DensityTool />
      </div>
    </div>
  );
}
