/**
 * Flight calculations for learning. Pure functions, no I/O. Every result is an estimate from the numbers typed in: it is
 * not flight planning, not a performance chart, and never a substitute for the aircraft's handbook or an instructor.
 */
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const round = (n: number, p = 0) => {
  const k = 10 ** p;
  return Math.round(n * k) / k;
};
/** Wraps any angle to 0 up to 360 (0 is written 360, as on a compass). */
export const norm360 = (d: number) => {
  const r = ((d % 360) + 360) % 360;
  return r === 0 ? 360 : r;
};
/** The smallest signed difference between two headings, -180 to 180. */
export const angleDiff = (a: number, b: number) => ((((a - b) % 360) + 540) % 360) - 180;

/* ---------- wind on a runway ---------- */
export type RunwayWind = { headwind: number; tailwind: number; crosswind: number; from: "left" | "right" | "none" };

/** Wind components for a runway. `runway` is its magnetic heading (runway 27 is 270); wind direction in the same reference. */
export function runwayWind(windDir: number, windSpeed: number, runway: number): RunwayWind {
  if (windSpeed < 0) throw new Error("Wind speed cannot be negative.");
  const a = rad(angleDiff(windDir, runway));
  const head = windSpeed * Math.cos(a);
  const cross = windSpeed * Math.sin(a);
  return {
    headwind: head > 0 ? round(head, 1) : 0,
    tailwind: head < 0 ? round(-head, 1) : 0,
    crosswind: round(Math.abs(cross), 1),
    from: Math.abs(cross) < 0.05 ? "none" : cross > 0 ? "right" : "left",
  };
}

/** The runway number (tens of degrees) for a heading: 270 becomes "27", 5 becomes "36". */
export const runwayNumber = (heading: number) => String(Math.round(norm360(heading) / 10) % 36 || 36).padStart(2, "0");

/* ---------- altitude and density ---------- */
export const pressureAltitude = (fieldElevationFt: number, altimeterInHg: number) =>
  round(fieldElevationFt + (29.92 - altimeterInHg) * 1000);

/** Standard-atmosphere temperature in °C at a pressure altitude (troposphere). */
export const isaTemperatureC = (pressureAltFt: number) => round(15 - 1.98 * (pressureAltFt / 1000), 1);

/** Density altitude by the usual rule of thumb: 118.8 ft for every °C above standard. An estimate, best below about 10,000 ft. */
export function densityAltitude(pressureAltFt: number, oatC: number) {
  const isa = isaTemperatureC(pressureAltFt);
  return {
    isaC: isa,
    deviationC: round(oatC - isa, 1),
    densityAltitudeFt: round(pressureAltFt + 118.8 * (oatC - isa)),
  };
}

export const cToF = (c: number) => round((c * 9) / 5 + 32, 1);
export const fToC = (f: number) => round(((f - 32) * 5) / 9, 1);
export const hpaToInHg = (hpa: number) => round(hpa * 0.02953, 2);
export const inHgToHpa = (inHg: number) => round(inHg / 0.02953);

/* ---------- navigation ---------- */
export type Wind = { from: number; speed: number };

/** Wind correction angle, true heading and ground speed for a course and true airspeed. Null when the wind is too strong to hold the course. */
export function windTriangle(trueCourse: number, tas: number, wind: Wind) {
  if (tas <= 0) throw new Error("Airspeed must be above zero.");
  const rel = rad(angleDiff(wind.from, trueCourse));
  const s = (wind.speed / tas) * Math.sin(rel);
  if (Math.abs(s) > 1) return null;
  const wca = Math.asin(s);
  const gs = tas * Math.cos(wca) - wind.speed * Math.cos(rel);
  if (gs <= 0) return null;
  return {
    wcaDeg: round(deg(wca), 1) + 0,
    trueHeading: round(norm360(trueCourse + deg(wca))),
    groundSpeed: round(gs, 1),
  };
}

const R_NM = 3440.065;
export type Point = { lat: number; lon: number };

/** Great-circle distance in nautical miles and the initial true course from a to b. */
export function greatCircle(a: Point, b: Point) {
  const [p1, p2, dl] = [rad(a.lat), rad(b.lat), rad(b.lon - a.lon)];
  const h = Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  const distance = 2 * R_NM * Math.asin(Math.min(1, Math.sqrt(h)));
  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  return { distanceNm: round(distance, 1), trueCourse: round(norm360(deg(Math.atan2(y, x)))) };
}

export type Leg = { name?: string; distanceNm: number; trueCourse: number };
export type TripInput = {
  legs: Leg[];
  tas: number;
  wind?: Wind;
  fuelBurnPerHour: number;
  usableFuel: number;
  /** minutes of reserve: 30 by day and 45 by night under VFR (14 CFR 91.151), or what the pilot chooses */
  reserveMinutes: number;
  /** fixed allowance for start, taxi, takeoff and climb, in fuel units */
  allowanceFuel?: number;
};

export type TripResult = {
  legs: {
    name?: string;
    distanceNm: number;
    trueCourse: number;
    trueHeading: number;
    groundSpeed: number;
    minutes: number;
    fuel: number;
  }[];
  totalDistanceNm: number;
  totalMinutes: number;
  tripFuel: number;
  reserveFuel: number;
  requiredFuel: number;
  fuelMargin: number;
  enough: boolean;
};

export function planTrip(i: TripInput): TripResult {
  if (!i.legs.length) throw new Error("Add at least one leg.");
  if (i.fuelBurnPerHour <= 0) throw new Error("Fuel burn must be above zero.");
  const wind = i.wind ?? { from: 0, speed: 0 };
  const legs = i.legs.map((l) => {
    if (l.distanceNm <= 0) throw new Error("Each leg needs a distance above zero.");
    const t = windTriangle(l.trueCourse, i.tas, wind);
    if (!t) throw new Error("The wind is too strong to make this course good at that airspeed.");
    const minutes = (l.distanceNm / t.groundSpeed) * 60;
    return {
      ...l,
      trueHeading: t.trueHeading,
      groundSpeed: t.groundSpeed,
      minutes: round(minutes, 1),
      fuel: round((minutes / 60) * i.fuelBurnPerHour, 2),
    };
  });
  const totalMinutes = legs.reduce((n, l) => n + l.minutes, 0);
  const tripFuel = round(legs.reduce((n, l) => n + l.fuel, 0) + (i.allowanceFuel ?? 0), 2);
  const reserveFuel = round((i.reserveMinutes / 60) * i.fuelBurnPerHour, 2);
  const requiredFuel = round(tripFuel + reserveFuel, 2);
  return {
    legs,
    totalDistanceNm: round(
      legs.reduce((n, l) => n + l.distanceNm, 0),
      1,
    ),
    totalMinutes: round(totalMinutes, 1),
    tripFuel,
    reserveFuel,
    requiredFuel,
    fuelMargin: round(i.usableFuel - requiredFuel, 2),
    enough: i.usableFuel >= requiredFuel,
  };
}

/* ---------- weight and balance ---------- */
export type Item = { name: string; weight: number; arm: number };
export type EnvelopePoint = { cg: number; weight: number };

export function loadSummary(items: Item[]) {
  const weight = items.reduce((n, i) => n + i.weight, 0);
  const moment = items.reduce((n, i) => n + i.weight * i.arm, 0);
  if (weight <= 0) throw new Error("The total weight must be above zero.");
  return { weight: round(weight, 1), moment: round(moment, 1), cg: round(moment / weight, 2) };
}

/** Whether a (CG, weight) point is inside an envelope given as a closed polygon (the last point joins the first). Edges count as inside. */
export function insideEnvelope(p: EnvelopePoint, env: EnvelopePoint[]): boolean {
  if (env.length < 3) throw new Error("An envelope needs at least three points.");
  const on = (a: EnvelopePoint, b: EnvelopePoint) => {
    const cross = (b.cg - a.cg) * (p.weight - a.weight) - (b.weight - a.weight) * (p.cg - a.cg);
    if (Math.abs(cross) > 1e-9) return false;
    return (
      p.cg >= Math.min(a.cg, b.cg) - 1e-9 &&
      p.cg <= Math.max(a.cg, b.cg) + 1e-9 &&
      p.weight >= Math.min(a.weight, b.weight) - 1e-9 &&
      p.weight <= Math.max(a.weight, b.weight) + 1e-9
    );
  };
  let inside = false;
  for (let i = 0, j = env.length - 1; i < env.length; j = i++) {
    if (on(env[j], env[i])) return true;
    const a = env[i];
    const b = env[j];
    if (
      a.weight > p.weight !== b.weight > p.weight &&
      p.cg < ((b.cg - a.cg) * (p.weight - a.weight)) / (b.weight - a.weight) + a.cg
    )
      inside = !inside;
  }
  return inside;
}

/** Fuel weight: avgas is about 6.0 lb per US gallon; jet fuel about 6.7. */
export const AVGAS_LB_PER_GAL = 6;
export const fuelWeight = (gal: number, lbPerGal = AVGAS_LB_PER_GAL) => round(gal * lbPerGal, 1);
