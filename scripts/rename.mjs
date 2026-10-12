// Renames the UI package everywhere from brand.config.json (package name, brand, CSS prefix).
// usage: node scripts/rename.mjs --package @acme/kit --brand AcmeKit --prefix ac [--root <dir>] [--dry]
// Run `pnpm install` afterwards (workspace links and the lockfile change with the package name).
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .reduce(
      (a, x, i, all) =>
        x.startsWith("--")
          ? [...a, [x.slice(2), all[i + 1]?.startsWith("--") || all[i + 1] === undefined ? true : all[i + 1]]]
          : a,
      [],
    ),
);
const root = path.resolve(args.root && args.root !== true ? args.root : ".");
const cfgPath = path.join(root, "brand.config.json");
const cfg = JSON.parse(readFileSync(cfgPath, "utf8"));
const next = {
  package: args.package || cfg.package,
  brand: args.brand || cfg.brand,
  cssPrefix: args.prefix || cfg.cssPrefix,
};
if (!/^(@[a-z0-9-]+\/)?[a-z0-9-]+$/.test(next.package)) throw new Error(`Invalid package name: ${next.package}`);
if (!/^[a-z][a-z0-9]{0,5}$/.test(next.cssPrefix)) throw new Error(`Invalid CSS prefix: ${next.cssPrefix}`);

const SKIP = new Set(["node_modules", ".next", ".git", "dist", ".turbo", "vendor", "test-results"]);
const TEXT = /\.(ts|tsx|js|mjs|cjs|css|json|md|mdx|yml|yaml|html)$/;
const files = [];
(function walk(d) {
  for (const n of readdirSync(d)) {
    if (SKIP.has(n) || n === "pnpm-lock.yaml" || n === "package-lock.json") continue;
    const p = path.join(d, n);
    statSync(p).isDirectory() ? walk(p) : TEXT.test(n) && files.push(p);
  }
})(root);

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const rules = [
  [new RegExp(esc(cfg.package), "g"), next.package],
  [new RegExp(esc(cfg.brand), "g"), next.brand],
];
if (next.cssPrefix !== cfg.cssPrefix) {
  // custom properties (--ph-*) and classes / keys (ph-*), at a word boundary only
  rules.push([new RegExp(`(?<![A-Za-z0-9])--${cfg.cssPrefix}-`, "g"), `--${next.cssPrefix}-`]);
  rules.push([new RegExp(`(?<![A-Za-z0-9-])${cfg.cssPrefix}-(?=[a-z])`, "g"), `${next.cssPrefix}-`]);
}
let changed = 0;
for (const f of files) {
  const src = readFileSync(f, "utf8");
  let out = src;
  for (const [re, to] of rules) out = out.replace(re, to);
  if (out !== src) {
    changed++;
    if (!args.dry) writeFileSync(f, out);
  }
}
if (!args.dry) writeFileSync(cfgPath, `${JSON.stringify({ ...cfg, ...next }, null, 2)}\n`);
console.log(
  `${args.dry ? "[dry] would change" : "changed"} ${changed} files: ${cfg.package} -> ${next.package}, ${cfg.brand} -> ${next.brand}, prefix ${cfg.cssPrefix} -> ${next.cssPrefix}`,
);
