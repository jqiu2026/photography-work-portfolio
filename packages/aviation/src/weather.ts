/**
 * METAR and TAF decoding for learning: reads the raw text a pilot would see and says what it means in plain words. It
 * decodes what it understands and lists what it does not, rather than guessing. It is not a weather briefing.
 */
export type Category = "VFR" | "MVFR" | "IFR" | "LIFR";

export type SkyLayer = { cover: "FEW" | "SCT" | "BKN" | "OVC" | "VV"; baseFt: number; type?: "CB" | "TCU" };
export type WindObs = {
  dir: number | "VRB" | null;
  speed: number;
  gust?: number;
  variable?: [number, number];
  calm: boolean;
};

export type Conditions = {
  wind?: WindObs;
  visibilitySm?: number;
  visibilityPlus?: boolean;
  weather: string[];
  sky: SkyLayer[];
  /** CAVOK, CLR, SKC and the like: no cloud to report */
  clear?: boolean;
  ceilingFt?: number;
  category?: Category;
  unknown: string[];
};

const COVER_WORDS: Record<string, string> = {
  FEW: "few clouds",
  SCT: "scattered clouds",
  BKN: "broken clouds",
  OVC: "overcast",
  VV: "sky obscured, vertical visibility",
};
const WX: Record<string, string> = {
  MI: "shallow",
  PR: "partial",
  BC: "patches of",
  DR: "low drifting",
  BL: "blowing",
  SH: "showers of",
  TS: "thunderstorm with",
  FZ: "freezing",
  DZ: "drizzle",
  RA: "rain",
  SN: "snow",
  SG: "snow grains",
  IC: "ice crystals",
  PL: "ice pellets",
  GR: "hail",
  GS: "small hail",
  UP: "unknown precipitation",
  BR: "mist",
  FG: "fog",
  FU: "smoke",
  VA: "volcanic ash",
  DU: "dust",
  SA: "sand",
  HZ: "haze",
  PY: "spray",
  PO: "dust whirls",
  SQ: "squalls",
  FC: "funnel cloud",
  SS: "sandstorm",
  DS: "duststorm",
};

const WIND = /^(\d{3}|VRB)(\d{2,3})(?:G(\d{2,3}))?KT$/;
const WIND_VAR = /^(\d{3})V(\d{3})$/;
const VIS_SM = /^([PM])?(\d+)(?:\/(\d+))?SM$/;
const SKY = /^(FEW|SCT|BKN|OVC)(\d{3})(CB|TCU)?$/;
const VV = /^VV(\d{3})$/;
const PHENOM =
  /^([-+])?(VC)?((?:MI|PR|BC|DR|BL|SH|TS|FZ)?(?:DZ|RA|SN|SG|IC|PL|GR|GS|UP|BR|FG|FU|VA|DU|SA|HZ|PY|PO|SQ|FC|SS|DS)+|TS|SH|FZ)$/;

export function describeWeatherToken(t: string): string | null {
  const m = PHENOM.exec(t);
  if (!m) return null;
  const [, intensity, vc, body] = m;
  const parts: string[] = [];
  for (let i = 0; i < body.length; i += 2) {
    const w = WX[body.slice(i, i + 2)];
    if (!w) return null;
    parts.push(w);
  }
  const lead = intensity === "-" ? "light " : intensity === "+" ? "heavy " : "";
  return `${vc ? "nearby: " : ""}${lead}${parts.join(" ")}`.trim();
}

/** Flight category from ceiling (feet, lowest broken, overcast or vertical visibility) and visibility (statute miles). */
export function flightCategory(ceilingFt: number | undefined, visibilitySm: number | undefined): Category | undefined {
  if (ceilingFt === undefined && visibilitySm === undefined) return undefined;
  const c = ceilingFt ?? Number.POSITIVE_INFINITY;
  const v = visibilitySm ?? Number.POSITIVE_INFINITY;
  if (c < 500 || v < 1) return "LIFR";
  if (c < 1000 || v < 3) return "IFR";
  if (c <= 3000 || v <= 5) return "MVFR";
  return "VFR";
}

/** Reads group tokens (wind, visibility, weather, sky) into conditions. Tokens it does not know are returned in `unknown`. */
export function parseConditions(tokens: string[]): Conditions {
  const c: Conditions = { weather: [], sky: [], unknown: [] };
  let whole: number | undefined;
  for (const t of tokens) {
    let m: RegExpExecArray | null;
    if ((m = WIND.exec(t))) {
      const speed = Number(m[2]);
      c.wind = {
        dir: m[1] === "VRB" ? "VRB" : Number(m[1]),
        speed,
        gust: m[3] ? Number(m[3]) : undefined,
        calm: speed === 0,
      };
    } else if ((m = WIND_VAR.exec(t))) {
      if (c.wind) c.wind.variable = [Number(m[1]), Number(m[2])];
    } else if (t === "00000KT") c.wind = { dir: null, speed: 0, calm: true };
    else if (/^\d$/.test(t) && !c.visibilitySm) whole = Number(t);
    else if ((m = VIS_SM.exec(t))) {
      const frac = m[3] ? Number(m[2]) / Number(m[3]) : Number(m[2]);
      c.visibilitySm = (whole ?? 0) + frac;
      c.visibilityPlus = m[1] === "P";
      whole = undefined;
    } else if (t === "CAVOK") {
      c.visibilitySm = 10;
      c.visibilityPlus = true;
      c.clear = true;
    } else if (/^\d{4}$/.test(t) && !c.visibilitySm) {
      const meters = Number(t);
      c.visibilitySm = Math.round((meters / 1609.34) * 10) / 10;
      c.visibilityPlus = meters >= 9999;
    } else if ((m = SKY.exec(t)))
      c.sky.push({ cover: m[1] as SkyLayer["cover"], baseFt: Number(m[2]) * 100, type: m[3] as SkyLayer["type"] });
    else if ((m = VV.exec(t))) c.sky.push({ cover: "VV", baseFt: Number(m[1]) * 100 });
    else if (["SKC", "CLR", "NSC", "NCD"].includes(t)) c.clear = true;
    else {
      const w = describeWeatherToken(t);
      if (w) c.weather.push(w);
      else c.unknown.push(t);
    }
  }
  const ceilings = c.sky.filter((s) => s.cover === "BKN" || s.cover === "OVC" || s.cover === "VV").map((s) => s.baseFt);
  if (ceilings.length) c.ceilingFt = Math.min(...ceilings);
  c.category = flightCategory(c.ceilingFt, c.visibilitySm);
  return c;
}

const ft = (n: number) => `${n.toLocaleString("en-US")} ft`;

/** Plain-language sentences for conditions. */
export function describeConditions(c: Conditions): string[] {
  const out: string[] = [];
  if (c.wind) {
    const w = c.wind;
    if (w.calm) out.push("Wind: calm.");
    else {
      const dir = w.dir === "VRB" ? "variable direction" : `from ${String(w.dir).padStart(3, "0")}°`;
      out.push(
        `Wind: ${dir} at ${w.speed} knots${w.gust ? `, gusting ${w.gust}` : ""}${w.variable ? `, varying between ${w.variable[0]}° and ${w.variable[1]}°` : ""}.`,
      );
    }
  }
  if (c.visibilitySm !== undefined)
    out.push(`Visibility: ${c.visibilityPlus ? "more than " : ""}${c.visibilitySm} statute miles.`);
  for (const w of c.weather) out.push(`Weather: ${w}.`);
  if (c.clear && !c.sky.length) out.push("Sky: clear, no clouds to report.");
  for (const s of c.sky)
    out.push(
      `Sky: ${COVER_WORDS[s.cover]} at ${ft(s.baseFt)}${s.type === "CB" ? " (cumulonimbus)" : s.type === "TCU" ? " (towering cumulus)" : ""}.`,
    );
  if (c.ceilingFt !== undefined) out.push(`Ceiling: ${ft(c.ceilingFt)}.`);
  if (c.category) out.push(`Flight category: ${c.category}.`);
  return out;
}

/* ---------- METAR ---------- */
export type Metar = {
  raw: string;
  type: "METAR" | "SPECI";
  station?: string;
  day?: number;
  hour?: number;
  minute?: number;
  auto: boolean;
  corrected: boolean;
  conditions: Conditions;
  temperatureC?: number;
  dewpointC?: number;
  spreadC?: number;
  altimeterInHg?: number;
  altimeterHpa?: number;
  remarks?: string;
};

const temp = (s: string) => (s.startsWith("M") ? -Number(s.slice(1)) : Number(s));

export function parseMetar(rawIn: string): Metar {
  const raw = rawIn.replace(/\s+/g, " ").trim().replace(/=$/, "");
  if (!raw) throw new Error("Paste a METAR first.");
  const rmkAt = raw.indexOf(" RMK ");
  const body = (rmkAt >= 0 ? raw.slice(0, rmkAt) : raw).split(" ");
  const remarks = rmkAt >= 0 ? raw.slice(rmkAt + 5) : undefined;
  const r: Metar = {
    raw,
    type: "METAR",
    auto: false,
    corrected: false,
    conditions: { weather: [], sky: [], unknown: [] },
    remarks,
  };
  const rest: string[] = [];
  for (const t of body) {
    let m: RegExpExecArray | null;
    if (t === "METAR" || t === "SPECI") r.type = t;
    else if (t === "AUTO") r.auto = true;
    else if (t === "COR") r.corrected = true;
    else if (!r.station && /^[A-Z][A-Z0-9]{3}$/.test(t) && r.day === undefined) r.station = t;
    else if ((m = /^(\d{2})(\d{2})(\d{2})Z$/.exec(t)))
      [r.day, r.hour, r.minute] = [Number(m[1]), Number(m[2]), Number(m[3])];
    else if ((m = /^(M?\d{2})\/(M?\d{2})?$/.exec(t))) {
      r.temperatureC = temp(m[1]);
      if (m[2]) {
        r.dewpointC = temp(m[2]);
        r.spreadC = r.temperatureC - r.dewpointC;
      }
    } else if ((m = /^A(\d{4})$/.exec(t))) r.altimeterInHg = Number(m[1]) / 100;
    else if ((m = /^Q(\d{4})$/.exec(t))) {
      r.altimeterHpa = Number(m[1]);
      r.altimeterInHg = Math.round(Number(m[1]) * 0.02953 * 100) / 100;
    } else rest.push(t);
  }
  if (r.altimeterInHg !== undefined && r.altimeterHpa === undefined)
    r.altimeterHpa = Math.round(r.altimeterInHg / 0.02953);
  r.conditions = parseConditions(rest);
  return r;
}

export function describeMetar(m: Metar): string[] {
  const out: string[] = [];
  if (m.station)
    out.push(
      `Station ${m.station}${m.day !== undefined ? `, day ${m.day} at ${String(m.hour).padStart(2, "0")}${String(m.minute).padStart(2, "0")} UTC` : ""}${m.auto ? ", automated report" : ""}${m.corrected ? ", corrected" : ""}.`,
    );
  out.push(...describeConditions(m.conditions));
  if (m.temperatureC !== undefined)
    out.push(
      `Temperature ${m.temperatureC}°C${m.dewpointC !== undefined ? `, dew point ${m.dewpointC}°C (spread ${m.spreadC}°C)` : ""}.`,
    );
  if (m.spreadC !== undefined && m.spreadC <= 3 && !m.conditions.weather.some((w) => w.includes("fog")))
    out.push("The temperature and dew point are close: fog or low cloud can form.");
  if (m.altimeterInHg !== undefined) out.push(`Altimeter ${m.altimeterInHg.toFixed(2)} inHg (${m.altimeterHpa} hPa).`);
  if (m.conditions.unknown.length) out.push(`Not decoded: ${m.conditions.unknown.join(" ")}.`);
  return out;
}

/* ---------- TAF ---------- */
export type TafPeriod = {
  kind: "BASE" | "FM" | "TEMPO" | "BECMG" | "PROB";
  prob?: number;
  /** the raw period text, for example "2718/2722" or "271800" */
  when?: string;
  conditions: Conditions;
};
export type Taf = {
  raw: string;
  station?: string;
  issued?: string;
  valid?: string;
  amended: boolean;
  periods: TafPeriod[];
};

export function parseTaf(rawIn: string): Taf {
  const raw = rawIn.replace(/\s+/g, " ").trim().replace(/=$/, "");
  if (!raw) throw new Error("Paste a TAF first.");
  const tokens = raw.split(" ");
  const taf: Taf = { raw, amended: false, periods: [] };
  let i = 0;
  if (tokens[i] === "TAF") i++;
  if (tokens[i] === "AMD" || tokens[i] === "COR") taf.amended = tokens[i++] === "AMD";
  if (/^[A-Z][A-Z0-9]{3}$/.test(tokens[i] ?? "")) taf.station = tokens[i++];
  if (/^\d{6}Z$/.test(tokens[i] ?? "")) taf.issued = tokens[i++];
  if (/^\d{4}\/\d{4}$/.test(tokens[i] ?? "")) taf.valid = tokens[i++];
  let cur: { kind: TafPeriod["kind"]; prob?: number; when?: string; toks: string[] } = { kind: "BASE", toks: [] };
  const flush = () => {
    taf.periods.push({ kind: cur.kind, prob: cur.prob, when: cur.when, conditions: parseConditions(cur.toks) });
  };
  for (; i < tokens.length; i++) {
    const t = tokens[i];
    let m: RegExpExecArray | null;
    if ((m = /^FM(\d{6})$/.exec(t))) {
      flush();
      cur = { kind: "FM", when: m[1], toks: [] };
    } else if (t === "TEMPO" || t === "BECMG") {
      flush();
      cur = { kind: t, toks: [] };
      if (/^\d{4}\/\d{4}$/.test(tokens[i + 1] ?? "")) cur.when = tokens[++i];
    } else if ((m = /^PROB(\d{2})$/.exec(t))) {
      flush();
      cur = { kind: "PROB", prob: Number(m[1]), toks: [] };
      if (tokens[i + 1] === "TEMPO") i++;
      if (/^\d{4}\/\d{4}$/.test(tokens[i + 1] ?? "")) cur.when = tokens[++i];
    } else cur.toks.push(t);
  }
  flush();
  return taf;
}

export function describePeriod(p: TafPeriod): string {
  const head =
    p.kind === "BASE"
      ? "At first"
      : p.kind === "FM"
        ? `From day ${p.when?.slice(0, 2)} at ${p.when?.slice(2, 4)}${p.when?.slice(4, 6)} UTC`
        : `${p.kind === "TEMPO" ? "Temporarily" : p.kind === "BECMG" ? "Becoming" : `${p.prob}% chance`}${p.when ? ` (${p.when})` : ""}`;
  return `${head}: ${describeConditions(p.conditions).join(" ")}`;
}
