"use client";

import { type Airport, type Flight, routePoints } from "@jerryqiu/aviation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui";
import land from "./land.json";

/**
 * Map of past flights. Land outline: Natural Earth 110m (public domain), drawn with our own projection: no tiles, no
 * third-party requests, no keys. Airport level, month precision, never live. Keyboard: arrow keys pan, + and - zoom. A table
 * with the same flights is under the map.
 */
const W = 1000;
const H = 560;
type View = { lon: number; lat: number; zoom: number };
const START: View = { lon: -97, lat: 38, zoom: 1 };

// An equirectangular projection scaled by cos(lat0) keeps shapes honest at this scale.
function project(lon: number, lat: number, v: View) {
  const k = 11 * v.zoom;
  const cos = Math.cos((v.lat * Math.PI) / 180);
  return [W / 2 + (lon - v.lon) * k * cos, H / 2 - (lat - v.lat) * k] as const;
}

export function FlightMap({ airports, flights, sample }: { airports: Airport[]; flights: Flight[]; sample?: boolean }) {
  const [view, setView] = useState<View>(START);
  const [sel, setSel] = useState<string | null>(null);
  const byCode = useMemo(() => Object.fromEntries(airports.map((a) => [a.code, a])), [airports]);

  const landPath = useMemo(
    () =>
      (land as number[][][])
        .map((ring) => {
          const pts = ring.map(([lo, la]) => project(lo, la, view));
          if (!pts.some(([x, y]) => x > -200 && x < W + 200 && y > -200 && y < H + 200)) return "";
          return `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}Z`;
        })
        .join(""),
    [view],
  );

  const routes = flights
    .map((f) => {
      const a = byCode[f.from];
      const b = byCode[f.to];
      if (!a || !b || a.code === b.code) return null;
      const pts = routePoints(a, b, 40).map(([la, lo]) => project(lo, la, view));
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
    <div className="fl-stack">
      <div className="fl-row" role="group" aria-label="Map controls">
        <Button type="button" variant="secondary" size="sm" onClick={() => zoom(1.3)} aria-label="Zoom in">
          +
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => zoom(1 / 1.3)} aria-label="Zoom out">
          −
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setView(START)}>
          Reset
        </Button>
        <span className="fl-muted">Arrow keys move the map, plus and minus zoom.</span>
      </div>
      <svg
        className="fl-map"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Map of ${sample ? "sample " : ""}flight routes between ${used.size} airports`}
        tabIndex={0}
        onKeyDown={onKey}
      >
        <title>Flights, airport level, shown with a delay</title>
        <path className="fl-map__land" d={landPath} />
        {routes.map(({ f, d }) => (
          <path key={f.id} d={d} className="fl-map__route" data-on={sel === f.id} />
        ))}
        {airports
          .filter((a) => used.has(a.code))
          .map((a) => {
            const [x, y] = project(a.lon, a.lat, view);
            return (
              <g key={a.code} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
                <circle r={4} className="fl-map__pt" />
                <text x={8} y={4} className="fl-map__label">
                  {a.code}
                </text>
              </g>
            );
          })}
      </svg>
      <table className="fl-table">
        <caption className="fl-sr">Flights, month precision, published at least 7 days after landing</caption>
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
            <tr key={f.id} onMouseEnter={() => setSel(f.id)} onMouseLeave={() => setSel(null)}>
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
