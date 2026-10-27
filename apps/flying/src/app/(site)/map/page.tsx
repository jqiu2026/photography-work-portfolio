import type { Metadata } from "next";
import { FlightMap } from "@/components/FlightMap";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/ui";
import { getPublicFlights } from "@/lib/data";

export const metadata: Metadata = { title: "Map", description: "Where I have flown, shown by month and airport." };

export default async function MapPage() {
  const { flights, airports } = await getPublicFlights();
  return (
    <div>
      <PageHeader
        eyebrow="Flying"
        title="Where I've been"
        intro="Past flights only, at airport level, by month, and published at least a week after landing on purpose. Never live."
      />
      <div className="fl-wrap fl-section">
        {flights.length ? (
          <FlightMap airports={airports} flights={flights} />
        ) : (
          <EmptyState>No flights are published yet.</EmptyState>
        )}
      </div>
    </div>
  );
}
