import { expect, test } from "@playwright/test";
import { hub, music } from "./routes";

/**
 * The hub's Nexus: four portals, one per site. The ring turns with the arrow keys or the gate buttons, stepping through
 * opens that world with a real link to its site, Escape and the back button return, and a #world link opens it directly.
 */
test("the ring turns, a portal opens its world with a link to the site, and Escape comes back", async ({ page }) => {
  await page.goto(`${hub}/`, { waitUntil: "networkidle" });
  const portals = page.getByRole("group", { name: /four portals/i });
  await expect(portals.getByRole("button", { pressed: true })).toContainText("Exposure");
  await page.locator("body").press("ArrowRight");
  await expect(portals.getByRole("button", { pressed: true })).toContainText("Resonance");
  await portals.getByRole("button", { name: /Step through to Resonance/ }).click();
  const world = page.getByRole("dialog", { name: "Resonance" });
  await expect(world).toBeVisible({ timeout: 10_000 });
  await expect(page).toHaveURL(/#resonance$/);
  await expect(world.getByRole("link", { name: /^Enter / })).toHaveAttribute("href", new RegExp(`^${music}`));
  await expect(world.getByRole("link", { name: /^Enter / })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(world).toHaveCount(0, { timeout: 10_000 });
  await expect(page).not.toHaveURL(/#/);
});

test("a gate button picks a world; a second press steps through; the browser's back button returns", async ({
  page,
}) => {
  await page.goto(`${hub}/`, { waitUntil: "networkidle" });
  const forge = page.getByRole("button", { name: /Forge\s*Make/ });
  await forge.click();
  await expect(forge).toHaveAttribute("aria-pressed", "true");
  await forge.click();
  await expect(page.getByRole("dialog", { name: "Forge" })).toBeVisible({ timeout: 10_000 });
  await page.goBack();
  await expect(page.getByRole("dialog", { name: "Forge" })).toHaveCount(0, { timeout: 10_000 });
});

test("a link to a world opens it straight away, and reduced motion still works", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(`${hub}/#altitude`, { waitUntil: "networkidle" });
  const world = page.getByRole("dialog", { name: "Altitude" });
  await expect(world).toBeVisible();
  await world.getByRole("button", { name: /Back to the Nexus/ }).click();
  await expect(world).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Jerry Qiu/);
  await ctx.close();
});

test("sound is off until asked for, and the toggle says so", async ({ page }) => {
  await page.goto(`${hub}/`, { waitUntil: "networkidle" });
  const sound = page.getByRole("button", { name: /^Sound (on|off)$/ }).first();
  await expect(sound).toHaveAttribute("aria-pressed", "false");
  await sound.click();
  await expect(sound).toHaveAttribute("aria-pressed", "true");
  await sound.click();
  await expect(sound).toHaveAttribute("aria-pressed", "false");
});
