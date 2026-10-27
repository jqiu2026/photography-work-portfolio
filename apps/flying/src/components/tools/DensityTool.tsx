"use client";

import {
  cToF,
  densityAltitude,
  fToC,
  inHgToHpa,
  hpaToInHg,
  isaTemperatureC,
  pressureAltitude,
} from "@jerryqiu/aviation";
import { useState } from "react";
import { Field, Input, Select } from "@/components/ui";
import { num } from "./num";

export function DensityTool() {
  const [elev, setElev] = useState("0");
  const [alt, setAlt] = useState("29.92");
  const [altUnit, setAltUnit] = useState("inhg");
  const [oat, setOat] = useState("15");
  const [tUnit, setTUnit] = useState("c");

  const e = num(elev);
  const a = num(alt);
  const t = num(oat);
  const inHg = a === null ? null : altUnit === "inhg" ? a : hpaToInHg(a);
  const tc = t === null ? null : tUnit === "c" ? t : fToC(t);
  const ok = e !== null && inHg !== null && tc !== null && inHg > 25 && inHg < 32;
  const pa = ok ? pressureAltitude(e as number, inHg as number) : null;
  const da = ok && pa !== null ? densityAltitude(pa, tc as number) : null;

  return (
    <div className="fl-tool">
      <form className="fl-stack" onSubmit={(e2) => e2.preventDefault()} aria-label="Density altitude inputs">
        <div className="fl-fields">
          <Field label="Field elevation (feet)">
            <Input inputMode="numeric" value={elev} onChange={(x) => setElev(x.target.value)} />
          </Field>
          <Field label="Altimeter setting">
            <Input inputMode="decimal" value={alt} onChange={(x) => setAlt(x.target.value)} />
          </Field>
          <Field label="Altimeter unit">
            <Select
              value={altUnit}
              onValueChange={(v) => {
                setAltUnit(v);
                setAlt(v === "inhg" ? "29.92" : "1013");
              }}
              options={[
                { value: "inhg", label: "inHg (29.92)" },
                { value: "hpa", label: "hPa (1013)" },
              ]}
            />
          </Field>
          <Field label="Outside air temperature">
            <Input inputMode="decimal" value={oat} onChange={(x) => setOat(x.target.value)} />
          </Field>
          <Field label="Temperature unit">
            <Select
              value={tUnit}
              onValueChange={(v) => {
                setTUnit(v);
                setOat(v === "c" ? "15" : "59");
              }}
              options={[
                { value: "c", label: "Celsius" },
                { value: "f", label: "Fahrenheit" },
              ]}
            />
          </Field>
        </div>
      </form>
      <section className="fl-result" aria-labelledby="out" aria-live="polite">
        <h2 id="out">Result</h2>
        {!da || pa === null ? (
          <p className="fl-muted">
            Enter the elevation, the altimeter setting (28 to 31 inHg, or the hPa equivalent) and the temperature.
          </p>
        ) : (
          <>
            <div className="fl-readout">
              <div>
                <span className="fl-muted">Density altitude</span>
                <span className="fl-big">{da.densityAltitudeFt.toLocaleString("en-US")}</span>
                <span className="fl-mono">feet</span>
              </div>
              <div>
                <span className="fl-muted">Pressure altitude</span>
                <span className="fl-big">{pa.toLocaleString("en-US")}</span>
                <span className="fl-mono">feet</span>
              </div>
            </div>
            <p style={{ margin: 0 }}>
              Standard temperature at that pressure altitude is {isaTemperatureC(pa)}°C ({cToF(isaTemperatureC(pa))}°F).
              It is {Math.abs(da.deviationC)}°C {da.deviationC >= 0 ? "above" : "below"} standard.
              {da.densityAltitudeFt > (e as number) + 2000
                ? " The air is thin: the airplane behaves as if the airport were higher. Takeoff roll, climb and landing roll all get longer."
                : ""}
            </p>
            <p className="fl-muted" style={{ margin: 0 }}>
              Altimeter {inHg?.toFixed(2)} inHg ({inHgToHpa(inHg as number)} hPa). The rule of thumb used is 118.8 feet
              for every °C from standard; it is an estimate.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
