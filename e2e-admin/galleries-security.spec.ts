import { expect, type Page, test } from "@playwright/test";
import sharp from "sharp";
import { newGallery, publishOpenGallery, uploadPhotos } from "./gallery-helpers";

/** Per-gallery security and look: capture-attempt keys, strikes and lock-outs, hold to view, overlay, idle, download cap, styling. */
const PHOTOS = "http://localhost:3302";
const uid = Date.now().toString(36);
const email = `sec-${uid}@example.test`;
test.describe.configure({ mode: "serial" });
const slow = expect.configure({ timeout: 25_000 });

let pass = "";
let url = "";
const jpeg = (color: string) =>
  sharp({ create: { width: 1602, height: 1000, channels: 3, background: color } })
    .jpeg()
    .toBuffer();
const key = (page: Page, init: KeyboardEventInit) =>
  page.evaluate((i) => window.dispatchEvent(new KeyboardEvent("keydown", { ...i, bubbles: true })), init);
const openAsClient = async (page: Page) => {
  await page.goto(`${PHOTOS}/client`, { waitUntil: "networkidle" });
  await page.getByLabel("Passcode").fill(pass);
  await page.getByRole("button", { name: "Open my gallery" }).click();
};
const studioSetting = async (page: Page, tab: string) => {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: tab }).click();
};

test("owner makes a gallery and sets its security and look", async ({ page }) => {
  await page.goto(`${PHOTOS}/studio/clients`, { waitUntil: "networkidle" });
  await page.getByLabel("Name").fill(`Sec Client ${uid}`);
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Add client" }).click();
  await slow(page.getByRole("status")).toContainText("Client added");
  await page.goto(`${PHOTOS}/studio/shoots`, { waitUntil: "networkidle" });
  await page.getByLabel("Client").selectOption({ label: `Sec Client ${uid}` });
  await page.getByLabel("Title").fill(`Sec job ${uid}`);
  await page.getByRole("button", { name: "Add job" }).click();
  await slow(page.getByRole("listitem").filter({ hasText: `Sec job ${uid}` })).toBeVisible();

  const made = await newGallery(page, PHOTOS, `Sec job ${uid}`, `Secure ${uid}`);
  pass = made.passcode;
  url = made.url;
  await uploadPhotos(page, [
    { name: "one.jpg", mimeType: "image/jpeg", buffer: await jpeg("#aa4433") },
    { name: "two.jpg", mimeType: "image/jpeg", buffer: await jpeg("#33aa66") },
  ]);

  // look
  await page.getByRole("tab", { name: "Design" }).click();
  await page.getByLabel("Typeface").selectOption("serif");
  await page.getByLabel("Spacing").selectOption("wide");
  await page.getByLabel("Corners").selectOption("round");
  await page.getByLabel(/Show the cover large/).check();
  await page.getByLabel(/Show filenames/).check();
  await page.getByLabel(/Line above the title/).fill(`Studio ${uid}`);
  await page.getByLabel(/Closing note/).fill(`Thanks, ${uid}`);
  await page.getByLabel("Background colour (hex, optional)").fill("red");
  await page.getByRole("button", { name: "Save look" }).click();
  await slow(page.locator("p.st-error")).toContainText("hex");
  await page.getByLabel("Background colour (hex, optional)").fill("#101820");
  await page.getByRole("button", { name: "Save look" }).click();
  await slow(page.getByRole("status").filter({ hasText: "Look saved" })).toBeVisible();

  // downloads allowed, capped at one a day
  await page.getByRole("tab", { name: "Share" }).click();
  await page.getByLabel("What clients can download").selectOption("web");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await slow(page.getByRole("status").filter({ hasText: "Download setting saved" })).toBeVisible();

  // security: lock after two attempts, overlay on, one download a day
  await page.getByRole("tab", { name: "Security" }).click();
  await expect(page.getByText(/cannot stop everything/)).toBeVisible();
  await page.getByLabel("When a key or capture attempt is seen").selectOption("lock");
  await page.getByLabel("Attempts before a lock").fill("2");
  await page.getByLabel("Lock for (minutes)").fill("10");
  await page.getByLabel(/Tile a faint viewer code/).check();
  await page.getByLabel(/Most downloads per viewer per day/).fill("1");
  await page.getByRole("button", { name: "Save security" }).click();
  await slow(page.getByRole("status").filter({ hasText: "Security settings saved" })).toBeVisible();
  await publishOpenGallery(page);
});

test("the client sees the look, the overlay, and the download cap", async ({ browser }) => {
  const ctx = await browser.newContext();
  const c = await ctx.newPage();
  await openAsClient(c);
  await expect(c).toHaveURL(/\/client\/gallery$/, { timeout: 25_000 });
  const gd = c.locator(".gx");
  await expect(gd).toHaveAttribute("data-font", "serif");
  await expect(gd).toHaveAttribute("data-gap", "wide");
  await expect(gd).toHaveAttribute("data-corners", "round");
  await expect(c.locator(".gx-hero__img")).toBeVisible();
  await expect(c.getByText(`Studio ${uid}`)).toBeVisible();
  await expect(c.getByText(`Thanks, ${uid}`)).toBeVisible();
  await expect(c.locator(".gx-cap").first()).toContainText(".jpg");
  await expect(gd).toHaveCSS("background-color", "rgb(16, 24, 32)");
  await expect(c.locator("[data-viewer-overlay]")).toHaveCount(1);
  await expect(c.locator("html")).toHaveAttribute("data-guard-noselect", "");

  const m = (await c.locator("li[data-media-id]").first().getAttribute("data-media-id")) as string;
  expect((await c.request.get(`${PHOTOS}/client/download?m=${m}&size=web`)).status()).toBe(200);
  const second = await c.request.get(`${PHOTOS}/client/download?m=${m}&size=web`);
  expect(second.status()).toBe(429);
  expect(((await second.json()) as { error: string }).error).toMatch(/daily download limit \(1\)/);
  await ctx.close();
});

test("screenshot and save keys: a warning first, the second attempt locks the viewer out; the studio sees both", async ({
  browser,
}) => {
  const ctx = await browser.newContext();
  const c = await ctx.newPage();
  await openAsClient(c);
  await expect(c).toHaveURL(/\/client\/gallery$/, { timeout: 25_000 });
  await c.locator("li[data-media-id]").first().waitFor();

  const seen: string[] = [];
  c.on("response", async (r) => {
    if (r.url().includes("security-event")) seen.push(`${r.status()} ${await r.text().catch(() => "")}`);
  });
  await key(c, { key: "PrintScreen", code: "PrintScreen" });
  await expect(c.getByRole("alertdialog")).toBeVisible();
  await expect(c.locator("html")).toHaveClass(/hl-guard-hide/);
  await c.getByRole("button", { name: "OK, I understand" }).click();
  await expect(c).toHaveURL(/\/client\/gallery$/); // one attempt only warns

  await key(c, { key: "s", code: "KeyS", ctrlKey: true });
  await expect(c, `events: ${seen.join(" | ")}`).toHaveURL(/\/client\?locked=1$/, { timeout: 25_000 });
  await expect(c.getByRole("alert")).toContainText("closed because a screenshot or save was attempted");

  // the same viewer cannot simply come back in with the passcode
  await openAsClient(c);
  await expect(c).toHaveURL(/\/client\?locked=1$/, { timeout: 25_000 });
  // and the photographs are no longer served
  const r = await c.request.post(`${PHOTOS}/api/client/security-event`, { data: { kind: "screenshot" } });
  expect(r.status()).toBe(401);
  await ctx.close();
});

test("the studio sees the attempts and the lock, and can let the viewer back in", async ({ page, browser }) => {
  await studioSetting(page, "Activity");
  const log = page.getByRole("list", { name: "Capture attempts" });
  await expect(log).toContainText("screenshot · PrintScreen");
  await expect(log).toContainText("save · Ctrl+S");
  await expect(log).toContainText("Locked out");
  await page.goto(`${PHOTOS}/studio/activity`, { waitUntil: "networkidle" });
  await expect(page.getByText(/Locked a viewer out of/).first()).toBeVisible();

  await studioSetting(page, "Security");
  await page.getByRole("button", { name: "Let locked-out viewers back in" }).click();
  await slow(page.getByRole("status").filter({ hasText: "Let them back in" })).toBeVisible();

  const ctx = await browser.newContext();
  const c = await ctx.newPage();
  await openAsClient(c);
  await expect(c).toHaveURL(/\/client\/gallery$/, { timeout: 25_000 });
  await ctx.close();
});

test("hold to view conceals photographs until the pointer is held; log-only never locks", async ({ page, browser }) => {
  await studioSetting(page, "Security");
  await page.getByLabel(/stay blurred until the viewer presses and holds/).check();
  await page.getByLabel("When a key or capture attempt is seen").selectOption("log");
  await page.getByRole("button", { name: "Save security" }).click();
  await slow(page.getByRole("status").filter({ hasText: "Security settings saved" })).toBeVisible();

  const ctx = await browser.newContext();
  const c = await ctx.newPage();
  await openAsClient(c);
  await expect(c).toHaveURL(/\/client\/gallery$/, { timeout: 25_000 });
  const html = c.locator("html");
  await expect(html).toHaveClass(/hl-guard-conceal/);
  await expect(html).not.toHaveClass(/hl-guard-reveal/);
  await c.mouse.move(300, 300);
  await c.mouse.down();
  await expect(html).toHaveClass(/hl-guard-reveal/);
  await c.mouse.up();
  await expect(html).not.toHaveClass(/hl-guard-reveal/);
  for (let i = 0; i < 4; i++) await key(c, { key: "PrintScreen", code: "PrintScreen" });
  await c.waitForTimeout(500);
  await expect(c).toHaveURL(/\/client\/gallery$/); // log-only: never locked
  await ctx.close();
});

test("a gallery with protection off has no guard, no overlay and no events", async ({ page, browser }) => {
  await studioSetting(page, "Security");
  await page.locator("#gm-security select").first().selectOption("off");
  await page.getByLabel(/Tile a faint viewer code/).uncheck();
  await page.getByRole("button", { name: "Save security" }).click();
  await slow(page.getByRole("status").filter({ hasText: "Security settings saved" })).toBeVisible();

  const ctx = await browser.newContext();
  const c = await ctx.newPage();
  await openAsClient(c);
  await expect(c).toHaveURL(/\/client\/gallery$/, { timeout: 25_000 });
  await expect(c.locator("html")).not.toHaveAttribute("data-guard", /.+/);
  await expect(c.locator("[data-viewer-overlay]")).toHaveCount(0);
  await ctx.close();
});
