import sharp from "sharp";

/**
 * Image pipeline. Pure functions (testable without storage): validate, then derive.
 *  - Only real raster photos are accepted: JPEG, PNG, WebP, AVIF, GIF, TIFF. SVG, PDF and anything else is refused
 *    (SVG can carry script). The format comes from the decoded bytes, never from the file name or declared type.
 *  - Decompression bombs: input pixel count is capped before decoding.
 *  - Derivatives are auto-rotated, never upscaled, and carry NO GPS or personal EXIF. Only Artist and Copyright are
 *    written back so attribution survives (docs/project/11-legal-and-compliance.md).
 */
export const MAX_BYTES = 60 * 1024 * 1024;
export const MAX_PIXELS = 150_000_000;
export const WIDTHS = [480, 960, 1600, 2400] as const;
export const FORMATS = ["avif", "webp"] as const;
const ALLOWED = new Set(["jpeg", "png", "webp", "avif", "gif", "tiff"]);

export class ImageError extends Error {}

export type Derivative = { width: number; format: (typeof FORMATS)[number]; buffer: Buffer; bytes: number };
export type Processed = {
  format: string;
  width: number;
  height: number;
  color: string;
  blur: string;
  phash: string;
  exif: Record<string, string | number>;
  derivatives: Derivative[];
};

export async function validateImage(buf: Buffer): Promise<{ format: string; width: number; height: number }> {
  if (buf.length === 0) throw new ImageError("The file is empty.");
  if (buf.length > MAX_BYTES) throw new ImageError(`The file is larger than ${MAX_BYTES / 1024 / 1024} MB.`);
  let meta: Awaited<ReturnType<ReturnType<typeof sharp>["metadata"]>>;
  try {
    meta = await sharp(buf, { limitInputPixels: MAX_PIXELS, failOn: "error" }).metadata();
  } catch {
    throw new ImageError("That file isn't a readable image, or it is too large to process safely.");
  }
  if (!meta.format || !ALLOWED.has(meta.format))
    throw new ImageError("Only JPEG, PNG, WebP, AVIF, GIF and TIFF images are allowed.");
  const swap = (meta.orientation ?? 1) >= 5;
  const width = (swap ? meta.height : meta.width) ?? 0;
  const height = (swap ? meta.width : meta.height) ?? 0;
  if (width < 16 || height < 16) throw new ImageError("The image is too small.");
  if (width * height > MAX_PIXELS) throw new ImageError("The image has too many pixels.");
  return { format: meta.format, width, height };
}

/** 64-bit difference hash as 16 hex chars: similar pictures differ by only a few bits. */
export async function dHash(buf: Buffer): Promise<string> {
  const { data } = await sharp(buf, { limitInputPixels: MAX_PIXELS })
    .rotate()
    .greyscale()
    .resize(9, 8, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  let bits = 0n;
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++) bits = (bits << 1n) | (data[y * 9 + x] > data[y * 9 + x + 1] ? 1n : 0n);
  return bits.toString(16).padStart(16, "0");
}

export function hamming(a: string, b: string): number {
  let x = BigInt(`0x${a}`) ^ BigInt(`0x${b}`);
  let n = 0;
  while (x) {
    n += Number(x & 1n);
    x >>= 1n;
  }
  return n;
}

/** Camera facts that are safe and useful to show the owner in the admin (never GPS, never owner or serial numbers). */
async function readExif(buf: Buffer): Promise<Record<string, string | number>> {
  try {
    const exifr = (await import("exifr")).default;
    const t =
      (await exifr.parse(buf, {
        pick: ["Make", "Model", "LensModel", "FNumber", "ExposureTime", "ISO", "FocalLength", "DateTimeOriginal"],
      })) ?? {};
    const out: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(t)) {
      if (v == null) continue;
      out[k] = v instanceof Date ? v.toISOString() : typeof v === "number" || typeof v === "string" ? v : String(v);
    }
    return out;
  } catch {
    return {};
  }
}

export async function processImage(buf: Buffer, opts: { owner?: string } = {}): Promise<Processed> {
  const info = await validateImage(buf);
  const base = () => sharp(buf, { limitInputPixels: MAX_PIXELS, failOn: "error", animated: false }).rotate();
  const exif = await readExif(buf);

  const stats = await base().resize(16, 16, { fit: "cover" }).stats();
  const [r, g, b] = stats.channels.map((c) => Math.round(c.mean));
  const blurBuf = await base().resize(16).webp({ quality: 40 }).toBuffer();
  const attribution = {
    IFD0: {
      Artist: opts.owner ?? "Jerry Qiu",
      Copyright: `© ${new Date().getFullYear()} ${opts.owner ?? "Jerry Qiu"}. All rights reserved.`,
    },
  };

  const derivatives: Derivative[] = [];
  const widths = WIDTHS.filter((w) => w < info.width);
  if (!widths.length || info.width <= WIDTHS[0]) widths.push(Math.min(info.width, WIDTHS[0]) as never);
  for (const width of [...new Set(widths)]) {
    for (const format of FORMATS) {
      const pipe = base().resize({ width, withoutEnlargement: true }).withExif(attribution);
      const buffer =
        format === "avif"
          ? await pipe.avif({ quality: 55, effort: 3 }).toBuffer()
          : await pipe.webp({ quality: 80, effort: 4 }).toBuffer();
      derivatives.push({ width, format, buffer, bytes: buffer.length });
    }
  }
  return {
    format: info.format,
    width: info.width,
    height: info.height,
    color: `rgb(${r}, ${g}, ${b})`,
    blur: `data:image/webp;base64,${blurBuf.toString("base64")}`,
    phash: await dHash(buf),
    exif,
    derivatives,
  };
}

export const contentTypeFor = (format: string) =>
  format === "avif" ? "image/avif" : format === "webp" ? "image/webp" : "image/jpeg";
export const safeName = (name: string) =>
  name
    .normalize("NFKD")
    .replace(/[^\w.\- ]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(-80) || "image";
