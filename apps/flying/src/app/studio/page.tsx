import * as fl from "@jerryqiu/db/flying";
import Link from "next/link";
import { NoDb, Stat, StudioHead } from "@/components/studio/StudioBits";
import { Button } from "@/components/ui";
import { studioPage } from "@/lib/studio-page";

export const dynamic = "force-dynamic";

export default async function Overview() {
  const { db } = await studioPage();
  if (!db) return <NoDb />;
  const [flights, airports, pub] = await Promise.all([
    fl.listFlightsAdmin(db),
    fl.listAirports(db),
    fl.publicFlights(db),
  ]);
  return (
    <>
      <StudioHead title="Overview">
        <Button asChild>
          <Link href="/studio/flights">Add a flight</Link>
        </Button>
      </StudioHead>
      <div className="st-stats">
        <Stat label="Flights" value={flights.length} hint={`${pub.flights.length} public now`} />
        <Stat label="Airports" value={airports.length} />
      </div>
      <p className="fl-note">
        What visitors see: airport names, the month, the aircraft type and a note, a week or more after the day it
        landed. Never a registration, a time or a live position. Log entries, aircraft and the background text are
        edited in the hub admin.
      </p>
    </>
  );
}
