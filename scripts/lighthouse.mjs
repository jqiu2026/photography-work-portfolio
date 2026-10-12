// usage: node scripts/lighthouse.mjs <url> [<url> ...]   (mobile emulation, simulated throttling = Lighthouse defaults)
import { chromium } from "@playwright/test";
import * as chromeLauncher from "chrome-launcher";
import lighthouse from "lighthouse";

const urls = process.argv.slice(2);
const chrome = await chromeLauncher.launch({
  chromePath: chromium.executablePath(),
  chromeFlags: ["--headless=new", "--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});
for (const url of urls) {
  const { lhr } = await lighthouse(url, {
    port: chrome.port,
    output: "json",
    logLevel: "error",
    onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
  });
  const s = (k) => Math.round((lhr.categories[k]?.score ?? 0) * 100);
  const a = lhr.audits;
  console.log(
    `${url}\n  perf ${s("performance")}  a11y ${s("accessibility")}  best-practices ${s("best-practices")}  seo ${s("seo")}\n  FCP ${a["first-contentful-paint"].displayValue}  LCP ${a["largest-contentful-paint"].displayValue}  TBT ${a["total-blocking-time"].displayValue}  CLS ${a["cumulative-layout-shift"].displayValue}  transfer ${(a["total-byte-weight"].numericValue / 1024).toFixed(0)} KB`,
  );
  const fails = Object.values(lhr.audits).filter(
    (x) =>
      x.score !== null &&
      x.score < 0.9 &&
      x.scoreDisplayMode !== "informative" &&
      x.scoreDisplayMode !== "manual" &&
      x.scoreDisplayMode !== "notApplicable",
  );
  for (const f of fails.slice(0, 8)) console.log(`   - ${f.id}: ${f.title} (${Math.round((f.score ?? 0) * 100)})`);
}
await chrome.kill();
