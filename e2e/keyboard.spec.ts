import { expect, test } from "@playwright/test";
import { hub, photos } from "./routes";

for (const [name, url] of [["hub", `${hub}/`]] as const) {
  test(`keyboard: ${name} skip link first, focus is visible, index control, no switcher`, async ({ page }) => {
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
    // The floating index: a real button that opens a dialog of this page's scenes and this site's routes.
    const index = page.getByRole("button", { name: /open index/i });
    await index.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Index" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("navigation", { name: "On this page" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(index).toBeFocused();
    // Cross-site rule: no switcher anywhere.
    await expect(page.getByRole("navigation", { name: "All sites" })).toHaveCount(0);
  });
}

test("keyboard: photos has a skip link first, a visible focus ring on every nav stop, and one nav", async ({
  page,
}) => {
  await page.addInitScript(() => sessionStorage.setItem("pub-intro", "1")); // the home intro has its own spec
  await page.goto(`${photos}/`, { waitUntil: "networkidle" });
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toHaveText(/Skip to content/);
  const main = page.getByRole("navigation", { name: "Main" });
  await expect(main.getByRole("link", { name: "Portfolio" })).toBeVisible();
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    const ok = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return true;
      const cs = getComputedStyle(el);
      return cs.outlineStyle !== "none" || cs.boxShadow !== "none" || cs.borderBottomStyle !== "none";
    });
    expect(ok).toBe(true);
  }
  await expect(page.getByRole("button", { name: /open index/i })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "All sites" })).toHaveCount(0);
});

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
