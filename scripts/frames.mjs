// usage: node scripts/frames.mjs <url> <outPrefix> [width=1440] [dark|light] [--reduce] [--times=0,2,4]
// Scrolls at ~600px/s and saves viewport frames at the given seconds (default 0,2,4,6,8,10,12,15). Prints tier info.
import { chromium } from "@playwright/test";
const args = process.argv.slice(2);
const flags = args.filter((a) => a.startsWith("--"));
const [url, out, w = "1440", scheme = "dark"] = args.filter((a) => !a.startsWith("--"));
const times = (flags.find((f) => f.startsWith("--times="))?.slice(8) ?? "0,2,4,6,8,10,12,15").split(",").map(Number);
const b = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const ctx = await b.newContext({
  viewport: { width: +w, height: +w < 600 ? 844 : 900 },
  colorScheme: scheme,
  reducedMotion: flags.includes("--reduce") ? "reduce" : "no-preference",
});
const p = await ctx.newPage();
const errors = [];
p.on("console", (m) => m.type() === "error" && errors.push(m.text()));
p.on("pageerror", (e) => errors.push(String(e)));
await p.goto(url, { waitUntil: "load" });
await p.waitForTimeout(4000);
const info = await p.evaluate(() => ({
  tier: document.documentElement.dataset.hlTier,
  canvas: document.querySelector(".hl-stage__canvas")?.dataset.ready,
  h: document.documentElement.scrollHeight,
}));
console.log(JSON.stringify(info));
const t0 = Date.now();
for (const t of times) {
  while ((Date.now() - t0) / 1000 < t) {
    await p.mouse.wheel(0, 20);
    await p.waitForTimeout(33);
  }
  await p.screenshot({ path: `${out}-${String(t).padStart(2, "0")}.png` });
}
if (errors.length) console.log("ERRORS:", errors.slice(0, 6).join("\n"));
await b.close();
