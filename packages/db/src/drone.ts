import { eq } from "drizzle-orm";
import type { Database } from "./client";
import { StudioError } from "./errors";
import * as s from "./schema";

export { DRONE_ITEMS, LIMITS, type Verdict, type Weather, droneVerdict } from "./drone-rules";
import { type Weather, droneVerdict } from "./drone-rules";

export async function getChecklist(db: Database, jobId: string) {
  const [row] = await db
    .select()
    .from(s.studioDroneChecklists)
    .where(eq(s.studioDroneChecklists.jobId, jobId))
    .limit(1);
  return row ?? null;
}

const clean = (v: unknown, lo: number, hi: number, label: string) => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  if (!Number.isFinite(n) || n < lo || n > hi) throw new StudioError(`${label} should be between ${lo} and ${hi}.`);
  return n;
};

export async function saveChecklist(
  db: Database,
  jobId: string,
  input: {
    items: { text: string; done: boolean }[];
    weather: Record<string, unknown>;
    decision?: "go" | "no-go" | null;
  },
) {
  const items = input.items
    .map((i) => ({ text: i.text.trim().slice(0, 200), done: Boolean(i.done) }))
    .filter((i) => i.text)
    .slice(0, 60);
  const weather: Weather = {
    windMph: clean(input.weather.windMph, 0, 120, "Wind"),
    gustMph: clean(input.weather.gustMph, 0, 160, "Gusts"),
    visibilityMi: clean(input.weather.visibilityMi, 0, 50, "Visibility"),
    precipitation: Boolean(input.weather.precipitation),
    note: typeof input.weather.note === "string" ? input.weather.note.trim().slice(0, 300) || undefined : undefined,
  };
  const decision = input.decision ?? null;
  // a "go" is recorded only when every item is done and the weather does not say no-go
  if (decision === "go") {
    if (!items.length || items.some((i) => !i.done))
      throw new StudioError("Finish every checklist item before you call it a go.");
    if (droneVerdict(weather).decision === "no-go")
      throw new StudioError("The weather says no-go, so this cannot be a go.");
  }
  const values = { items, weather, decision, decidedAt: decision ? new Date() : null, updatedAt: new Date() };
  const [row] = await db
    .insert(s.studioDroneChecklists)
    .values({ jobId, ...values })
    .onConflictDoUpdate({ target: s.studioDroneChecklists.jobId, set: values })
    .returning();
  return row;
}
