"use server";

import * as fl from "@jerryqiu/db/flying";
import { StudioError } from "@jerryqiu/db/studio";
import { z } from "zod";
import { type StudioResult, studio } from "@/lib/studio-run";

const id = z.string().uuid();
const str = (f: FormData, k: string) => {
  const v = f.get(k);
  return typeof v === "string" ? v.trim() : "";
};
const uuid = (v: string, what: string) => {
  const p = id.safeParse(v);
  if (!p.success) throw new StudioError(`Unknown ${what}.`);
  return p.data;
};
const coord = (f: FormData, k: string) => {
  const v = str(f, k);
  const n = Number(v);
  if (v === "" || !Number.isFinite(n))
    throw new StudioError("Latitude and longitude are numbers like 42.3656 and -71.0096.");
  return n;
};

export async function saveAirportAction(form: FormData): Promise<StudioResult> {
  return studio(async ({ db }) => {
    const aid = str(form, "id") ? uuid(str(form, "id"), "airport") : undefined;
    const a = await fl.saveAirport(
      db,
      { code: str(form, "code"), name: str(form, "name"), lat: coord(form, "lat"), lon: coord(form, "lon") },
      aid,
    );
    return {
      message: aid ? "Saved." : "Airport added.",
      audit: { action: "flying.airport.save", entity: "flying_airport", entityId: a.id, summary: `Saved ${a.code}` },
    };
  });
}

export async function removeAirportAction(form: FormData): Promise<StudioResult> {
  return studio(async ({ db }) => {
    await fl.removeAirport(db, uuid(str(form, "id"), "airport"));
    return {
      message: "Removed.",
      audit: {
        action: "flying.airport.remove",
        entity: "flying_airport",
        entityId: str(form, "id"),
        summary: "Removed an airport",
      },
    };
  });
}

export async function saveFlightAction(form: FormData): Promise<StudioResult> {
  return studio(async ({ db }) => {
    const fid = str(form, "id") ? uuid(str(form, "id"), "flight") : undefined;
    const f = await fl.saveFlight(
      db,
      {
        fromCode: str(form, "from"),
        toCode: str(form, "to"),
        landedOn: str(form, "landedOn"),
        aircraftType: str(form, "aircraft") || null,
        note: str(form, "note") || null,
        visible: form.get("visible") === "on",
      },
      fid,
    );
    return {
      message: fid ? "Saved." : "Flight added. It shows on the site a week after the day it landed, by month.",
      audit: {
        action: "flying.flight.save",
        entity: "flying_flight",
        entityId: f.id,
        summary: `Saved ${f.fromCode} to ${f.toCode}`,
      },
    };
  });
}

export async function removeFlightAction(form: FormData): Promise<StudioResult> {
  return studio(async ({ db }) => {
    await fl.removeFlight(db, uuid(str(form, "id"), "flight"));
    return {
      message: "Removed.",
      audit: {
        action: "flying.flight.remove",
        entity: "flying_flight",
        entityId: str(form, "id"),
        summary: "Removed a flight",
      },
    };
  });
}
