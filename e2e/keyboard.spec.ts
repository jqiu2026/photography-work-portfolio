import { expect, test } from "@playwright/test";
import { hub, photos } from "./routes";

for (const [name, url] of [
  ["hub", `${hub}/`],
  ["photos", `${photos}/`],
] as const) {
  test(`keyboard: ${name} skip link first, focus is visible, switcher opens`, async ({ page }) => {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toHaveText(/Skip to content/);
    await page.keyboard.press("Enter");
    // Tab through the header: every focus stop has a visible outline or ring.
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
      const ok = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return true;
        const cs = getComputedStyle(el);
        return cs.outlineStyle !== "none" || cs.boxShadow !== "none";
      });
      expect(ok).toBe(true);
    }
    await page
      .getByRole("button", { name: /Jerry Qiu/ })
      .first()
      .focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("navigation", { name: "All sites" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("navigation", { name: "All sites" })).toBeHidden();
  });
}

test("keyboard: lightbox opens, navigates and closes", async ({ page }) => {
  await page.goto(`${photos}/portfolio`, { waitUntil: "networkidle" });
  await page
    .getByRole("button", { name: /^Open / })
    .first()
    .focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(dialog.locator("figcaption")).toContainText("2 /");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});
