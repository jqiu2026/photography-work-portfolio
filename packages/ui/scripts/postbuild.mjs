// 1) Add explicit ".js" / "/index.js" to relative imports in dist (strict ESM resolvers need them).
// 2) Build dist/styles.css by inlining the @imports of src/styles/index.css.
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const dist = path.resolve("dist");
function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = path.join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
for (const file of walk(dist).filter((f) => /\.(js|d\.ts)$/.test(f))) {
  const src = readFileSync(file, "utf8");
  const out = src.replace(/(from\s+|import\s*\(\s*|import\s+)(["'])(\.{1,2}\/[^"']+)\2/g, (m, pre, q, spec) => {
    if (/\.(js|css|json)$/.test(spec)) return m;
    const abs = path.resolve(path.dirname(file), spec);
    const ext = file.endsWith(".d.ts") ? ".d.ts" : ".js";
    if (existsSync(abs + ext)) return `${pre}${q}${spec}.js${q}`;
    if (existsSync(path.join(abs, `index${ext}`))) return `${pre}${q}${spec}/index.js${q}`;
    return m;
  });
  if (out !== src) writeFileSync(file, out);
}

const styles = path.resolve("src/styles");
const css = readFileSync(path.join(styles, "index.css"), "utf8").replace(
  /@import\s+"\.\/([^"]+)";\s*/g,
  (_m, f) => `${readFileSync(path.join(styles, f), "utf8")}\n`,
);
writeFileSync(path.join(dist, "styles.css"), css);
console.log("postbuild: imports fixed, styles.css written", `(${(css.length / 1024).toFixed(1)} KB)`);
