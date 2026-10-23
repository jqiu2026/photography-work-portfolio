/**
 * Exposure settings shown beside a photograph: focal length, aperture, shutter speed, ISO and the day. They come from
 * the file's own metadata when it has any. Deliberately NOT here, and never sent to a browser: the camera body, the
 * lens, serial numbers, GPS, and the image's resolution, so what the photographer owns and how big the files are stay
 * private. Pure functions so they are unit-tested.
 */
export type PhotoSpecs = {
  /** Focal length in millimetres. */
  focal?: number;
  /** f-number, e.g. 1.8. */
  aperture?: number;
  /** Exposure time in seconds, e.g. 0.004 for 1/250. */
  shutter?: number;
  iso?: number;
  /** ISO date (day) the photograph was taken. */
  taken?: string;
};

const num = (v: unknown) => {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : Number.NaN;
  return Number.isFinite(n) && n > 0 ? n : undefined;
};
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);

/** The raw EXIF object from the media table (or the optimize script) as display-ready specs, or undefined if empty. */
export function specsFromExif(exif: Record<string, unknown> | null | undefined): PhotoSpecs | undefined {
  if (!exif) return undefined;
  const taken = str(exif.DateTimeOriginal)?.slice(0, 10);
  const out: PhotoSpecs = {
    focal: num(exif.FocalLength),
    aperture: num(exif.FNumber),
    shutter: num(exif.ExposureTime),
    iso: num(exif.ISO),
    taken: taken && /^\d{4}-\d{2}-\d{2}$/.test(taken) ? taken : undefined,
  };
  return Object.values(out).some((v) => v !== undefined) ? out : undefined;
}

/** 0.004 as "1/250 s", 2 as "2 s", 0.5 as "1/2 s". */
export function formatShutter(seconds: number): string {
  if (seconds >= 1) return `${Number.isInteger(seconds) ? seconds : seconds.toFixed(1)} s`;
  return `1/${Math.round(1 / seconds)} s`;
}

/** The exposure facts as short labeled pairs, in the order a photographer reads them. */
export function specLines(s: PhotoSpecs | undefined): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = [];
  if (!s) return out;
  if (s.focal) out.push({ label: "Focal length", value: `${Math.round(s.focal)} mm` });
  if (s.aperture)
    out.push({ label: "Aperture", value: `f/${Number.isInteger(s.aperture) ? s.aperture : s.aperture.toFixed(1)}` });
  if (s.shutter) out.push({ label: "Shutter", value: formatShutter(s.shutter) });
  if (s.iso) out.push({ label: "ISO", value: String(Math.round(s.iso)) });
  if (s.taken) {
    const [y, m, d] = s.taken.split("-").map(Number);
    out.push({
      label: "Taken",
      value: new Date(y as number, (m as number) - 1, d).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    });
  }
  return out;
}

/** One line for a tile: "50 mm · f/1.8 · 1/250 s · ISO 400". */
export function specSummary(s: PhotoSpecs | undefined): string {
  const l = specLines(s).filter((x) => ["Focal length", "Aperture", "Shutter", "ISO"].includes(x.label));
  return l.map((x) => (x.label === "ISO" ? `ISO ${x.value}` : x.value)).join(" · ");
}
