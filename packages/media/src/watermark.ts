import sharp from "sharp";

export type Watermark = { text: string; position: "bottom-right" | "bottom-left" | "center"; opacity: number };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Bakes a visible text watermark into a derivative. A visible mark makes casual reuse obvious; it does not stop a
 * determined person (they can crop or paint it out). Output keeps the input format and dimensions.
 */
export async function applyWatermark(input: Uint8Array, format: "webp" | "avif", wm: Watermark): Promise<Buffer> {
  const img = sharp(input);
  const { width = 1200, height = 800 } = await img.metadata();
  const size = Math.max(14, Math.round(width * 0.035));
  const pad = Math.round(size * 0.9);
  const anchor = wm.position === "bottom-left" ? "start" : wm.position === "center" ? "middle" : "end";
  const x = wm.position === "bottom-left" ? pad : wm.position === "center" ? width / 2 : width - pad;
  const y = wm.position === "center" ? height / 2 + size / 3 : height - pad;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <style>text{font:600 ${size}px sans-serif;letter-spacing:0.02em}</style>
    <text x="${x}" y="${y}" text-anchor="${anchor}" fill="#000" fill-opacity="${wm.opacity * 0.6}" stroke="#000" stroke-opacity="${wm.opacity * 0.6}" stroke-width="${size * 0.08}" dx="1" dy="1">${esc(wm.text)}</text>
    <text x="${x}" y="${y}" text-anchor="${anchor}" fill="#fff" fill-opacity="${wm.opacity}">${esc(wm.text)}</text>
  </svg>`;
  const out = img.composite([{ input: Buffer.from(svg) }]);
  return format === "avif" ? out.avif({ quality: 60 }).toBuffer() : out.webp({ quality: 82 }).toBuffer();
}
