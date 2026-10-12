/**
 * Flight data interface. Privacy rules (docs/project/11, Q35/Q43) are enforced here, not in the UI:
 * airport level only, month precision, published at least 7 days after landing, never live, no tail numbers.
 */
export type Airport = { code: string; name: string; lat: number; lon: number };
export type Flight = {
  id: string;
  from: string;
  to: string;
  /** "YYYY-MM": month precision on purpose */
  month: string;
  /** aircraft type only, never a registration */
  aircraft?: string;
  note?: string;
  sample: boolean;
};
export type RawFlight = Flight & { landedAt: string; tailNumber?: string; liveLat?: number; liveLon?: number };

export interface FlightSource {
  airports(): Promise<Airport[]>;
  flights(now?: Date): Promise<Flight[]>;
}

export const MIN_DELAY_DAYS = 7;

/** Strips everything private and drops flights that landed less than 7 days ago. Pure and tested. */
export function publishable(raw: RawFlight[], now: Date, delayDays = MIN_DELAY_DAYS): Flight[] {
  const cutoff = now.getTime() - delayDays * 86_400_000;
  return raw
    .filter((f) => new Date(f.landedAt).getTime() <= cutoff)
    .map(({ id, from, to, month, aircraft, note, sample }) => ({ id, from, to, month, aircraft, note, sample }))
    .sort((a, b) => b.month.localeCompare(a.month));
}

/** Initial great-circle bearing, degrees (for route labels). */
export function greatCircle(a: Airport, b: Airport, steps = 48): [number, number][] {
  const rad = Math.PI / 180;
  const [la1, lo1, la2, lo2] = [a.lat * rad, a.lon * rad, b.lat * rad, b.lon * rad];
  const d = 2 * Math.asin(Math.sqrt(Math.sin((la2 - la1) / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin((lo2 - lo1) / 2) ** 2));
  if (d === 0) return [[a.lat, a.lon]];
  const out: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(la1) * Math.cos(lo1) + B * Math.cos(la2) * Math.cos(lo2);
    const y = A * Math.cos(la1) * Math.sin(lo1) + B * Math.cos(la2) * Math.sin(lo2);
    const z = A * Math.sin(la1) + B * Math.sin(la2);
    out.push([Math.atan2(z, Math.sqrt(x * x + y * y)) / rad, Math.atan2(y, x) / rad]);
  }
  return out;
}
