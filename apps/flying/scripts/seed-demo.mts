// Development only: real airport coordinates (public facts) and SAMPLE flights so the map and the log have something to show.
// The flights are not real. Refuses to run in production.
import { getDb, schema } from "@jerryqiu/db";
import * as fl from "@jerryqiu/db/flying";
import { sql } from "drizzle-orm";

if (process.env.NODE_ENV === "production") throw new Error("The demo seed never runs in production.");
const db = getDb();
if (!db) throw new Error("No DATABASE_URL: start the local database first (pnpm dev:db).");
const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.flyingAirports);
if (n > 0) {
  console.log(`[flying seed] ${n} airports already exist; nothing to do.`);
  process.exit(0);
}
const airports = [
  ["KJFK", "New York JFK", 40.6413, -73.7781],
  ["KLGA", "New York LaGuardia", 40.7769, -73.874],
  ["KBOS", "Boston Logan", 42.3656, -71.0096],
  ["KPHL", "Philadelphia", 39.8744, -75.2424],
  ["KDCA", "Washington Reagan", 38.8512, -77.0402],
  ["KORD", "Chicago O'Hare", 41.9742, -87.9073],
  ["KSFO", "San Francisco", 37.6213, -122.379],
] as const;
for (const [code, name, lat, lon] of airports) await fl.saveAirport(db, { code, name, lat, lon });
const day = (ago: number) => new Date(Date.now() - ago * 86_400_000).toISOString().slice(0, 10);
const flights = [
  ["KJFK", "KBOS", 400, "Airliner (sample)", "SAMPLE: a short hop north."],
  ["KJFK", "KORD", 320, "Airliner (sample)", "SAMPLE: west for a week."],
  ["KORD", "KSFO", 310, "Airliner (sample)", "SAMPLE: the long way across."],
  ["KSFO", "KJFK", 296, "Airliner (sample)", "SAMPLE: home."],
  ["KDCA", "KPHL", 40, "Light aircraft (sample)", "SAMPLE: a short training leg."],
  ["KPHL", "KJFK", 3, "Light aircraft (sample)", "SAMPLE: landed 3 days ago, so it is held back for now."],
] as const;
for (const [fromCode, toCode, ago, aircraftType, note] of flights)
  await fl.saveFlight(db, { fromCode, toCode, landedOn: day(ago), aircraftType, note });
console.log("[flying seed] added airports and SAMPLE flights.");
process.exit(0);
