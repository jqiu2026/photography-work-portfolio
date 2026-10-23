import type { OverlayOptions } from "sharp";

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * A big centered mark across the whole photograph, tilted, in white with a dark edge so it reads on light and dark
 * pictures alike. A preview carries it, so it can be shared for approval without standing in for the real photograph.
 */
export async function previewLayer(text: string, width: number, height: number): Promise<OverlayOptions> {
  const label = esc(text.toUpperCase().slice(0, 40));
  const size = Math.round(Math.min(width * 0.17, (width * 1.5) / Math.max(6, label.length)));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <g transform="rotate(-18 ${width / 2} ${height / 2})">
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-family="Helvetica, Arial, sans-serif" font-weight="800"
      font-size="${size}" letter-spacing="${Math.round(size * 0.04)}" fill="#ffffff" fill-opacity="0.5" stroke="#000000" stroke-opacity="0.55" stroke-width="${Math.max(2, Math.round(size * 0.035))}"
      paint-order="stroke">${label}</text>
  </g>
</svg>`;
  return { input: Buffer.from(svg), top: 0, left: 0 };
}
