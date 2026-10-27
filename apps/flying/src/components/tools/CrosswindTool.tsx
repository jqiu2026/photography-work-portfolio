"use client";

import { runwayNumber, runwayWind } from "@jerryqiu/aviation";
import { useState } from "react";
import { Field, Input, Tag } from "@/components/ui";
import { num } from "./num";

/** Headwind and crosswind for a runway. The reading is the wind's components only: what an airplane or a pilot can handle is not in here. */
export function CrosswindTool() {
  const [rwy, setRwy] = useState("27");
  const [dir, setDir] = useState("300");
  const [spd, setSpd] = useState("15");
  const [gust, setGust] = useState("");
  const [limit, setLimit] = useState("");

  const r = num(rwy);
  const d = num(dir);
  const s = num(spd);
  const g = num(gust);
  const lim = num(limit);
  const heading = r === null ? null : r <= 36 ? r * 10 : r;
  const bad =
    heading === null || d === null || s === null || heading < 10 || heading > 360 || d < 0 || d > 360 || s < 0;
  const steady = !bad ? runwayWind(d as number, s as number, heading as number) : null;
  const gusty = !bad && g !== null && g >= (s as number) ? runwayWind(d as number, g, heading as number) : null;
  const worst = gusty ?? steady;

  return (
    <div className="fl-tool">
      <form className="fl-stack" onSubmit={(e) => e.preventDefault()} aria-label="Crosswind inputs">
        <div className="fl-fields">
          <Field label="Runway" hint="Number (27) or heading (270).">
            <Input inputMode="numeric" value={rwy} onChange={(e) => setRwy(e.target.value)} />
          </Field>
          <Field label="Wind from (degrees)" hint="Same reference as the runway (magnetic).">
            <Input inputMode="numeric" value={dir} onChange={(e) => setDir(e.target.value)} />
          </Field>
          <Field label="Wind speed (knots)">
            <Input inputMode="decimal" value={spd} onChange={(e) => setSpd(e.target.value)} />
          </Field>
          <Field label="Gust (knots, optional)">
            <Input inputMode="decimal" value={gust} onChange={(e) => setGust(e.target.value)} />
          </Field>
          <Field label="My own crosswind limit (knots, optional)" hint="Your number, from you and your instructor.">
            <Input inputMode="decimal" value={limit} onChange={(e) => setLimit(e.target.value)} />
          </Field>
        </div>
      </form>
      <section className="fl-result" aria-labelledby="out" aria-live="polite">
        <h2 id="out">{heading && !bad ? `Runway ${runwayNumber(heading)}` : "Result"}</h2>
        {bad || !steady ? (
          <p className="fl-muted">Enter a runway (1 to 36), a wind direction (0 to 360) and a speed.</p>
        ) : (
          <>
            <div className="fl-readout">
              <div>
                <span className="fl-muted">{steady.tailwind > 0 ? "Tailwind" : "Headwind"}</span>
                <span className="fl-big">{steady.tailwind > 0 ? steady.tailwind : steady.headwind}</span>
                <span className="fl-mono">knots</span>
              </div>
              <div>
                <span className="fl-muted">Crosswind{steady.from !== "none" ? ` from the ${steady.from}` : ""}</span>
                <span className="fl-big">{steady.crosswind}</span>
                <span className="fl-mono">knots</span>
              </div>
            </div>
            {gusty ? (
              <p style={{ margin: 0 }}>
                In the gusts: crosswind {gusty.crosswind} knots,{" "}
                {gusty.tailwind > 0 ? `tailwind ${gusty.tailwind}` : `headwind ${gusty.headwind}`} knots.
              </p>
            ) : null}
            {steady.tailwind > 0 ? <Tag tone="warning">This is a tailwind: consider the other runway.</Tag> : null}
            {lim !== null && worst ? (
              worst.crosswind > lim ? (
                <Tag tone="danger">
                  {worst.crosswind} knots is over your {lim} knot limit.
                </Tag>
              ) : (
                <Tag tone="success">
                  {worst.crosswind} knots is within your {lim} knot limit.
                </Tag>
              )
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
