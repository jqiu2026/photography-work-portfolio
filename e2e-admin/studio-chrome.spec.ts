import { expect, test } from "@playwright/test";

const PHOTOS = "http://localhost:3302";

/** Scale applied to a sidebar entry (the matrix `a` of its transform). */
const scaleOf = (page: import("@playwright/test").Page, label: string) =>
  page
    .getByRole("navigation", { name: "Studio sections" })
    .getByRole("link", { name: label, exact: true })
    .evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a);

test("the studio sidebar: selected entry is largest, the pointer magnifies the nearest, the rest shrink", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${PHOTOS}/studio/overview`, { waitUntil: "networkidle" });
  const nav = page.getByRole("navigation", { name: "Studio sections" });
  await expect(nav.getByRole("link", { name: "Overview", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Good (morning|afternoon|evening)/);

  // no pointer yet: the selected entry is the largest, far ones are the smallest
  await expect.poll(() => scaleOf(page, "Overview")).toBeGreaterThan(1.4);
  const far = await scaleOf(page, "Automations");
  expect(far).toBeLessThan(1);

  // move to an entry far from the selected one: it grows past its resting size, the selected one stays the largest
  const target = nav.getByRole("link", { name: "Money", exact: true });
  const box = (await target.boundingBox())!;
  await page.mouse.move(box.x + 30, box.y + box.height / 2, { steps: 6 });
  await expect.poll(() => scaleOf(page, "Money")).toBeGreaterThan(1.3);
  expect(await scaleOf(page, "Overview")).toBeGreaterThanOrEqual(await scaleOf(page, "Money"));

  // leaving the sidebar area relaxes it again
  await page.mouse.move(900, 450, { steps: 4 });
  await expect.poll(() => scaleOf(page, "Money")).toBeLessThan(1.1);

  // entries are real links
  await target.click();
  await expect(page).toHaveURL(/\/studio\/quotes$/);
  await expect(nav.getByRole("link", { name: "Money", exact: true })).toHaveAttribute("aria-current", "page");
  // the group's pages are quiet tabs on the page itself
  const tabs = page.getByRole("navigation", { name: "Money pages" });
  for (const t of ["Quotes", "Packages", "Invoices", "Billing"])
    await expect(tabs.getByRole("link", { name: t })).toBeVisible();
});

test("the dashboard shows real totals and every other section keeps its heading and the sidebar", async ({ page }) => {
  await page.goto(`${PHOTOS}/studio/overview`, { waitUntil: "networkidle" });
  for (const name of ["Revenue", "Upcoming", "Recent activity", "Needs attention", "Galleries"])
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Studio sections" }).getByRole("link")).toHaveCount(7); // brand + 6 groups
  for (const id of ["calendar", "packages", "billing", "tasks", "pipeline"]) {
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
