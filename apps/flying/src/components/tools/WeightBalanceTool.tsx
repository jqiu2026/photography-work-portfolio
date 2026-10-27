"use client";

import { AVGAS_LB_PER_GAL, type EnvelopePoint, fuelWeight, insideEnvelope, loadSummary } from "@jerryqiu/aviation";
import { useState } from "react";
import { Button, Field, Input, Tag, Textarea } from "@/components/ui";
import { num } from "./num";

type Row = { name: string; weight: string; arm: string };

/**
 * Weight and balance with the numbers you type. The starting values are SAMPLE numbers for an imaginary airplane: use the
 * weight, arms and envelope from YOUR aircraft's handbook and its latest weighing.
 */
const SAMPLE_ROWS: Row[] = [
  { name: "Empty airplane (SAMPLE)", weight: "1500", arm: "40" },
  { name: "Pilot and front passenger (SAMPLE)", weight: "340", arm: "37" },
  { name: "Rear passengers (SAMPLE)", weight: "0", arm: "73" },
  { name: "Baggage (SAMPLE)", weight: "20", arm: "95" },
];
const SAMPLE_ENVELOPE = "35, 1500\n35, 1950\n38.5, 2300\n47, 2300\n47, 1500";

function parseEnvelope(text: string): EnvelopePoint[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [cg, weight] = l.split(/[,\s]+/).map(Number);
      if (!Number.isFinite(cg) || !Number.isFinite(weight))
        throw new Error(`Could not read the envelope line "${l}". Use: CG, weight.`);
      return { cg, weight };
    });
}

export function WeightBalanceTool() {
  const [rows, setRows] = useState(SAMPLE_ROWS);
  const [gal, setGal] = useState("40");
  const [fuelArm, setFuelArm] = useState("48");
  const [lb, setLb] = useState(String(AVGAS_LB_PER_GAL));
  const [env, setEnv] = useState(SAMPLE_ENVELOPE);
  const [maxW, setMaxW] = useState("2300");

  const set = (i: number, k: keyof Row, v: string) => setRows((r) => r.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  let out: { weight: number; moment: number; cg: number; inside: boolean; over: boolean; fuelLb: number } | null = null;
  let polygon: EnvelopePoint[] = [];
  let error = "";
  try {
    const items = rows.map((r) => ({ name: r.name, weight: num(r.weight), arm: num(r.arm) }));
    if (items.some((i) => i.weight === null || i.arm === null))
      throw new Error("Fill in a weight and an arm for every line.");
    const g = num(gal);
    const a = num(fuelArm);
    const l = num(lb);
    if (g === null || a === null || l === null) throw new Error("Fill in the fuel gallons, arm and weight per gallon.");
    const fuelLb = fuelWeight(g, l);
    const all = [
      ...(items as { name: string; weight: number; arm: number }[]),
      { name: "Fuel", weight: fuelLb, arm: a },
    ];
    const s = loadSummary(all);
    polygon = parseEnvelope(env);
    const m = num(maxW);
    out = {
      ...s,
      fuelLb,
      inside: insideEnvelope({ cg: s.cg, weight: s.weight }, polygon),
      over: m !== null && s.weight > m,
    };
  } catch (e) {
    error = (e as Error).message;
  }

  const plot = (() => {
    if (!polygon.length) return null;
    const xs = [...polygon.map((p) => p.cg), ...(out ? [out.cg] : [])];
    const ys = [...polygon.map((p) => p.weight), ...(out ? [out.weight] : [])];
    const [x0, x1, y0, y1] = [Math.min(...xs) - 2, Math.max(...xs) + 2, Math.min(...ys) - 100, Math.max(...ys) + 100];
    const px = (x: number) => 30 + ((x - x0) / (x1 - x0)) * 340;
    const py = (y: number) => 230 - ((y - y0) / (y1 - y0)) * 210;
    return {
      d: polygon.map((p, i) => `${i ? "L" : "M"}${px(p.cg).toFixed(1)} ${py(p.weight).toFixed(1)}`).join("") + "Z",
      x: out ? px(out.cg) : 0,
      y: out ? py(out.weight) : 0,
    };
  })();

  return (
    <div className="fl-tool">
      <form className="fl-stack" onSubmit={(e) => e.preventDefault()} aria-label="Weight and balance inputs">
        <p className="fl-sample">
          SAMPLE numbers for an imaginary airplane. Replace every number with your aircraft's own.
        </p>
        <table className="fl-table">
          <caption className="fl-sr">Loading</caption>
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col">Weight (lb)</th>
              <th scope="col">Arm (in)</th>
              <th scope="col">
                <span className="fl-sr">Remove</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: rows are positional
              <tr key={i}>
                <td>
                  <Input
                    aria-label={`Item ${i + 1} name`}
                    value={r.name}
                    onChange={(e) => set(i, "name", e.target.value)}
                  />
                </td>
                <td>
                  <Input
                    aria-label={`${r.name || `Item ${i + 1}`} weight`}
                    inputMode="decimal"
                    value={r.weight}
                    onChange={(e) => set(i, "weight", e.target.value)}
                  />
                </td>
                <td>
                  <Input
                    aria-label={`${r.name || `Item ${i + 1}`} arm`}
                    inputMode="decimal"
                    value={r.arm}
                    onChange={(e) => set(i, "arm", e.target.value)}
                  />
                </td>
                <td>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setRows((x) => x.filter((_, j) => j !== i))}
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
            onClick={() => setRows((r) => [...r, { name: "", weight: "", arm: "" }])}
          >
            Add a line
          </Button>
        </div>
        <div className="fl-fields">
          <Field label="Fuel (gallons)">
            <Input inputMode="decimal" value={gal} onChange={(e) => setGal(e.target.value)} />
          </Field>
          <Field label="Fuel arm (in)">
            <Input inputMode="decimal" value={fuelArm} onChange={(e) => setFuelArm(e.target.value)} />
          </Field>
          <Field label="Pounds per gallon" hint="Avgas about 6.0, jet fuel about 6.7.">
            <Input inputMode="decimal" value={lb} onChange={(e) => setLb(e.target.value)} />
          </Field>
          <Field label="Maximum weight (lb)">
            <Input inputMode="decimal" value={maxW} onChange={(e) => setMaxW(e.target.value)} />
          </Field>
        </div>
        <Field label="Envelope" hint="One point per line, in order around the shape: CG (in), weight (lb).">
          <Textarea rows={6} value={env} onChange={(e) => setEnv(e.target.value)} />
        </Field>
      </form>
      <section className="fl-result" aria-labelledby="out" aria-live="polite">
        <h2 id="out">Result</h2>
        {error || !out ? (
          <p className="fl-muted">{error}</p>
        ) : (
          <>
            <div className="fl-readout">
              <div>
                <span className="fl-muted">Total weight</span>
                <span className="fl-big">{out.weight}</span>
                <span className="fl-mono">lb (fuel {out.fuelLb} lb)</span>
              </div>
              <div>
                <span className="fl-muted">Center of gravity</span>
                <span className="fl-big">{out.cg}</span>
                <span className="fl-mono">in, moment {out.moment}</span>
              </div>
            </div>
            {out.inside && !out.over ? <Tag tone="success">Inside the envelope you entered.</Tag> : null}
            {!out.inside ? (
              <Tag tone="danger">Outside the envelope you entered. Move weight or reduce fuel and recalculate.</Tag>
            ) : null}
            {out.over ? <Tag tone="danger">Over the maximum weight you entered.</Tag> : null}
            {plot ? (
              <svg
                className="fl-plot"
                viewBox="0 0 400 260"
                role="img"
                aria-label={`Envelope with the load at CG ${out.cg} and ${out.weight} pounds, ${out.inside ? "inside" : "outside"}`}
              >
                <path
                  d={plot.d}
                  fill="color-mix(in srgb, var(--hm-accent) 14%, transparent)"
                  stroke="var(--hm-accent)"
                  strokeWidth="1.5"
                />
                <circle
                  cx={plot.x}
                  cy={plot.y}
                  r="5"
                  fill={out.inside && !out.over ? "var(--hm-success-text)" : "var(--hm-danger)"}
                />
                <text x="30" y="252" className="fl-map__label">
                  CG (in)
                </text>
                <text x="4" y="14" className="fl-map__label">
                  lb
                </text>
              </svg>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
