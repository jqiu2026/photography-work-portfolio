"use client";

import { greatCircle, type Airport, type Flight } from "@jerryqiu/mocks";
import { useMemo, useState } from "react";
import land from "./land.json";

/**
 * Map of past flights. Land outline: Natural Earth 110m (public domain), drawn with our own projection: no tiles, no
 * third-party requests, no keys. Airport level, month precision, never live. Keyboard: arrow keys pan, + and - zoom.
 * An accessible table lists the same flights.
 */
const W = 1000;
const H = 560;
type View = { lon: number; lat: number; zoom: number };
const START: View = { lon: -97, lat: 38, zoom: 1 };

// Lambert-ish simple conic is overkill; an equirectangular projection scaled by cos(lat0) keeps shapes honest at this scale.
function project(lon: number, lat: number, v: View) {
  const k = 11 * v.zoom;
  const cos = Math.cos((v.lat * Math.PI) / 180);
  return [W / 2 + (lon - v.lon) * k * cos, H / 2 - (lat - v.lat) * k] as const;
}

export function FlightMap({ airports, flights }: { airports: Airport[]; flights: Flight[] }) {
  const [view, setView] = useState<View>(START);
  const [sel, setSel] = useState<string | null>(null);
  const byCode = useMemo(() => Object.fromEntries(airports.map((a) => [a.code, a])), [airports]);

  const landPath = useMemo(() => {
    return (land as number[][][])
      .map((ring) => {
        const pts = ring.map(([lo, la]) => project(lo, la, view));
        // skip rings entirely outside the viewport (cheap cull)
        if (!pts.some(([x, y]) => x > -200 && x < W + 200 && y > -200 && y < H + 200)) return "";
        return `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}Z`;
      })
      .join("");
  }, [view]);

  const routes = flights
    .map((f) => {
      const a = byCode[f.from];
      const b = byCode[f.to];
      if (!a || !b) return null;
      const pts = greatCircle(a, b, 40).map(([la, lo]) => project(lo, la, view));
      return { f, d: `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}` };
    })
    .filter((r): r is { f: Flight; d: string } => !!r);
  const used = new Set(flights.flatMap((f) => [f.from, f.to]));

  const pan = (dx: number, dy: number) =>
    setView((v) => ({ ...v, lon: v.lon + dx / v.zoom, lat: v.lat + dy / v.zoom }));
  const zoom = (z: number) => setView((v) => ({ ...v, zoom: Math.min(6, Math.max(0.6, v.zoom * z)) }));
  const onKey = (e: React.KeyboardEvent) => {
    const step = 4;
    if (e.key === "ArrowLeft") pan(-step, 0);
    else if (e.key === "ArrowRight") pan(step, 0);
    else if (e.key === "ArrowUp") pan(0, step);
    else if (e.key === "ArrowDown") pan(0, -step);
    else if (e.key === "+" || e.key === "=") zoom(1.3);
    else if (e.key === "-") zoom(1 / 1.3);
    else return;
    e.preventDefault();
  };

  return (
    <div className="fm">
      <div className="fm__controls" role="group" aria-label="Map controls">
        <button type="button" onClick={() => zoom(1.3)} aria-label="Zoom in">
          +
        </button>
        <button type="button" onClick={() => zoom(1 / 1.3)} aria-label="Zoom out">
          −
        </button>
        <button type="button" onClick={() => setView(START)}>
          Reset
        </button>
      </div>
      <svg
        className="fm__svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Map of sample flight routes between airports"
        tabIndex={0}
        onKeyDown={onKey}
      >
        <title>Sample flights, airport level, shown with a delay</title>
        <path className="fm__land" d={landPath} />
        {routes.map(({ f, d }) => (
          <path key={f.id} d={d} className="fm__route" data-active={sel === f.id || undefined} pathLength={1} />
        ))}
        {airports
          .filter((a) => used.has(a.code))
          .map((a) => {
            const [x, y] = project(a.lon, a.lat, view);
            return (
              <g key={a.code} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
                <circle r={4} className="fm__dot" />
                <text x={8} y={4} className="fm__code">
                  {a.code}
                </text>
              </g>
            );
          })}
      </svg>
      <table className="fm__table">
        <caption>Flights (sample data, month precision, published at least 7 days after landing)</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">From</th>
            <th scope="col">To</th>
            <th scope="col">Aircraft</th>
            <th scope="col">Note</th>
          </tr>
        </thead>
        <tbody>
          {flights.map((f) => (
            <tr
              key={f.id}
              onMouseEnter={() => setSel(f.id)}
              onMouseLeave={() => setSel(null)}
              data-active={sel === f.id || undefined}
            >
              <td>{f.month}</td>
              <td>{f.from}</td>
              <td>{f.to}</td>
              <td>{f.aircraft}</td>
              <td>{f.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
