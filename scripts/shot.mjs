// usage: node scripts/shot.mjs <url> <out.png> [width=1440] [dark|light]
import { chromium } from "@playwright/test";
const [url, out, w = "1440", scheme = "light"] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +w, height: 900 }, colorScheme: scheme });
await p.goto(url, { waitUntil: "networkidle" });
await p.screenshot({ path: out, fullPage: true });
await b.close();
