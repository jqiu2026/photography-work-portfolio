// usage: node scripts/check-isolation.mjs
// The photo app is deployed as its own Vercel project (Root Directory apps/photos), so it may import only itself and
// packages/*. This fails if anything it uses reaches into another app, and lists env names read in code that
// .env.example does not mention (names only; no values are read).
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const walk = (dir, out = []) => {
  for (const e of readdirSync(dir)) {
    if (e === "node_modules" || e.startsWith(".next")) continue;
    const p = path.join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|mjs|css)$/.test(e)) out.push(p);
  }
  return out;
};
const apps = ["web", "music", "flying", "make", "docs"];
const bad = [];
for (const dir of ["apps/photos/src", ...readdirSync(path.join(root, "packages")).map((p) => `packages/${p}/src`)]) {
  if (!existsSync(path.join(root, dir))) continue;
  for (const f of walk(path.join(root, dir))) {
    const src = readFileSync(f, "utf8");
    for (const m of src.matchAll(/from\s+["']([^"']+)["']|import\(["']([^"']+)["']\)/g)) {
      const spec = m[1] ?? m[2] ?? "";
      if (
        apps.some((a) => spec.includes(`apps/${a}`) || spec === `@jerryqiu/${a}` || spec.startsWith(`@jerryqiu/${a}/`))
      )
        bad.push(`${path.relative(root, f)} imports ${spec}`);
    }
  }
}
const example = existsSync(path.join(root, ".env.example"))
  ? readFileSync(path.join(root, ".env.example"), "utf8")
  : "";
const used = new Set();
for (const f of walk(path.join(root, "apps/photos/src"))) {
  for (const m of readFileSync(f, "utf8").matchAll(/process\.env\.([A-Z][A-Z0-9_]+)/g)) used.add(m[1]);
}
const ignore = new Set(["NODE_ENV", "NEXT_PHASE", "NEXT_RUNTIME", "VERCEL", "VERCEL_ENV", "VERCEL_URL", "CI", "PORT"]);
const missing = [...used].filter((n) => !ignore.has(n) && !example.includes(n)).sort();
if (bad.length) console.error(`Isolation broken:\n  ${bad.join("\n  ")}`);
if (missing.length) console.warn(`Env names read in code but not in .env.example:\n  ${missing.join("\n  ")}`);
if (!bad.length) console.log("apps/photos imports only itself and packages/*");
process.exit(bad.length ? 1 : 0);
