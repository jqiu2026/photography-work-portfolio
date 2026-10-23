// Pure (no database or Node imports) so the browser can show the verdict as you type.
/**
 * Drone jobs: a pre-flight checklist per job (the common FAA Part 107 steps) and a go or no-go from the weather you enter.
 * The limits are conservative defaults for a small camera drone, not legal advice; the pilot in command decides.
 * TODO(owner): a live weather source needs an API key, so the weather is typed in for now.
 */
export const DRONE_ITEMS = [
  "Remote pilot certificate with me",
  "Aircraft registered and the registration marked on it",
  "Airspace checked (controlled airspace needs authorization before flying)",
  "No flight restrictions or temporary flight restrictions on the map",
  "Property owner's permission for take-off and landing",
  "Weather checked (wind, gusts, visibility, precipitation)",
  "Batteries charged and spares packed",
  "Propellers, gimbal and camera checked",
  "Firmware and compass calibrated",
  "Visual line of sight kept, with a spotter if needed",
  "Nobody directly under the aircraft; people briefed",
  "Return-home altitude set; emergency plan known",
] as const;

export type Weather = {
  windMph?: number;
  gustMph?: number;
  visibilityMi?: number;
  precipitation?: boolean;
  note?: string;
};
export type Verdict = { decision: "go" | "caution" | "no-go"; reasons: string[] };

/** Limits for a small camera drone: more than 20 mph sustained or 25 mph gusts, under 3 miles of visibility, or rain, is a no-go. */
export const LIMITS = { windMph: 20, gustMph: 25, cautionWindMph: 15, visibilityMi: 3 } as const;

export function droneVerdict(w: Weather): Verdict {
  const no: string[] = [];
  const careful: string[] = [];
  if (w.precipitation) no.push("Precipitation: the aircraft is not waterproof.");
  if (w.windMph !== undefined) {
    if (w.windMph > LIMITS.windMph) no.push(`Wind ${w.windMph} mph is over ${LIMITS.windMph} mph.`);
    else if (w.windMph > LIMITS.cautionWindMph)
      careful.push(`Wind ${w.windMph} mph is getting strong; expect to burn battery fast.`);
  }
  if (w.gustMph !== undefined && w.gustMph > LIMITS.gustMph)
    no.push(`Gusts of ${w.gustMph} mph are over ${LIMITS.gustMph} mph.`);
  if (w.visibilityMi !== undefined && w.visibilityMi < LIMITS.visibilityMi)
    no.push(`Visibility ${w.visibilityMi} mi is under the ${LIMITS.visibilityMi} mi minimum.`);
  const known = ["windMph", "gustMph", "visibilityMi"].filter((k) => w[k as keyof Weather] !== undefined).length;
  if (!known && !w.precipitation) return { decision: "caution", reasons: ["No weather entered yet."] };
  if (no.length) return { decision: "no-go", reasons: no };
  if (careful.length) return { decision: "caution", reasons: careful };
  return { decision: "go", reasons: ["Within the limits."] };
}
