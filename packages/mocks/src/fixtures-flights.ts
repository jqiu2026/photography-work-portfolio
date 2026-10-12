import type { Airport, FlightSource, RawFlight } from "./flights";
import { publishable } from "./flights";

/** Real airport coordinates (public facts). The flights themselves are SAMPLE data (Q35): nothing here is a real flight. */
export const airports: Airport[] = [
  { code: "KJFK", name: "New York JFK", lat: 40.6413, lon: -73.7781 },
  { code: "KLGA", name: "New York LaGuardia", lat: 40.7769, lon: -73.874 },
  { code: "KBOS", name: "Boston Logan", lat: 42.3656, lon: -71.0096 },
  { code: "KPHL", name: "Philadelphia", lat: 39.8744, lon: -75.2424 },
  { code: "KDCA", name: "Washington Reagan", lat: 38.8512, lon: -77.0402 },
  { code: "KORD", name: "Chicago O'Hare", lat: 41.9742, lon: -87.9073 },
  { code: "KMCO", name: "Orlando", lat: 28.4312, lon: -81.3081 },
  { code: "KSFO", name: "San Francisco", lat: 37.6213, lon: -122.379 },
];

/** Landed dates are relative to "now" so the 7-day publishing delay is always demonstrable. */
const day = (n: number, now: Date) => new Date(now.getTime() - n * 86_400_000);
const ym = (d: Date) => d.toISOString().slice(0, 7);

export function sampleRaw(now = new Date()): RawFlight[] {
  const mk = (id: string, from: string, to: string, ago: number, aircraft: string, note: string): RawFlight => ({
    id, from, to, aircraft, note, sample: true, landedAt: day(ago, now).toISOString(), month: ym(day(ago, now)),
    tailNumber: "N000SAMPLE", // present on purpose in the raw record to prove it never reaches the public type
  });
  return [
    mk("f1", "KJFK", "KBOS", 400, "Airliner (sample)", "SAMPLE: a short hop north."),
    mk("f2", "KJFK", "KORD", 320, "Airliner (sample)", "SAMPLE: west for a week."),
    mk("f3", "KORD", "KSFO", 310, "Airliner (sample)", "SAMPLE: the long way across."),
    mk("f4", "KSFO", "KJFK", 296, "Airliner (sample)", "SAMPLE: home."),
    mk("f5", "KLGA", "KMCO", 150, "Airliner (sample)", "SAMPLE: south for the winter break."),
    mk("f6", "KMCO", "KDCA", 142, "Airliner (sample)", "SAMPLE: back up the coast."),
    mk("f7", "KDCA", "KPHL", 40, "Light aircraft (sample)", "SAMPLE: a short training leg."),
    mk("f8", "KPHL", "KJFK", 3, "Light aircraft (sample)", "SAMPLE: landed 3 days ago, so it is held back for now."),
  ];
}

export class MockFlightSource implements FlightSource {
  async airports() {
    return airports;
  }
  async flights(now = new Date()) {
    return publishable(sampleRaw(now), now);
  }
}
