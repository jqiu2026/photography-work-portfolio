// usage: node scripts/optimize-images.mjs <srcDir> <outDir> [publicPrefix]
// Writes responsive WebP derivatives next to (never over) the originals, plus manifest.json
// with intrinsic size, dominant color and a tiny blur placeholder. Strips EXIF/GPS.
import { mkdir, readdir, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const [srcDir, outDir, prefix = "/opt"] = process.argv.slice(2);
if (!srcDir || !outDir) throw new Error("usage: optimize-images.mjs <srcDir> <outDir> [prefix]");
const WIDTHS = [480, 960, 1600, 2400];
await mkdir(outDir, { recursive: true });
const manifest = {};

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (/\.(jpe?g|png|webp)$/i.test(e.name)) out.push(p);
  }
  return out;
}

const slug = (s) => s.toLowerCase().replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

for (const file of await walk(srcDir)) {
  const id = slug(path.relative(srcDir, file));
  const img = sharp(file, { failOn: "none" }).rotate();
  const meta = await img.metadata();
  const [w, h] = meta.orientation && meta.orientation >= 5 ? [meta.height, meta.width] : [meta.width, meta.height];
  const stats = await img.clone().resize(16, 16, { fit: "cover" }).stats();
  const [r, g, b] = stats.channels.map((c) => Math.round(c.mean));
  const blur = await img.clone().resize(16).webp({ quality: 40 }).toBuffer();
  const files = [];
  for (const width of WIDTHS.filter((x) => x < w)) {
    const name = `${id}-${width}.webp`;
    const target = path.join(outDir, name);
    const exists = await stat(target).then(() => true, () => false);
    if (!exists) await img.clone().resize({ width }).webp({ quality: 78, effort: 5 }).toFile(target);
    files.push({ width, src: `${prefix}/${name}` });
  }
  if (!files.length) {
    const name = `${id}-${w}.webp`;
    await img.clone().webp({ quality: 80 }).toFile(path.join(outDir, name));
    files.push({ width: w, src: `${prefix}/${name}` });
  }
  manifest[id] = { width: w, height: h, color: `rgb(${r}, ${g}, ${b})`, blur: `data:image/webp;base64,${blur.toString("base64")}`, files };
  console.log(id, `${w}x${h}`, files.length, "sizes");
}
await writeFile(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 1));
