import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, describe, expect, it } from "vitest";
import type { Database } from "../src/client";
import * as fl from "../src/flying";
import * as schema from "../src/schema";

const here = path.dirname(fileURLToPath(import.meta.url));
let db: Database;
const now = new Date("2026-10-27T12:00:00Z");

beforeAll(async () => {
  const d = drizzle(await PGlite.create(), { schema, casing: "snake_case" });
  await migrate(d, { migrationsFolder: path.join(here, "../drizzle") });
  db = d as unknown as Database;
  await fl.saveAirport(db, { code: "kbos", name: "Boston Logan", lat: 42.3656, lon: -71.0096 });
  await fl.saveAirport(db, { code: "KJFK", name: "New York JFK", lat: 40.6413, lon: -73.7781 });
});

describe("airports", () => {
  it("codes are upper-cased, unique and checked", async () => {
    expect((await fl.listAirports(db)).map((a) => a.code)).toEqual(["KBOS", "KJFK"]);
    await expect(fl.saveAirport(db, { code: "KBOS", name: "Again", lat: 1, lon: 1 })).rejects.toThrow(/already/);
    await expect(fl.saveAirport(db, { code: "K", name: "x", lat: 1, lon: 1 })).rejects.toThrow();
    await expect(fl.saveAirport(db, { code: "KXXX", name: "x", lat: 91, lon: 1 })).rejects.toThrow();
  });
});

describe("flights", () => {
  it("need known airports and a valid day", async () => {
    await expect(fl.saveFlight(db, { fromCode: "KBOS", toCode: "KZZZ", landedOn: "2026-09-01" })).rejects.toThrow(
      /Add airport KZZZ/,
    );
    await expect(fl.saveFlight(db, { fromCode: "KBOS", toCode: "KJFK", landedOn: "2026-02-31" })).rejects.toThrow(
      /not valid/,
    );
  });
  it("never store a registration", async () => {
    await expect(
      fl.saveFlight(db, { fromCode: "KBOS", toCode: "KJFK", landedOn: "2026-09-01", aircraftType: "N123AB" }),
    ).rejects.toThrow(/registration/);
    await expect(
      fl.saveFlight(db, { fromCode: "KBOS", toCode: "KJFK", landedOn: "2026-09-01", note: "flew G-ABCD today" }),
    ).rejects.toThrow(/registration/);
  });
  it("the public list holds back recent flights, rounds to the month and carries no day or registration", async () => {
    await fl.saveFlight(db, {
      fromCode: "KBOS",
      toCode: "KJFK",
      landedOn: "2026-09-12",
      aircraftType: "Cessna 172",
      note: "Bumpy",
    });
    await fl.saveFlight(db, { fromCode: "KJFK", toCode: "KBOS", landedOn: "2026-10-24" });
    const { flights, airports } = await fl.publicFlights(db, now);
    expect(flights).toHaveLength(1);
    expect(flights[0]).toMatchObject({ from: "KBOS", to: "KJFK", month: "2026-09", aircraft: "Cessna 172" });
    expect(JSON.stringify(flights)).not.toContain("2026-09-12");
    expect(airports.map((a) => a.code).sort()).toEqual(["KBOS", "KJFK"]);
    // a week later the recent one appears
    expect((await fl.publicFlights(db, new Date("2026-11-02T12:00:00Z"))).flights).toHaveLength(2);
  });
  it("a hidden or removed flight never shows", async () => {
    const f = await fl.saveFlight(db, { fromCode: "KBOS", toCode: "KBOS", landedOn: "2026-08-01", visible: false });
    expect((await fl.publicFlights(db, now)).flights.some((x) => x.id === f.id)).toBe(false);
    const g = await fl.saveFlight(db, { fromCode: "KBOS", toCode: "KBOS", landedOn: "2026-08-02" });
    await fl.removeFlight(db, g.id);
    expect((await fl.publicFlights(db, now)).flights.some((x) => x.id === g.id)).toBe(false);
  });
  it("an airport in use cannot be removed", async () => {
    const [kbos] = await fl.listAirports(db);
    await expect(fl.removeAirport(db, kbos.id)).rejects.toThrow(/uses this airport/);
  });
});
