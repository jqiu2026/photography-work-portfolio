import { expect, test } from "@playwright/test";
import { hub, photos } from "./routes";

for (const [name, url] of [
  ["hub", `${hub}/`],
  ["photos", `${photos}/`],
] as const) {
  test(`keyboard: ${name} skip link first, focus is visible, switcher only on the hub`, async ({ page }) => {
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
    if (name === "hub") {
      await page
        .getByRole("button", { name: /Jerry Qiu/ })
        .first()
        .focus();
      await page.keyboard.press("Enter");
      await expect(page.getByRole("navigation", { name: "All sites" })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("navigation", { name: "All sites" })).toBeHidden();
    } else {
      // Cross-site rule: the worlds have no switcher at all.
      await expect(page.getByRole("navigation", { name: "All sites" })).toHaveCount(0);
    }
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

test("mobile menu: opens as a dialog, lists the pages, closes with Escape and returns focus", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(`${hub}/`, { waitUntil: "networkidle" });
  const burger = page.getByRole("button", { name: "Open menu" });
  await burger.click();
  const dialog = page.getByRole("dialog", { name: "Menu" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Writing" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(burger).toBeFocused();
  await ctx.close();
});
