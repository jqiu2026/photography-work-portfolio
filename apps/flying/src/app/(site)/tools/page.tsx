import type { Metadata } from "next";
import Link from "next/link";
import { LearningNotice } from "@/components/LearningNotice";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Tools",
  description: "Small flying calculators and a weather decoder, built to learn.",
};

const TOOLS = [
  [
    "Crosswind",
    "/tools/crosswind",
    "Type the runway and the wind: headwind, crosswind and which side it comes from, in the gusts too.",
  ],
  [
    "Density altitude",
    "/tools/density-altitude",
    "From the elevation, the altimeter setting and the temperature: pressure altitude, standard temperature and density altitude.",
  ],
  [
    "Weather decoder",
    "/tools/weather",
    "Paste a METAR or TAF, or look one up, and read it in plain words with the flight category.",
  ],
  [
    "Trip estimate",
    "/tools/trip",
    "Legs, a wind and your numbers: heading, ground speed, time, and the fuel with a reserve.",
  ],
  [
    "Weight and balance",
    "/tools/weight-balance",
    "List the load, see the weight and center of gravity against an envelope you enter.",
  ],
] as const;

export default function Tools() {
  return (
    <div>
      <PageHeader
        eyebrow="Flying"
        title="Tools"
        intro="Small calculators I wrote while learning, each one showing its working. Every result is only as good as the numbers you type in."
      />
      <div className="fl-wrap fl-section">
        <LearningNotice />
        <div className="fl-cards">
          {TOOLS.map(([name, href, blurb]) => (
            <Link key={href} href={href} className="fl-card">
              <h2 style={{ margin: 0, fontSize: "var(--hm-text-xl)", fontWeight: 500 }}>{name}</h2>
              <p>{blurb}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
