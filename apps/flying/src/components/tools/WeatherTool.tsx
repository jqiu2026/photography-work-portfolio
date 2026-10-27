"use client";

import { type Metar, type Taf, describeMetar, describePeriod, parseMetar, parseTaf } from "@jerryqiu/aviation";
import { useState, useTransition } from "react";
import { lookupWeather } from "@/app/(site)/tools/weather/actions";
import { Button, Field, FormMessage, Input, Textarea } from "@/components/ui";

function Cat({ c }: { c?: string }) {
  return c ? (
    <span className="fl-cat" data-cat={c}>
      {c}
    </span>
  ) : null;
}

/** Decodes a METAR or TAF into plain words. Paste one, or look one up by airport code. */
export function WeatherTool() {
  const [icao, setIcao] = useState("");
  const [metarText, setMetarText] = useState("");
  const [tafText, setTafText] = useState("");
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  let metar: Metar | null = null;
  let taf: Taf | null = null;
  let metarErr = "";
  let tafErr = "";
  if (metarText.trim()) {
    try {
      metar = parseMetar(metarText);
    } catch (e) {
      metarErr = (e as Error).message;
    }
  }
  if (tafText.trim()) {
    try {
      taf = parseTaf(tafText);
    } catch (e) {
      tafErr = (e as Error).message;
    }
  }

  return (
    <div className="fl-stack">
      <form
        className="fl-row"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const r = await lookupWeather(icao);
            if ("error" in r) return setNote({ ok: false, text: r.error });
            setMetarText(r.metar ?? "");
            setTafText(r.taf ?? "");
            setNote({
              ok: true,
              text:
                r.source === "sample"
                  ? `SAMPLE weather for ${r.icao}: not real, for trying the decoder.`
                  : `Latest reports for ${r.icao} from NOAA Aviation Weather Center.`,
            });
          });
        }}
        aria-label="Look up an airport"
      >
        <Field label="Airport code" hint="For example KBOS.">
          <Input
            value={icao}
            onChange={(e) => setIcao(e.target.value.toUpperCase())}
            maxLength={4}
            autoCapitalize="characters"
          />
        </Field>
        <Button type="submit" loading={pending} disabled={icao.length !== 4}>
          Look up
        </Button>
      </form>
      {note ? <FormMessage ok={note.ok}>{note.text}</FormMessage> : null}

      <div className="fl-tool">
        <div className="fl-stack">
          <Field label="METAR" hint="Paste the raw report.">
            <Textarea rows={3} value={metarText} onChange={(e) => setMetarText(e.target.value)} spellCheck={false} />
          </Field>
          {metarErr ? <FormMessage>{metarErr}</FormMessage> : null}
          {metar ? (
            <section className="fl-result" aria-labelledby="m">
              <h2 id="m">
                What it says <Cat c={metar.conditions.category} />
              </h2>
              <ul className="fl-says">
                {describeMetar(metar).map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
        <div className="fl-stack">
          <Field label="TAF" hint="Paste the raw forecast.">
            <Textarea rows={3} value={tafText} onChange={(e) => setTafText(e.target.value)} spellCheck={false} />
          </Field>
          {tafErr ? <FormMessage>{tafErr}</FormMessage> : null}
          {taf ? (
            <section className="fl-result" aria-labelledby="t">
              <h2 id="t">
                {taf.station ? `${taf.station} forecast` : "Forecast"}
                {taf.valid ? <span className="fl-mono"> valid {taf.valid}</span> : null}
              </h2>
              <ul className="fl-says">
                {taf.periods.map((p, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: periods are positional
                  <li key={i}>
                    {describePeriod(p)} <Cat c={p.conditions.category} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
