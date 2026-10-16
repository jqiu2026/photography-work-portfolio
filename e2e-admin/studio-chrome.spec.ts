import { expect, test } from "@playwright/test";

const PHOTOS = "http://localhost:3302";

/** Scale applied to a sidebar entry (the matrix `a` of its transform). */
const scaleOf = (page: import("@playwright/test").Page, label: string) =>
  page
    .getByRole("navigation", { name: "Studio sections" })
    .locator("a[data-dock-item]")
    .filter({ hasText: new RegExp(`^${label}$`) })
    .evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a);

test("the studio sidebar: selected entry is largest, the pointer magnifies the nearest, the rest shrink", async ({
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

  // no pointer yet: the selected entry is the largest, far ones are the smallest
  await expect.poll(() => scaleOf(page, "Dashboard")).toBeGreaterThan(1.4);
  const far = await scaleOf(page, "Settings");
  expect(far).toBeLessThan(1);

  // move to an entry far from the selected one: it grows past its resting size, the selected one stays the largest
  const target = nav.getByRole("link", { name: "Store", exact: true });
  const box = (await target.boundingBox())!;
  await page.mouse.move(box.x + 30, box.y + box.height / 2, { steps: 6 });
  await expect.poll(() => scaleOf(page, "Store")).toBeGreaterThan(1.3);
  expect(await scaleOf(page, "Dashboard")).toBeGreaterThanOrEqual(await scaleOf(page, "Store"));

  // leaving the sidebar area relaxes it again
  await page.mouse.move(900, 450, { steps: 4 });
  await expect.poll(() => scaleOf(page, "Store")).toBeLessThan(1.1);

  // entries are real links
  await target.click();
  await expect(page).toHaveURL(/\/studio\/orders$/);
  await expect(nav.getByRole("link", { name: "Store", exact: true })).toHaveAttribute("aria-current", "page");
  // the group's pages are quiet tabs on the page itself
  const tabs = page.getByRole("navigation", { name: "Store pages" });
  for (const t of ["Orders and prices", "Payments"]) await expect(tabs.getByRole("link", { name: t })).toBeVisible();
});

test("the dashboard shows real totals and every other section keeps its heading and the sidebar", async ({ page }) => {
  await page.goto(`${PHOTOS}/studio/overview`, { waitUntil: "networkidle" });
  for (const name of ["Revenue", "Upcoming", "Recent activity", "Needs attention", "Galleries"])
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Studio sections" }).locator("a[data-dock-item], a.st-dock-brand"),
  ).toHaveCount(7); // brand + 6 groups (the open group also lists its pages)
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
