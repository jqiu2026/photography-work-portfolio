import "server-only";

/**
 * Where a METAR or TAF comes from. In a production build it is NOAA's Aviation Weather Center (no key needed; one request per
 * lookup, a few seconds at most, short answers only). In development and tests it is a labeled SAMPLE so nothing leaves the
 * machine; set FLYING_WEATHER=live to use the real service while developing, or off to disable the lookup.
 * The decoder works on pasted text with no network at all.
 */
export type Weather = { icao: string; metar: string | null; taf: string | null; source: "live" | "sample" };

export const liveWeather = () =>
  process.env.FLYING_WEATHER === "live" ||
  (process.env.NODE_ENV === "production" && process.env.FLYING_WEATHER !== "off");

const SAMPLES: Record<string, { metar: string; taf: string }> = {
  KJFK: {
    metar: "METAR KJFK 271251Z 28012G22KT 10SM FEW040 BKN250 18/09 A3002 RMK AO2 SLP168",
    taf: "TAF KJFK 271130Z 2712/2818 28010KT P6SM FEW050 FM271800 30015G25KT P6SM SCT040 TEMPO 2718/2722 BKN030 PROB30 2800/2804 3SM -RA BKN020",
  },
  KBOS: {
    metar: "METAR KBOS 271254Z AUTO VRB03KT 1 1/2SM -SN BR OVC008 M02/M03 A2990 RMK AO2",
    taf: "TAF KBOS 271130Z 2712/2818 VRB04KT 2SM BR OVC008 FM271600 32008KT P6SM SCT025",
  },
};

async function get(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": "jerryqiu.com-flying-tools" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const text = (await res.text()).trim();
    return text && text.length < 6000 ? text : null;
  } catch {
    return null;
  }
}

export async function fetchWeather(icaoIn: string): Promise<Weather | { error: string }> {
  const icao = icaoIn.trim().toUpperCase();
  if (!/^[A-Z0-9]{4}$/.test(icao)) return { error: "Use a four-letter airport code, like KBOS." };
  if (process.env.FLYING_WEATHER === "off")
    return { error: "Weather lookup is switched off. Paste a METAR or TAF below." };
  if (!liveWeather()) {
    const s = SAMPLES[icao];
    if (!s)
      return {
        error: `SAMPLE mode has weather for ${Object.keys(SAMPLES).join(" and ")} only. Paste a METAR or TAF below.`,
      };
    return { icao, ...s, source: "sample" };
  }
  const [metar, taf] = await Promise.all([
    get(`https://aviationweather.gov/api/data/metar?ids=${icao}&format=raw`),
    get(`https://aviationweather.gov/api/data/taf?ids=${icao}&format=raw`),
  ]);
  if (!metar && !taf)
    return { error: `No report came back for ${icao}. Check the code, or paste a METAR or TAF below.` };
  return { icao, metar: metar?.split("\n")[0] ?? null, taf, source: "live" };
}
