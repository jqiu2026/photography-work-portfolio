"use client";

import { greatCircle, planTrip } from "@jerryqiu/aviation";
import { useState } from "react";
import { Button, Field, Input, Select, Tag } from "@/components/ui";
import { num } from "./num";

type Row = { name: string; dist: string; course: string };

/** A leg-by-leg time and fuel estimate with a wind. It is arithmetic on the numbers typed in: no airspace, terrain or weather. */
export function TripTool() {
  const [legs, setLegs] = useState<Row[]>([
    { name: "Leg 1", dist: "60", course: "45" },
    { name: "Leg 2", dist: "55", course: "180" },
  ]);
  const [tas, setTas] = useState("100");
  const [wdir, setWdir] = useState("270");
  const [wspd, setWspd] = useState("15");
  const [burn, setBurn] = useState("9");
  const [fuel, setFuel] = useState("30");
  const [reserve, setReserve] = useState("30");
  const [allow, setAllow] = useState("1.5");
  const [pts, setPts] = useState({ a: "", b: "", c: "", d: "" });

  const set = (i: number, k: keyof Row, v: string) => setLegs((l) => l.map((r, j) => (j === i ? { ...r, [k]: v } : r)));

  let result: ReturnType<typeof planTrip> | null = null;
  let error = "";
  try {
    const parsed = legs.map((l) => ({ name: l.name, distanceNm: num(l.dist), trueCourse: num(l.course) }));
    if (parsed.some((l) => l.distanceNm === null || l.trueCourse === null))
      throw new Error("Fill in a distance and a course for every leg.");
    const T = num(tas);
    const B = num(burn);
    const F = num(fuel);
    const W = num(wspd) ?? 0;
    if (T === null || B === null || F === null) throw new Error("Fill in airspeed, fuel burn and usable fuel.");
    result = planTrip({
      legs: parsed as { name: string; distanceNm: number; trueCourse: number }[],
      tas: T,
      wind: { from: num(wdir) ?? 0, speed: W },
      fuelBurnPerHour: B,
      usableFuel: F,
      reserveMinutes: Number(reserve),
      allowanceFuel: num(allow) ?? 0,
    });
  } catch (e) {
    error = (e as Error).message;
  }

  const gc = (() => {
    const v = [num(pts.a), num(pts.b), num(pts.c), num(pts.d)];
    return v.every((x) => x !== null)
      ? greatCircle({ lat: v[0] as number, lon: v[1] as number }, { lat: v[2] as number, lon: v[3] as number })
      : null;
  })();

  return (
    <div className="fl-tool">
      <form className="fl-stack" onSubmit={(e) => e.preventDefault()} aria-label="Trip inputs">
        <div className="fl-fields">
          <Field label="True airspeed (knots)">
            <Input inputMode="decimal" value={tas} onChange={(e) => setTas(e.target.value)} />
          </Field>
          <Field label="Wind from (true, degrees)">
            <Input inputMode="numeric" value={wdir} onChange={(e) => setWdir(e.target.value)} />
          </Field>
          <Field label="Wind speed (knots)">
            <Input inputMode="decimal" value={wspd} onChange={(e) => setWspd(e.target.value)} />
          </Field>
          <Field label="Fuel burn (per hour)">
            <Input inputMode="decimal" value={burn} onChange={(e) => setBurn(e.target.value)} />
          </Field>
          <Field label="Usable fuel">
            <Input inputMode="decimal" value={fuel} onChange={(e) => setFuel(e.target.value)} />
          </Field>
          <Field label="Start, taxi and climb allowance (fuel)">
            <Input inputMode="decimal" value={allow} onChange={(e) => setAllow(e.target.value)} />
          </Field>
          <Field label="Reserve" hint="14 CFR 91.151: 30 minutes by day, 45 at night (VFR).">
            <Select
              value={reserve}
              onValueChange={setReserve}
              options={[
                { value: "30", label: "30 minutes (day VFR)" },
                { value: "45", label: "45 minutes (night VFR)" },
                { value: "60", label: "60 minutes" },
              ]}
            />
          </Field>
        </div>
        <table className="fl-table">
          <caption className="fl-sr">Legs</caption>
          <thead>
            <tr>
              <th scope="col">Leg</th>
              <th scope="col">Distance (NM)</th>
              <th scope="col">True course</th>
              <th scope="col">
                <span className="fl-sr">Remove</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {legs.map((l, i) => (
              <tr key={i}>
                <td>
                  <Input
                    aria-label={`Leg ${i + 1} name`}
                    value={l.name}
                    onChange={(e) => set(i, "name", e.target.value)}
                  />
                </td>
                <td>
                  <Input
                    aria-label={`Leg ${i + 1} distance`}
                    inputMode="decimal"
                    value={l.dist}
                    onChange={(e) => set(i, "dist", e.target.value)}
                  />
                </td>
                <td>
                  <Input
                    aria-label={`Leg ${i + 1} true course`}
                    inputMode="numeric"
                    value={l.course}
                    onChange={(e) => set(i, "course", e.target.value)}
                  />
                </td>
                <td>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setLegs((x) => x.filter((_, j) => j !== i))}
                    disabled={legs.length < 2}
                  >
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setLegs((l) => [...l, { name: `Leg ${l.length + 1}`, dist: "", course: "" }])}
          >
            Add a leg
          </Button>
        </div>
        <fieldset className="fl-stack" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="fl-muted">Distance between two points (decimal degrees)</legend>
          <div className="fl-fields">
            {(["a", "b", "c", "d"] as const).map((k, i) => (
              <Field key={k} label={["From latitude", "From longitude", "To latitude", "To longitude"][i]}>
                <Input
                  inputMode="decimal"
                  value={pts[k]}
                  onChange={(e) => setPts((p) => ({ ...p, [k]: e.target.value }))}
                />
              </Field>
            ))}
          </div>
          {gc ? (
            <p style={{ margin: 0 }} aria-live="polite">
              {gc.distanceNm} NM, initial true course {String(gc.trueCourse).padStart(3, "0")}°.{" "}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  setLegs((l) => [
                    ...l,
                    { name: `Leg ${l.length + 1}`, dist: String(gc.distanceNm), course: String(gc.trueCourse) },
                  ])
                }
              >
                Add as a leg
              </Button>
            </p>
          ) : null}
        </fieldset>
      </form>
      <section className="fl-result" aria-labelledby="out" aria-live="polite">
        <h2 id="out">Estimate</h2>
        {error || !result ? (
          <p className="fl-muted">{error}</p>
        ) : (
          <>
            <div className="fl-readout">
              <div>
                <span className="fl-muted">Time</span>
                <span className="fl-big">
                  {Math.floor(result.totalMinutes / 60)}:{String(Math.round(result.totalMinutes % 60)).padStart(2, "0")}
                </span>
                <span className="fl-mono">{result.totalDistanceNm} NM</span>
              </div>
              <div>
                <span className="fl-muted">Fuel needed</span>
                <span className="fl-big">{result.requiredFuel}</span>
                <span className="fl-mono">
                  trip {result.tripFuel} + reserve {result.reserveFuel}
                </span>
              </div>
            </div>
            {result.enough ? (
              <Tag tone="success">{result.fuelMargin} left over on top of the reserve.</Tag>
            ) : (
              <Tag tone="danger">
                Short by {Math.abs(result.fuelMargin)}: not enough fuel for the trip and the reserve.
              </Tag>
            )}
            <table className="fl-table">
              <caption className="fl-sr">Each leg</caption>
              <thead>
                <tr>
                  <th scope="col">Leg</th>
                  <th scope="col" className="num">
                    Heading
                  </th>
                  <th scope="col" className="num">
                    Ground speed
                  </th>
                  <th scope="col" className="num">
                    Min
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.legs.map((l, i) => (
                  <tr key={i}>
                    <td>{l.name}</td>
                    <td className="num">{String(l.trueHeading).padStart(3, "0")}° true</td>
                    <td className="num">{l.groundSpeed}</td>
                    <td className="num">{l.minutes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="fl-muted" style={{ margin: 0 }}>
              Headings are true; apply variation and deviation yourself. The same wind is used on every leg.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
