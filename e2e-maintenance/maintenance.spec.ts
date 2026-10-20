import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { apps } from "../playwright.maintenance.config";

for (const app of apps) {
  const base = `http://localhost:${app.port}`;
  test.describe(app.name, () => {
    test("the home page and a made-up URL show the page with a 503, Retry-After and noindex", async ({ request }) => {
      for (const path of ["/", "/no/such/page"]) {
        const res = await request.get(base + path);
        expect(res.status(), path).toBe(503);
        expect(res.headers()["retry-after"]).toBe("86400");
        expect(res.headers()["x-robots-tag"]).toContain("noindex");
        const html = await res.text();
        expect(html).toContain("<title>Back soon · Jerry Qiu</title>");
        expect(html).toContain("Back");
      }
    });

    test("crawlers are kept out", async ({ request }) => {
      expect(await (await request.get(`${base}/robots.txt`)).text()).toContain("Disallow: /");
      if (app.sitemap) expect((await request.get(`${base}/sitemap.xml`)).status()).toBe(404);
    });

    test("an API write is refused with JSON", async ({ request }) => {
      const res = await request.post(`${base}/api/contact`, { data: {} });
      expect(res.status()).toBe(503);
      expect((await res.json()).error).toBe("maintenance");
    });

    if (app.open)
      test(`${app.open} stays open`, async ({ request }) => {
        const res = await request.get(base + app.open);
        expect(res.status(), "not the maintenance page").not.toBe(503);
      });

    for (const width of [390, 1440])
      test(`the page is accessible and fits at ${width}`, async ({ browser }) => {
        const ctx = await browser.newContext({ viewport: { width, height: width < 600 ? 844 : 900 } });
        const page = await ctx.newPage();
        await page.goto(base, { waitUntil: "load" });
        await expect(page.getByRole("heading", { level: 1 })).toContainText("Back soon");
        await expect(page.getByRole("link", { name: /inquiry@jerryqiu\.com/ })).toHaveAttribute(
          "href",
          "mailto:inquiry@jerryqiu.com",
        );
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, "no horizontal scroll").toBeLessThanOrEqual(1);
        const fits = await page.evaluate(() => ({
          locked: getComputedStyle(document.body).overflow === "hidden",
          fits: document.documentElement.scrollHeight <= window.innerHeight + 1,
        }));
        expect(fits, "the page does not scroll").toEqual({ locked: true, fits: true });
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        expect(results.violations.filter((v) => v.impact === "serious" || v.impact === "critical")).toEqual([]);
        await ctx.close();
      });

    test("it works with JavaScript off", async ({ browser }) => {
      const ctx = await browser.newContext({ javaScriptEnabled: false });
      const page = await ctx.newPage();
      await page.goto(base);
      await expect(page.getByRole("heading", { level: 1 })).toContainText("Back soon");
      await ctx.close();
    });
  });
}
