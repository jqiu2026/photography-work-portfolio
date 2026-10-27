import { describe, expect, it } from "vitest";
import {
  angleDiff,
  cToF,
  densityAltitude,
  describeMetar,
  describePeriod,
  flightCategory,
  fToC,
  fuelWeight,
  greatCircle,
  hpaToInHg,
  insideEnvelope,
  inHgToHpa,
  isaTemperatureC,
  loadSummary,
  norm360,
  parseConditions,
  parseMetar,
  parseTaf,
  planTrip,
  pressureAltitude,
  runwayNumber,
  runwayWind,
  windTriangle,
} from "../src";

describe("angles", () => {
  it("wraps and differences", () => {
    expect(norm360(0)).toBe(360);
    expect(norm360(-10)).toBe(350);
    expect(norm360(725)).toBe(5);
    expect(angleDiff(10, 350)).toBe(20);
    expect(angleDiff(350, 10)).toBe(-20);
    expect(Math.abs(angleDiff(180, 0))).toBe(180);
  });
  it("runway numbers", () => {
    expect(runwayNumber(270)).toBe("27");
    expect(runwayNumber(5)).toBe("01");
    expect(runwayNumber(360)).toBe("36");
    expect(runwayNumber(355)).toBe("36");
  });
});

describe("runway wind", () => {
  it("a straight headwind has no crosswind", () => {
    expect(runwayWind(270, 20, 270)).toEqual({ headwind: 20, tailwind: 0, crosswind: 0, from: "none" });
  });
  it("a 90 degree wind is all crosswind", () => {
    const w = runwayWind(360, 15, 270);
    expect(w.crosswind).toBe(15);
    expect(w.headwind).toBe(0);
    expect(w.from).toBe("right");
  });
  it("30 degrees off: half the speed across", () => {
    const w = runwayWind(300, 20, 270);
    expect(w.crosswind).toBe(10);
    expect(w.headwind).toBeCloseTo(17.3, 1);
    expect(runwayWind(240, 20, 270).from).toBe("left");
  });
  it("a tailwind is reported as a tailwind", () => {
    const w = runwayWind(90, 10, 270);
    expect(w.tailwind).toBe(10);
    expect(w.headwind).toBe(0);
  });
  it("handles the 360 wrap", () => {
    expect(runwayWind(10, 20, 350).crosswind).toBeCloseTo(6.8, 1);
  });
  it("rejects a negative speed", () => {
    expect(() => runwayWind(270, -1, 270)).toThrow();
  });
});

describe("density altitude", () => {
  it("standard day at sea level is sea level", () => {
    expect(pressureAltitude(0, 29.92)).toBe(0);
    expect(densityAltitude(0, 15).densityAltitudeFt).toBe(0);
  });
  it("low pressure raises pressure altitude", () => {
    expect(pressureAltitude(1000, 29.42)).toBe(1500);
  });
  it("hot day: 30 C at 5000 ft pressure altitude", () => {
    const d = densityAltitude(5000, 30);
    expect(d.isaC).toBe(5.1);
    expect(d.densityAltitudeFt).toBe(Math.round(5000 + 118.8 * (30 - 5.1)));
    expect(d.deviationC).toBe(24.9);
  });
  it("temperature and pressure conversions", () => {
    expect(isaTemperatureC(10000)).toBe(-4.8);
    expect(cToF(100)).toBe(212);
    expect(fToC(32)).toBe(0);
    expect(hpaToInHg(1013)).toBe(29.91);
    expect(inHgToHpa(29.92)).toBe(1013);
  });
});

describe("wind triangle", () => {
  it("no wind: heading is course, ground speed is airspeed", () => {
    expect(windTriangle(90, 100, { from: 0, speed: 0 })).toEqual({ wcaDeg: 0, trueHeading: 90, groundSpeed: 100 });
  });
  it("a headwind slows and a tailwind speeds", () => {
    expect(windTriangle(90, 100, { from: 90, speed: 20 })?.groundSpeed).toBe(80);
    expect(windTriangle(90, 100, { from: 270, speed: 20 })?.groundSpeed).toBe(120);
  });
  it("a wind from the right is corrected to the right", () => {
    const t = windTriangle(360, 100, { from: 90, speed: 20 });
    expect(t?.wcaDeg).toBeGreaterThan(0);
    expect(t?.wcaDeg).toBe(11.5);
    expect(t?.trueHeading).toBe(12);
    expect(t?.groundSpeed).toBeCloseTo(98, 0);
  });
  it("a wind from the left is corrected to the left", () => {
    expect(windTriangle(360, 100, { from: 270, speed: 20 })?.trueHeading).toBe(348);
  });
  it("returns null when the wind beats the airplane", () => {
    expect(windTriangle(360, 50, { from: 90, speed: 80 })).toBeNull();
    expect(windTriangle(90, 50, { from: 90, speed: 50 })).toBeNull();
  });
});

describe("great circle", () => {
  it("one degree of latitude is 60 NM, due north", () => {
    const g = greatCircle({ lat: 40, lon: -74 }, { lat: 41, lon: -74 });
    expect(g.distanceNm).toBeCloseTo(60, 0);
    expect(g.trueCourse).toBe(360);
  });
  it("due east along the equator", () => {
    const g = greatCircle({ lat: 0, lon: 0 }, { lat: 0, lon: 1 });
    expect(g.trueCourse).toBe(90);
    expect(g.distanceNm).toBeCloseTo(60, 0);
  });
  it("a known pair: New York to Boston is about 160 NM, heading northeast", () => {
    const g = greatCircle({ lat: 40.6413, lon: -73.7781 }, { lat: 42.3656, lon: -71.0096 });
    expect(g.distanceNm).toBeGreaterThan(150);
    expect(g.distanceNm).toBeLessThan(170);
    expect(g.trueCourse).toBeGreaterThan(40);
    expect(g.trueCourse).toBeLessThan(55);
  });
});

describe("trip", () => {
  const base = { tas: 100, fuelBurnPerHour: 10, usableFuel: 30, reserveMinutes: 30 };
  it("no wind: 100 NM at 100 kt is 60 minutes and 10 gallons", () => {
    const r = planTrip({ ...base, legs: [{ distanceNm: 100, trueCourse: 90 }] });
    expect(r.totalMinutes).toBe(60);
    expect(r.tripFuel).toBe(10);
    expect(r.reserveFuel).toBe(5);
    expect(r.requiredFuel).toBe(15);
    expect(r.fuelMargin).toBe(15);
    expect(r.enough).toBe(true);
  });
  it("a headwind adds time and fuel, and fuel can run short", () => {
    const r = planTrip({
      ...base,
      usableFuel: 12,
      wind: { from: 90, speed: 25 },
      legs: [{ distanceNm: 100, trueCourse: 90 }],
    });
    expect(r.legs[0].groundSpeed).toBe(75);
    expect(r.totalMinutes).toBe(80);
    expect(r.enough).toBe(false);
  });
  it("the start and climb allowance counts", () => {
    expect(planTrip({ ...base, allowanceFuel: 2, legs: [{ distanceNm: 100, trueCourse: 90 }] }).tripFuel).toBe(12);
  });
  it("rejects empty or impossible plans", () => {
    expect(() => planTrip({ ...base, legs: [] })).toThrow();
    expect(() => planTrip({ ...base, legs: [{ distanceNm: 0, trueCourse: 0 }] })).toThrow();
    expect(() =>
      planTrip({ ...base, tas: 40, wind: { from: 90, speed: 60 }, legs: [{ distanceNm: 10, trueCourse: 360 }] }),
    ).toThrow(/too strong/);
  });
});

describe("weight and balance", () => {
  const items = [
    { name: "Empty", weight: 1500, arm: 40 },
    { name: "Pilot", weight: 180, arm: 37 },
    { name: "Fuel", weight: fuelWeight(30), arm: 48 },
  ];
  it("totals, moment and CG", () => {
    expect(fuelWeight(30)).toBe(180);
    const s = loadSummary(items);
    expect(s.weight).toBe(1860);
    expect(s.moment).toBe(60000 + 6660 + 8640);
    expect(s.cg).toBe(40.48);
  });
  const env = [
    { cg: 35, weight: 1500 },
    { cg: 35, weight: 2200 },
    { cg: 47, weight: 2200 },
    { cg: 47, weight: 1500 },
  ];
  it("inside, outside and on the edge of an envelope", () => {
    expect(insideEnvelope({ cg: 40, weight: 1800 }, env)).toBe(true);
    expect(insideEnvelope({ cg: 34, weight: 1800 }, env)).toBe(false);
    expect(insideEnvelope({ cg: 40, weight: 2300 }, env)).toBe(false);
    expect(insideEnvelope({ cg: 35, weight: 1800 }, env)).toBe(true);
    expect(insideEnvelope({ cg: 47, weight: 2200 }, env)).toBe(true);
  });
  it("a non-rectangular envelope", () => {
    const tri = [
      { cg: 0, weight: 0 },
      { cg: 10, weight: 0 },
      { cg: 0, weight: 10 },
    ];
    expect(insideEnvelope({ cg: 2, weight: 2 }, tri)).toBe(true);
    expect(insideEnvelope({ cg: 8, weight: 8 }, tri)).toBe(false);
  });
  it("rejects bad input", () => {
    expect(() => loadSummary([])).toThrow();
    expect(() => insideEnvelope({ cg: 1, weight: 1 }, [{ cg: 0, weight: 0 }])).toThrow();
  });
});

describe("flight category", () => {
  it("uses the lower of ceiling and visibility", () => {
    expect(flightCategory(5000, 10)).toBe("VFR");
    expect(flightCategory(3000, 10)).toBe("MVFR");
    expect(flightCategory(undefined, 4)).toBe("MVFR");
    expect(flightCategory(900, 10)).toBe("IFR");
    expect(flightCategory(5000, 2)).toBe("IFR");
    expect(flightCategory(400, 10)).toBe("LIFR");
    expect(flightCategory(5000, 0.5)).toBe("LIFR");
    expect(flightCategory(undefined, undefined)).toBeUndefined();
  });
});

describe("METAR", () => {
  const raw = "METAR KJFK 271251Z 28012G22KT 10SM FEW040 BKN250 18/09 A3002 RMK AO2 SLP168 T01830094";
  it("decodes the groups", () => {
    const m = parseMetar(raw);
    expect(m.station).toBe("KJFK");
    expect([m.day, m.hour, m.minute]).toEqual([27, 12, 51]);
    expect(m.conditions.wind).toMatchObject({ dir: 280, speed: 12, gust: 22, calm: false });
    expect(m.conditions.visibilitySm).toBe(10);
    expect(m.conditions.sky).toEqual([
      { cover: "FEW", baseFt: 4000, type: undefined },
      { cover: "BKN", baseFt: 25000, type: undefined },
    ]);
    expect(m.conditions.ceilingFt).toBe(25000);
    expect(m.conditions.category).toBe("VFR");
    expect(m.temperatureC).toBe(18);
    expect(m.dewpointC).toBe(9);
    expect(m.altimeterInHg).toBe(30.02);
    expect(m.remarks).toContain("AO2");
  });
  it("negative temperatures, variable wind, fractions and weather", () => {
    const m = parseMetar("KBOS 271254Z AUTO VRB03KT 1 1/2SM -SN BR OVC008 M02/M03 A2990");
    expect(m.auto).toBe(true);
    expect(m.conditions.wind?.dir).toBe("VRB");
    expect(m.conditions.visibilitySm).toBe(1.5);
    expect(m.conditions.weather).toEqual(["light snow", "mist"]);
    expect(m.conditions.ceilingFt).toBe(800);
    expect(m.conditions.category).toBe("IFR");
    expect(m.temperatureC).toBe(-2);
    expect(m.dewpointC).toBe(-3);
  });
  it("P6SM, calm, QNH and metric visibility", () => {
    expect(parseMetar("KXXX 010000Z 00000KT P6SM CLR 10/05 A3010").conditions.visibilityPlus).toBe(true);
    expect(parseMetar("KXXX 010000Z 00000KT P6SM CLR 10/05 A3010").conditions.wind?.calm).toBe(true);
    const e = parseMetar("EGLL 271250Z 24010KT 9999 SCT025 12/08 Q1015");
    expect(e.altimeterHpa).toBe(1015);
    expect(e.altimeterInHg).toBe(29.97);
    expect(e.conditions.visibilityPlus).toBe(true);
  });
  it("thunderstorms and cumulonimbus", () => {
    const m = parseMetar("KMCO 271853Z 18015G30KT 3SM +TSRA BKN030CB 28/24 A2995");
    expect(m.conditions.weather).toEqual(["heavy thunderstorm with rain"]);
    expect(m.conditions.sky[0].type).toBe("CB");
    expect(m.conditions.category).toBe("MVFR");
  });
  it("lists what it could not decode instead of guessing", () => {
    const m = parseMetar("KXXX 010000Z 27010KT 10SM FOOBAR SCT050 15/10 A3000");
    expect(m.conditions.unknown).toEqual(["FOOBAR"]);
    expect(describeMetar(m).join(" ")).toContain("Not decoded: FOOBAR");
  });
  it("says what it means in words", () => {
    const text = describeMetar(parseMetar(raw)).join("\n");
    expect(text).toContain("Wind: from 280° at 12 knots, gusting 22.");
    expect(text).toContain("few clouds at 4,000 ft");
    expect(text).toContain("Flight category: VFR.");
    expect(text).toContain("Altimeter 30.02 inHg (1017 hPa).");
  });
  it("warns when temperature and dew point are close", () => {
    expect(describeMetar(parseMetar("KXXX 010000Z 00000KT 10SM CLR 10/09 A3000")).join(" ")).toContain(
      "fog or low cloud",
    );
  });
  it("rejects empty input", () => {
    expect(() => parseMetar("  ")).toThrow();
  });
});

describe("TAF", () => {
  const raw =
    "TAF KJFK 271130Z 2712/2818 28010KT P6SM FEW050 FM271800 30015G25KT P6SM SCT040 TEMPO 2718/2722 BKN030 PROB30 2800/2804 3SM -RA BKN020 BECMG 2806/2808 VRB03KT";
  it("splits into the periods it names", () => {
    const t = parseTaf(raw);
    expect(t.station).toBe("KJFK");
    expect(t.valid).toBe("2712/2818");
    expect(t.periods.map((p) => p.kind)).toEqual(["BASE", "FM", "TEMPO", "PROB", "BECMG"]);
    expect(t.periods[1].when).toBe("271800");
    expect(t.periods[1].conditions.wind).toMatchObject({ dir: 300, speed: 15, gust: 25 });
    expect(t.periods[2].conditions.ceilingFt).toBe(3000);
    expect(t.periods[3]).toMatchObject({ prob: 30, when: "2800/2804" });
    expect(t.periods[3].conditions.category).toBe("MVFR");
  });
  it("describes a period in words", () => {
    const t = parseTaf(raw);
    expect(describePeriod(t.periods[1])).toContain("From day 27 at 1800 UTC");
    expect(describePeriod(t.periods[3])).toContain("30% chance");
    expect(describePeriod(t.periods[2])).toContain("Temporarily");
  });
  it("handles AMD and PROB with TEMPO", () => {
    const t = parseTaf("TAF AMD KXXX 271130Z 2712/2818 27010KT P6SM SKC PROB40 TEMPO 2800/2802 2SM BR");
    expect(t.amended).toBe(true);
    expect(t.periods[1]).toMatchObject({ kind: "PROB", prob: 40 });
    expect(t.periods[1].conditions.visibilitySm).toBe(2);
  });
});

describe("conditions", () => {
  it("CAVOK is clear and unlimited", () => {
    const c = parseConditions(["CAVOK"]);
    expect(c.clear).toBe(true);
    expect(c.category).toBe("VFR");
  });
  it("vertical visibility counts as a ceiling", () => {
    expect(parseConditions(["1/4SM", "FG", "VV002"]).category).toBe("LIFR");
  });
});

import { airportUse, looksLikeTailNumber, publishable, routePoints } from "../src";

describe("flight publishing rules", () => {
  const raw = [
    { id: "a", from: "KAAA", to: "KBBB", month: "", landedOn: "2026-09-10", aircraft: "Cessna 172", note: "x" },
    { id: "b", from: "KAAA", to: "KAAA", month: "", landedOn: "2026-10-25" },
    { id: "c", from: "KBBB", to: "KAAA", month: "", landedOn: "2026-10-15" },
  ];
  const now = new Date("2026-10-27T12:00:00Z");
  it("holds back anything that landed in the last 7 days, rounds to the month, newest first", () => {
    const p = publishable(raw, now);
    expect(p.map((f) => f.id)).toEqual(["c", "a"]);
    expect(p[1].month).toBe("2026-09");
    expect(Object.keys(p[0]).includes("landedOn")).toBe(false);
  });
  it("counts the whole landing day: a flight is shown once 7 full days have passed", () => {
    const f = (d: string) => [{ id: "x", from: "A", to: "B", month: "", landedOn: d }];
    expect(publishable(f("2026-10-19"), now)).toHaveLength(1);
    expect(publishable(f("2026-10-20"), now)).toHaveLength(0);
  });
  it("counts airport use once for a local flight", () => {
    const u = airportUse([
      { id: "1", from: "A", to: "A", month: "2026-01" },
      { id: "2", from: "A", to: "B", month: "2026-02" },
    ]);
    expect(u.get("A")).toBe(2);
    expect(u.get("B")).toBe(1);
  });
  it("spots registrations", () => {
    for (const t of ["flew N123AB today", "G-ABCD", "C-FABC was nice", "n4567"])
      expect(looksLikeTailNumber(t)).toBe(true);
    for (const t of ["Cessna 172", "a lovely evening flight", "KJFK to KBOS"])
      expect(looksLikeTailNumber(t)).toBe(false);
  });
  it("route points start and end at the airports", () => {
    const a = { code: "A", name: "A", lat: 40, lon: -74 };
    const b = { code: "B", name: "B", lat: 42, lon: -71 };
    const r = routePoints(a, b, 10);
    expect(r).toHaveLength(11);
    expect(r[0][0]).toBeCloseTo(40, 4);
    expect(r[10][1]).toBeCloseTo(-71, 4);
    expect(routePoints(a, a)).toEqual([[40, -74]]);
  });
});
