import { expect, test } from "@playwright/test";
import { hub, photos } from "./routes";

test("keyboard: hub has a skip link first, a visible focus ring on every nav stop, and one nav", async ({ page }) => {
  await page.goto(`${hub}/`, { waitUntil: "networkidle" });
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toHaveText(/Skip to content/);
  const main = page.getByRole("navigation", { name: "Main" });
  await expect(main.getByRole("link", { name: "Writing" })).toBeVisible();
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
  await expect(page.getByRole("navigation", { name: "All sites" })).toHaveCount(0);
});

test("keyboard: photos has a skip link first, a visible focus ring on every nav stop, and one nav", async ({
  page,
}) => {
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
  // the viewer's counter is a live region in the Holominimal lightbox bar
  await expect(dialog.locator(".hm-lightbox-count")).toContainText("2 /");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});
