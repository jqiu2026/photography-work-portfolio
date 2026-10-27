import type { Metadata } from "next";
import { LearningNotice } from "@/components/LearningNotice";
import { PageHeader } from "@/components/PageHeader";
import { WeatherTool } from "@/components/tools/WeatherTool";

export const metadata: Metadata = {
  title: "Weather decoder",
  description: "A METAR or TAF in plain words, with the flight category.",
};

export default function Page() {
  return (
    <div>
      <PageHeader
        eyebrow="Tools"
        title="Weather decoder"
        intro="A METAR or TAF in plain words, with the flight category."
      />
      <div className="fl-wrap fl-section">
        <LearningNotice />
        <WeatherTool />
      </div>
    </div>
  );
}
