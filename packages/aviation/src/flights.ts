/**
 * What may be shown about a flight. The privacy rules (docs Q35, Q43) live here, not in the page: airport level only, month
 * precision, published at least 7 days after landing, never live, and no tail numbers (a flight carries an aircraft TYPE
 * only: there is no field for a registration at all).
 */
export type Airport = { code: string; name: string; lat: number; lon: number };

export type Flight = {
  id: string;
  from: string;
  to: string;
  /** "YYYY-MM": month precision on purpose */
  month: string;
  /** aircraft type only, for example "Cessna 172", never a registration */
  aircraft?: string;
  note?: string;
};

export type RawFlight = Flight & { landedOn: string };

export const MIN_DELAY_DAYS = 7;

/** Drops flights that landed less than 7 days ago and keeps only the public fields, newest first. */
export function publishable(raw: RawFlight[], now: Date, delayDays = MIN_DELAY_DAYS): Flight[] {
  const cutoff = now.getTime() - delayDays * 86_400_000;
  return raw
    .filter((f) => new Date(`${f.landedOn}T23:59:59Z`).getTime() <= cutoff)
    .map(({ id, from, to, landedOn, aircraft, note }) => ({
      id,
      from,
      to,
      month: landedOn.slice(0, 7),
      aircraft,
      note,
    }))
    .sort((a, b) => b.month.localeCompare(a.month));
}

/** Airports that appear in at least one of the flights, and how often each one is used. */
export function airportUse(flights: Flight[]) {
  const n = new Map<string, number>();
  for (const f of flights) for (const c of f.from === f.to ? [f.from] : [f.from, f.to]) n.set(c, (n.get(c) ?? 0) + 1);
  return n;
}

/** A registration-like string ("N123AB", "G-ABCD", "C-FABC"): such text must never be stored in a note or a type. */
const TAIL = /\b(?:N\d{1,5}[A-Z]{0,2}|[A-Z]{1,2}-[A-Z0-9]{3,5})\b/;
export const looksLikeTailNumber = (text: string) => TAIL.test(text.toUpperCase());

/** Points along the great circle between two airports, for drawing a route. */
export function routePoints(a: Airport, b: Airport, steps = 48): [number, number][] {
  const rad = Math.PI / 180;
  const [la1, lo1, la2, lo2] = [a.lat * rad, a.lon * rad, b.lat * rad, b.lon * rad];
  const d =
    2 *
    Math.asin(
      Math.sqrt(Math.sin((la2 - la1) / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin((lo2 - lo1) / 2) ** 2),
    );
  if (d === 0) return [[a.lat, a.lon]];
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(la1) * Math.cos(lo1) + B * Math.cos(la2) * Math.cos(lo2);
    const y = A * Math.cos(la1) * Math.sin(lo1) + B * Math.cos(la2) * Math.sin(lo2);
    const z = A * Math.sin(la1) + B * Math.sin(la2);
    pts.push([Math.atan2(z, Math.sqrt(x * x + y * y)) / rad, Math.atan2(y, x) / rad]);
  }
  return pts;
}
