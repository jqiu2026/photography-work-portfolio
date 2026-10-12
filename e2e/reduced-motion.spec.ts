import { expect, test } from "@playwright/test";
import { hub, photos } from "./routes";

test.use({ reducedMotion: "reduce" });

for (const [name, url] of [
  ["hub home", `${hub}/`],
  ["photos home", `${photos}/`],
  ["flying", `${hub}/flying`],
] as const) {
  test(`reduced motion: ${name} is complete and static`, async ({ page }) => {
    await page.goto(url, { waitUntil: "networkidle" });
    // No canvas (WebGL / image sequence) is drawn; everything is plain content.
    expect(await page.locator("canvas").count()).toBe(0);
    // Content that normally animates in is visible without scrolling through it.
    const hidden = await page.evaluate(
      () =>
        [...document.querySelectorAll("h1, h2, h3, main p")].filter(
          (el) => Number(getComputedStyle(el).opacity) < 0.5 && el.textContent?.trim(),
        ).length,
    );
    expect(hidden).toBe(0);
    // Pinned scenes are not pinned (no 300vh runways): the page is not absurdly tall.
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(h).toBeLessThan(9000);
  });
}
