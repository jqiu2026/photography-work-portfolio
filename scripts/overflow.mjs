// usage: node scripts/overflow.mjs <url> [width=390]  -> finds elements whose removal shrinks the page's scrollWidth
import { chromium } from "@playwright/test";
const [url, w = "390"] = process.argv.slice(2);
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: +w, height: 844 } })).newPage();
await p.goto(url, { waitUntil: "networkidle" });
const out = await p.evaluate((W) => {
  const sw = () => document.documentElement.scrollWidth;
  const base = sw();
  const culprits = [];
  if (base <= W + 1) return { base, culprits };
  for (const el of document.body.querySelectorAll("*")) {
    const prev = el.style.display;
    el.style.display = "none";
    if (sw() < base) culprits.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 50)} (${sw()})`);
    el.style.display = prev;
    if (culprits.length > 6) break;
  }
  return { base, culprits };
}, +w);
console.log(url, JSON.stringify(out, null, 1));
await b.close();
