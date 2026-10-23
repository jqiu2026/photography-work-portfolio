import { expect, test } from "@playwright/test";

const PHOTOS = "http://localhost:3302";

test("the studio sidebar is steady: one size, the current group lists its pages, nothing moves under the pointer", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${PHOTOS}/studio/overview`, { waitUntil: "networkidle" });
  const nav = page.getByRole("navigation", { name: "Studio sections" });
  await expect(nav.getByRole("link", { name: "Dashboard", exact: true }).first()).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Good (morning|afternoon|evening)/);

  // hovering another group changes nothing: no magnification, no layout shift
  const target = nav.getByRole("link", { name: "Sales", exact: true });
  const before = (await target.boundingBox())!;
  await page.mouse.move(before.x + 30, before.y + before.height / 2, { steps: 6 });
  await page.waitForTimeout(400);
  const after = (await target.boundingBox())!;
  expect(Math.abs(after.y - before.y)).toBeLessThan(1);
  expect(Math.abs(after.width - before.width)).toBeLessThan(1);

  // entries are real links
  await target.click();
  await expect(page).toHaveURL(/\/studio\/orders$/);
  await expect(nav.getByRole("link", { name: "Sales", exact: true })).toHaveAttribute("aria-current", "page");
  // the group's pages open as a menu beside it, and are tabs on the page itself
  const tabs = page.getByRole("navigation", { name: "Sales pages" });
  for (const t of ["Store", "Quotes", "Invoices", "Payments", "Codes"])
    await expect(tabs.getByRole("link", { name: t })).toBeVisible();
  await target.hover();
  await expect(nav.getByRole("link", { name: "Codes" })).toBeVisible();
});

test("the dashboard shows real totals and every other section keeps its heading and the sidebar", async ({ page }) => {
  await page.goto(`${PHOTOS}/studio/overview`, { waitUntil: "networkidle" });
  for (const name of ["Revenue", "Upcoming", "Recent activity", "Needs attention", "Galleries"])
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Studio sections" }).locator("a[data-hm-dock-item], a.hm-dock-brand-link"),
  ).toHaveCount(8); // brand + 7 groups (the open group's pages are tabs in the page header)
  for (const id of [
    "calendar",
    "packages",
    "billing",
    "tasks",
    "pipeline",
    "visitors",
    "music",
    "watermarks",
    "reports",
    "brand",
    "users",
    "plan",
  ]) {
    await page.goto(`${PHOTOS}/studio/${id}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Studio sections" })).toBeVisible();
  }
});

test("small screens get a top strip instead of the floating sidebar", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto(`${PHOTOS}/studio/overview`, { waitUntil: "networkidle" });
  const nav = page.getByRole("navigation", { name: "Studio sections" });
  expect((await nav.boundingBox())!.y).toBeLessThan(5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
