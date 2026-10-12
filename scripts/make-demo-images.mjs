import sharp from "sharp";
import { writeFileSync } from "node:fs";
const out = "apps/docs/public/demo";
const palettes = [
  ["#0f172a", "#2563eb", "#93c5fd"],
  ["#1c1917", "#dc2626", "#fecaca"],
  ["#052e16", "#15803d", "#bbf7d0"],
];
const manifest = {};
for (const [i, [a, b, c]] of palettes.entries()) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient><radialGradient id="r" cx=".7" cy=".3" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><rect width="1600" height="1000" fill="url(#g)"/><rect width="1600" height="1000" fill="url(#r)"/></svg>`;
  const files = [];
  for (const w of [480, 960, 1600]) {
    const name = `g${i + 1}-${w}.webp`;
    await sharp(Buffer.from(svg)).resize(w).webp({ quality: 80 }).toFile(`${out}/${name}`);
    files.push({ width: w, src: `/demo/${name}` });
  }
  manifest[`g${i + 1}`] = { width: 1600, height: 1000, color: b, files };
}
writeFileSync(`${out}/manifest.json`, JSON.stringify(manifest, null, 1));
