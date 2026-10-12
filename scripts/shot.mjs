// usage: node scripts/shot.mjs <url> <out.png> [width=1440] [dark|light] [--scroll] [--reduce] [--viewport]
// --scroll scrolls through the page first (fires reveals); --reduce emulates prefers-reduced-motion;
// --viewport screenshots only the first viewport. Prints console errors and page errors.
import { chromium } from "@playwright/test";
const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const [url, out, w = "1440", scheme = "light"] = args.filter((a) => !a.startsWith("--"));
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: +w, height: +w < 600 ? 844 : 900 }, colorScheme: scheme, reducedMotion: flags.has("--reduce") ? "reduce" : "no-preference" });
const p = await ctx.newPage();
const errors = [];
p.on("console", (m) => m.type() === "error" && errors.push(m.text()));
p.on("pageerror", (e) => errors.push(String(e)));
await p.goto(url, { waitUntil: "networkidle" });
if (flags.has("--scroll")) {
  const h = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 500) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(120); }
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(600);
}
await p.screenshot({ path: out, fullPage: !flags.has("--viewport") });
if (errors.length) console.log("CONSOLE ERRORS:\n" + errors.slice(0, 8).join("\n"));
await b.close();
