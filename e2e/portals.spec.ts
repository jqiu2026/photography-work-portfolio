import { expect, test } from "@playwright/test";
import { flying, hub, music, photos } from "./routes";

/**
 * The hub's home: four portals, each a real link to its site. Following one steps through (the portal fills the screen)
 * and lands on that site; with reduced motion they are plain links and there is no canvas.
 */
const portals = (page: import("@playwright/test").Page) =>
  page.getByRole("navigation", { name: "Four portals, one per site" }).getByRole("link");

test("four portals link to the four sites, each named and described", async ({ page }) => {
  await page.goto(`${hub}/`, { waitUntil: "networkidle" });
  const links = portals(page);
  await expect(links).toHaveCount(4);
  const want = [
    [/Exposure.*Photography/, photos],
    [/Resonance.*Music/, music],
    [/Altitude.*Flying/, flying],
    // make has no local port: its address is the production one in every build (getMakeUrl)
    [/Forge.*Make/, "https?://"],
  ] as const;
  for (const [i, [name, url]] of want.entries()) {
    await expect(links.nth(i)).toHaveAccessibleName(name);
    await expect(links.nth(i)).toHaveAttribute("href", new RegExp(`^${url}`));
    await expect(links.nth(i)).toHaveAccessibleDescription(/\w/);
  }
});

test("stepping through a portal lands on its site", async ({ page }) => {
  await page.goto(`${hub}/`, { waitUntil: "networkidle" });
  await portals(page).filter({ hasText: "Resonance" }).click();
  await expect(page).toHaveURL(new RegExp(`^${music}`), { timeout: 10_000 });
});

test("the keyboard reaches every portal and Enter follows it", async ({ page }) => {
  await page.goto(`${hub}/`, { waitUntil: "networkidle" });
  const altitude = portals(page).filter({ hasText: "Altitude" });
  await altitude.focus();
  await expect(altitude).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(new RegExp(`^${flying}`), { timeout: 10_000 });
});

test("reduced motion: plain links, a still picture in each door, no canvas", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(`${hub}/`, { waitUntil: "networkidle" });
  expect(await page.locator("canvas").count()).toBe(0);
  const door = page.locator('a[data-world="altitude"] .px-door');
  expect(await door.evaluate((el) => getComputedStyle(el).backgroundImage)).toContain("gradient");
  await portals(page).filter({ hasText: "Altitude" }).click();
  await expect(page).toHaveURL(new RegExp(`^${flying}`));
  await ctx.close();
});
