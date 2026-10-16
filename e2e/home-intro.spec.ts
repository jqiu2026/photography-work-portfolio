import { expect, test } from "@playwright/test";
import { photos } from "./routes";

/** The home page opens with a short cinematic intro (on every fresh load), then the top bar and the opening text arrive. */
const bar = (page: import("@playwright/test").Page) => page.locator(".pub-bar");
const barOffset = (page: import("@playwright/test").Page) =>
  bar(page).evaluate((el) => el.getBoundingClientRect().bottom);

test("plays on the first visit: the page waits behind it, Skip ends it, and moving around the site does not replay it", async ({
  page,
}) => {
  await page.goto(`${photos}/`, { waitUntil: "domcontentloaded" });
  const intro = page.locator(".pub-intro");
  await expect(intro).toBeVisible();
  await expect(intro.getByText("Jerry Qiu")).toHaveCount(1);
  // the top bar is held above the viewport and the page behind cannot be tabbed into
  expect(await barOffset(page)).toBeLessThanOrEqual(0);
  await expect(page.locator("html")).toHaveCSS("overflow", "hidden");
  await expect(page.locator(".pub-bar")).toHaveJSProperty("inert", true);

  await intro.getByRole("button", { name: "Skip intro" }).click();
  await expect(page.locator(".pub-intro:not([hidden])")).toHaveCount(0);
  await expect(bar(page)).toBeVisible();
  expect(await barOffset(page)).toBeGreaterThan(20);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("html")).not.toHaveCSS("overflow", "hidden");
  await expect(page.locator(".pub-bar")).toHaveJSProperty("inert", false);

  // a fresh load plays it again
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator(".pub-intro")).toBeVisible();
  expect(await barOffset(page)).toBeLessThanOrEqual(0);
});

test("Escape skips it, and left alone it finishes by itself and reveals the page", async ({ browser }) => {
  const ctx = await browser.newContext();
  const a = await ctx.newPage();
  await a.goto(`${photos}/`, { waitUntil: "domcontentloaded" });
  await expect(a.locator(".pub-intro")).toBeVisible();
  await a.keyboard.press("Escape");
  await expect(a.locator(".pub-intro:not([hidden])")).toHaveCount(0);
  await ctx.close();

  const ctx2 = await browser.newContext();
  const b = await ctx2.newPage();
  await b.goto(`${photos}/`, { waitUntil: "domcontentloaded" });
  await expect(b.locator(".pub-intro")).toBeVisible();
  await expect(b.locator(".pub-intro:not([hidden])")).toHaveCount(0, { timeout: 12000 });
  expect(await barOffset(b)).toBeGreaterThan(20);
  await expect(b.getByRole("link", { name: "See the portfolio" })).toBeVisible();
  await ctx2.close();
});

test("reduced motion and no JavaScript get the page straight away, with no intro", async ({ browser }) => {
  for (const opts of [{ reducedMotion: "reduce" as const }, { javaScriptEnabled: false }]) {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    await page.goto(`${photos}/`, { waitUntil: "load" });
    await expect(page.locator(".pub-intro:visible")).toHaveCount(0);
    await expect(bar(page)).toBeVisible();
    expect(await barOffset(page)).toBeGreaterThan(20);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: "See the portfolio" })).toBeVisible();
    await ctx.close();
  }
});

test("only the home page has an intro, and inner pages always show the bar", async ({ page }) => {
  await page.goto(`${photos}/about`, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".pub-intro")).toHaveCount(0);
  await expect(bar(page)).toBeVisible();
  expect(await barOffset(page)).toBeGreaterThan(20);
});
