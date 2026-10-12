import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import path from "node:path";
import { routes } from "./routes";

const shots = path.resolve("docs/project/screenshots/phase-1");
const variants = [
  { scheme: "light", width: 1440, height: 900 },
  { scheme: "dark", width: 1440, height: 900 },
  { scheme: "light", width: 390, height: 844 },
  { scheme: "dark", width: 390, height: 844 },
] as const;

for (const r of routes) {
  for (const v of variants) {
    test(`${r.site} ${r.path} ${v.scheme} ${v.width}`, async ({ browser }) => {
      const ctx = await browser.newContext({ colorScheme: v.scheme, viewport: { width: v.width, height: v.height } });
      const page = await ctx.newPage();
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      page.on(
        "console",
        (m) =>
          m.type() === "error" &&
          !/Failed to load resource.*(404|youtube|google)/i.test(m.text()) &&
          errors.push(m.text()),
      );
      const res = await page.goto(`${r.base}${r.path}`, { waitUntil: "networkidle" });
      expect(res?.status(), "status").toBe(r.path === "/nope" ? 404 : 200);
      // Fire reveal animations before measuring.
      const h = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < Math.min(h, 12000); y += 700) {
        await page.evaluate((yy) => window.scrollTo(0, yy), y);
        await page.waitForTimeout(60);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(400);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, "no horizontal scroll").toBeLessThanOrEqual(1);
      expect(errors, "console/page errors").toEqual([]);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      const bad = results.violations.filter((x) => x.impact === "serious" || x.impact === "critical");
      expect(
        bad.map(
          (x) =>
            `${x.id}: ${x.nodes
              .map((n) => n.target.join(" "))
              .slice(0, 3)
              .join(" | ")}`,
        ),
        "axe serious/critical",
      ).toEqual([]);
      const name = `${r.site}${r.path === "/" ? "-home" : r.path.replace(/\//g, "-")}-${v.scheme}-${v.width}.png`;
      await page.screenshot({ path: path.join(shots, r.site, name), fullPage: false });
      await ctx.close();
    });
  }
}
