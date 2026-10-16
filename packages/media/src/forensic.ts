import { createHash } from "node:crypto";
import sharp from "sharp";

/**
 * Invisible per-viewer watermark for client-gallery derivatives. A 32-bit code (derived from the viewer id) is spread over
 * the picture as low-amplitude pseudo-random noise: every pixel belongs to one of 32 bit planes and is nudged up or down
 * by `AMPLITUDE` levels along a fixed pseudo-random +-1 pattern. Detection correlates the high-pass residual of a
 * suspect image with each bit's pattern. It survives re-encoding at the served size (WebP/JPEG) and mild recompression;
 * it does NOT survive heavy resizing, cropping, blur or a determined attacker. It is a tracing aid, not a lock.
 */
const BITS = 32;
const AMPLITUDE = 3;

/** The 32-bit code that identifies a viewer in watermarked images (stored in the view log next to the viewer id). */
export function viewerCode(viewer: string): number {
  return createHash("sha256").update(`wm:${viewer}`).digest().readUInt32BE(0);
}
export const codeHex = (code: number) => (code >>> 0).toString(16).padStart(8, "0");

function pattern(x: number, y: number, bit: number): number {
  // Small integer hash -> +-1. Deterministic, so the detector needs no stored pattern.
  let h = (Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263) ^ Math.imul(bit + 1, 2147483647)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return (h ^ (h >>> 16)) & 1 ? 1 : -1;
}
const plane = (x: number, y: number) => (Math.imul(x, 31) + Math.imul(y, 17) + (x >> 3) * 5) % BITS;

export async function embedViewerCode(
  input: Uint8Array,
  code: number,
  format: "webp" | "avif" | "jpeg",
): Promise<Buffer> {
  const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const out = Buffer.from(data);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const bit = plane(x, y);
      const sign = (code >>> bit) & 1 ? 1 : -1;
      const delta = sign * pattern(x, y, bit) * AMPLITUDE;
      const i = (y * width + x) * channels;
      for (let c = 0; c < 3; c++) out[i + c] = Math.max(0, Math.min(255, out[i + c] + delta));
    }
  const img = sharp(out, { raw: { width, height, channels } });
  if (format === "jpeg") return img.jpeg({ quality: 90 }).toBuffer();
  return format === "avif" ? img.avif({ quality: 70 }).toBuffer() : img.webp({ quality: 85 }).toBuffer();
}

/** Returns the most likely code and a 0..1 confidence (mean normalised correlation strength across bits). */
export async function detectViewerCode(input: Uint8Array): Promise<{ code: number; confidence: number }> {
  const { data, info } = await sharp(input).removeAlpha().greyscale().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const luma = new Float32Array(width * height);
  for (let i = 0; i < luma.length; i++) luma[i] = data[i];
  // High-pass: pixel minus the mean of its 5x5 neighbourhood (integral image).
  const stride = width + 1;
  const integral = new Float64Array(stride * (height + 1));
  for (let y = 0; y < height; y++) {
    let row = 0;
    for (let x = 0; x < width; x++) {
      row += luma[y * width + x];
      integral[(y + 1) * stride + x + 1] = integral[y * stride + x + 1] + row;
    }
  }
  const score = new Float64Array(BITS);
  const count = new Float64Array(BITS);
  const r = 2;
  for (let y = r; y < height - r; y++)
    for (let x = r; x < width - r; x++) {
      const x0 = x - r;
      const y0 = y - r;
      const x1 = x + r + 1;
      const y1 = y + r + 1;
      const sum =
        integral[y1 * stride + x1] -
        integral[y0 * stride + x1] -
        integral[y1 * stride + x0] +
        integral[y0 * stride + x0];
      const mean = sum / ((2 * r + 1) * (2 * r + 1));
      const bit = plane(x, y);
      score[bit] += (luma[y * width + x] - mean) * pattern(x, y, bit);
      count[bit]++;
    }
  let code = 0;
  let strength = 0;
  for (let b = 0; b < BITS; b++) {
    const s = count[b] ? score[b] / count[b] : 0;
    if (s > 0) code |= 1 << b;
    strength += Math.min(1, Math.abs(s) / AMPLITUDE);
  }
  return { code: code >>> 0, confidence: strength / BITS };
}
