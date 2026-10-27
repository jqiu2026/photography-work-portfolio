import { type Airport, type Flight, type RawFlight, looksLikeTailNumber, publishable } from "@jerryqiu/aviation";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "./client";
import { StudioError } from "./errors";
import * as s from "./schema";

/**
 * Flying: airports and past flights. The publishing rules are `publishable` in @jerryqiu/aviation (7+ days after landing,
 * month precision, airport level, no live position); this module adds the rule that no registration is ever stored.
 */
export const airportSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{3,4}$/, "Use the 3 or 4 character airport code, like KBOS."),
  name: z.string().trim().min(1).max(120),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
});

export async function saveAirport(db: Database, input: z.input<typeof airportSchema>, id?: string) {
  const v = airportSchema.parse(input);
  const [hit] = await db.select().from(s.flyingAirports).where(eq(s.flyingAirports.code, v.code));
  if (hit && hit.id !== id) throw new StudioError(`${v.code} is already in the list.`);
  if (id) {
    const [a] = await db.update(s.flyingAirports).set(v).where(eq(s.flyingAirports.id, id)).returning();
    if (!a) throw new StudioError("That airport no longer exists.");
    return a;
  }
  const [a] = await db.insert(s.flyingAirports).values(v).returning();
  return a;
}

export const listAirports = (db: Database) => db.select().from(s.flyingAirports).orderBy(asc(s.flyingAirports.code));

export async function removeAirport(db: Database, id: string) {
  const [a] = await db.select().from(s.flyingAirports).where(eq(s.flyingAirports.id, id));
  if (!a) return;
  const used = await db
    .select({ id: s.flyingFlights.id })
    .from(s.flyingFlights)
    .where(and(isNull(s.flyingFlights.deletedAt)));
  if (used.length) {
    const rows = await db.select().from(s.flyingFlights).where(isNull(s.flyingFlights.deletedAt));
    if (rows.some((f) => f.fromCode === a.code || f.toCode === a.code))
      throw new StudioError("A flight uses this airport. Remove those flights first.");
  }
  await db.delete(s.flyingAirports).where(eq(s.flyingAirports.id, id));
}

export const flightSchema = z.object({
  fromCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{3,4}$/),
  toCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{3,4}$/),
  landedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick the day it landed."),
  aircraftType: z.string().trim().max(60).nullable().optional(),
  note: z.string().trim().max(300).nullable().optional(),
  visible: z.boolean().default(true),
});

export async function saveFlight(db: Database, input: z.input<typeof flightSchema>, id?: string) {
  const v = flightSchema.parse(input);
  const d = new Date(`${v.landedOn}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v.landedOn)
    throw new StudioError("That date is not valid.");
  for (const text of [v.aircraftType, v.note])
    if (text && looksLikeTailNumber(text))
      throw new StudioError(
        "That looks like an aircraft registration. Registrations are never published: use the type only, like Cessna 172.",
      );
  const known = new Set((await db.select({ code: s.flyingAirports.code }).from(s.flyingAirports)).map((a) => a.code));
  for (const c of [v.fromCode, v.toCode]) if (!known.has(c)) throw new StudioError(`Add airport ${c} first.`);
  const row = { ...v, aircraftType: v.aircraftType ?? null, note: v.note ?? null };
  if (id) {
    const [f] = await db.update(s.flyingFlights).set(row).where(eq(s.flyingFlights.id, id)).returning();
    if (!f) throw new StudioError("That flight no longer exists.");
    return f;
  }
  const [f] = await db.insert(s.flyingFlights).values(row).returning();
  return f;
}

export async function removeFlight(db: Database, id: string) {
  await db.update(s.flyingFlights).set({ deletedAt: new Date(), visible: false }).where(eq(s.flyingFlights.id, id));
}

export const listFlightsAdmin = (db: Database) =>
  db.select().from(s.flyingFlights).where(isNull(s.flyingFlights.deletedAt)).orderBy(desc(s.flyingFlights.landedOn));

/** What visitors may see: visible flights that passed the 7-day rule, with the airports they use. */
export async function publicFlights(
  db: Database,
  now = new Date(),
): Promise<{ flights: Flight[]; airports: Airport[] }> {
  const rows = await db
    .select()
    .from(s.flyingFlights)
    .where(and(eq(s.flyingFlights.visible, true), isNull(s.flyingFlights.deletedAt)));
  const raw: RawFlight[] = rows.map((r) => ({
    id: r.id,
    from: r.fromCode,
    to: r.toCode,
    month: "",
    landedOn: r.landedOn,
    aircraft: r.aircraftType ?? undefined,
    note: r.note ?? undefined,
  }));
  const flights = publishable(raw, now);
  const codes = new Set(flights.flatMap((f) => [f.from, f.to]));
  const airports = (await listAirports(db))
    .filter((a) => codes.has(a.code))
    .map((a) => ({ code: a.code, name: a.name, lat: a.lat, lon: a.lon }));
  return { flights, airports };
}
