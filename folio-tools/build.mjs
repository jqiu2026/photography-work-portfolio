// Builds folio/photos (medium-quality WebP, metadata stripped, anonymous file names) and folio/assets/photos.js
// from a folder of picks, one sub-folder per category. Not deployed: the site is the static folder `folio/`.
//
//   SHARP=/path/to/sharp/dist/index.cjs node folio-tools/build.mjs <picks-dir> [extra-team-portrait-dir ...]
//
// Re-running replaces folio/photos entirely.
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP ?? "sharp");
sharp.cache(false);
sharp.concurrency(2);

const PICKS = process.argv[2];
const EXTRA_TEAM = process.argv.slice(3); // files or folders added to Team / Portrait
const OUT = path.resolve(import.meta.dirname, "../folio");

// Largest umbrella first, most specific last.
const CATEGORIES = [
  { slug: "event", title: "Event", from: ["Event"] },
  { slug: "creative", title: "Creative", from: ["Creative"] },
  { slug: "sports", title: "Sports", from: ["Sports"] },
  { slug: "team-portrait", title: "Team / Portrait", from: [] },
  { slug: "theater", title: "Theater", from: ["Theater"] },
  { slug: "music", title: "Music", from: ["Music"] },
  { slug: "dance", title: "Dance", from: ["Dance"] },
  { slug: "wedding", title: "Wedding", from: ["Wedding"] },
];

const GRID = { edge: 900, quality: 60 }; // what the masonry loads
const FULL = { edge: 1600, quality: 68 }; // what the viewer opens: medium quality on purpose

const isImage = (f) => /\.(jpe?g|png)$/i.test(f) && !f.startsWith(".");
const listDir = (d) => fs.readdirSync(d).filter(isImage).map((f) => path.join(d, f));

/** Round-robin by shoot so near-identical frames from one shoot are never neighbours. */
function interleave(files) {
  const shoot = (f) => path.basename(f).split("__")[0];
  const by = new Map();
  for (const f of files.sort()) (by.get(shoot(f)) ?? by.set(shoot(f), []).get(shoot(f))).push(f);
  const lists = [...by.values()].sort((a, b) => b.length - a.length);
  const out = [];
  while (lists.some((l) => l.length)) for (const l of lists) if (l.length) out.push(l.shift());
  return out;
}

fs.rmSync(path.join(OUT, "photos"), { recursive: true, force: true });
const data = [];
for (const cat of CATEGORIES) {
  let files = cat.from.flatMap((n) => listDir(path.join(PICKS, n)));
  if (cat.slug === "team-portrait") {
    files = EXTRA_TEAM.flatMap((p) => (fs.statSync(p).isDirectory() ? listDir(p) : [p]));
  }
  files = interleave(files);
  const dir = path.join(OUT, "photos", cat.slug);
  fs.mkdirSync(dir, { recursive: true });
  const items = [];
  let n = 0;
  for (const f of files) {
    n++;
    const id = `${cat.slug}-${String(n).padStart(2, "0")}`;
    const base = sharp(f, { failOn: "none" }).rotate();
    const grid = await base.clone().resize(GRID.edge, GRID.edge, { fit: "inside", withoutEnlargement: true }).webp({ quality: GRID.quality }).toFile(path.join(dir, `${id}-s.webp`));
    await base.clone().resize(FULL.edge, FULL.edge, { fit: "inside", withoutEnlargement: true }).webp({ quality: FULL.quality }).toFile(path.join(dir, `${id}-l.webp`));
    items.push([id, grid.width, grid.height]);
  }
  data.push({ slug: cat.slug, title: cat.title, items });
  console.log(cat.title, items.length);
}
fs.mkdirSync(path.join(OUT, "assets"), { recursive: true });
fs.writeFileSync(path.join(OUT, "assets/photos.js"), `window.FOLIO_PHOTOS=${JSON.stringify(data)};\n`);
