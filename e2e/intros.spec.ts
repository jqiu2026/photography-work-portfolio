import { expect, test } from "@playwright/test";
import { flying, make, music } from "./routes";

/**
 * The opening story on the music, flying and make homes: it plays chapter by chapter, the arrows and the chapter marks
 * move it, Skip the story (or Escape) takes it away to the page, and with reduced motion it never appears.
 */
for (const [site, url, first] of [
  ["Music", music, /Things I wrote/],
  ["Flying", flying, /read the sky/],
  ["Make", make, /Things I build/],
] as const) {
  test(`${site}: the intro plays, moves by chapter, and Skip leaves the page ready`, async ({ page }) => {
    await page.goto(`${url}/`, { waitUntil: "networkidle" });
    const intro = page.getByRole("region", { name: `${site}: introduction` });
    await expect(intro).toBeVisible();
    const marks = intro.getByRole("list", { name: "Chapters" }).getByRole("button");
    await expect(marks).toHaveCount(5);
    // it plays by itself, so on a slow load it may be past the first chapter already: go back to it
    await marks.first().click();
    await expect(marks.first()).toHaveAttribute("aria-current", "step");
    await expect(intro).toContainText(first);
    await page.keyboard.press("ArrowRight");
    await expect(marks.nth(1)).toHaveAttribute("aria-current", "step");
    await expect(intro.getByRole("button", { name: "Play" })).toBeVisible();
    await marks.nth(3).click();
    await expect(marks.nth(3)).toHaveAttribute("aria-current", "step");
    await intro.getByRole("button", { name: /Skip the story/ }).click();
    await expect(intro).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(site);
    await expect(page.locator("html")).not.toHaveClass(/si-on/);
  });

  test(`${site}: Escape closes the intro; reduced motion never shows it`, async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${url}/`, { waitUntil: "networkidle" });
    await expect(page.getByRole("region", { name: `${site}: introduction` })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("region", { name: `${site}: introduction` })).toHaveCount(0);
    await ctx.close();
    const calm = await browser.newContext({ reducedMotion: "reduce" });
    const p2 = await calm.newPage();
    await p2.goto(`${url}/`, { waitUntil: "networkidle" });
    await expect(p2.getByRole("heading", { level: 1 })).toHaveText(site);
    await expect(p2.getByRole("region", { name: `${site}: introduction` })).toHaveCount(0);
    expect(await p2.locator("canvas").count()).toBe(0);
    await calm.close();
  });
}
