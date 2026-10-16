import { MockFlightSource, mocksEnabled } from "@jerryqiu/mocks";
import { MockBanner } from "@jerryqiu/sites/mock";
import { notFound } from "next/navigation";
import { FlightMap } from "@/components/flying/FlightMap";
import "@/components/flying/flying.css";
import { InterestShell } from "@/components/interest/InterestShell";
import { PageHeader } from "@/components/site/PageHeader";

export const metadata = { title: "Map" };
export const dynamic = "force-dynamic";

export default async function MapPage() {
  if (!mocksEnabled()) notFound();
  const src = new MockFlightSource();
  const [airports, flights] = await Promise.all([src.airports(), src.flights()]);
  return (
    <InterestShell id="flying">
      <MockBanner what="The flight map shows SAMPLE flights, not mine" />
      <PageHeader
        eyebrow="Flying"
        title="Where I've been"
        intro="Past flights only, at airport level, shown a little late on purpose. Never live."
      />
      <div
        style={{
          width: "min(100% - 2 * var(--hl-gutter), var(--hl-container-lg))",
          marginInline: "auto",
          paddingBottom: "6rem",
        }}
      >
        <FlightMap airports={airports} flights={flights} />
      </div>
    </InterestShell>
  );
}
