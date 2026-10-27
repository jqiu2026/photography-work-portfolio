import type { Metadata } from "next";
import { LearningNotice } from "@/components/LearningNotice";
import { PageHeader } from "@/components/PageHeader";
import { TripTool } from "@/components/tools/TripTool";

export const metadata: Metadata = {
  title: "Trip estimate",
  description: "Heading, ground speed, time and fuel for each leg, with a wind and a reserve.",
};

export default function Page() {
  return (
    <div>
      <PageHeader
        eyebrow="Tools"
        title="Trip estimate"
        intro="Heading, ground speed, time and fuel for each leg, with a wind and a reserve."
      />
      <div className="fl-wrap fl-section">
        <LearningNotice />
        <TripTool />
      </div>
    </div>
  );
}
