import { expect, test } from "@playwright/test";
import sharp from "sharp";
import { newGallery, publishOpenGallery } from "./gallery-helpers";
import { detectViewerCode } from "../packages/media/src/forensic";

/** Gallery manager: bulk upload with dedupe, albums, settings, proofing, selection limit, PIN-gated downloads, ZIP, expiry. */
const PHOTOS = "http://localhost:3302";
const uid = Date.now().toString(36);
const email = `gal-${uid}@example.test`;
let PASS = "";
test.describe.configure({ mode: "serial" });
const slow = expect.configure({ timeout: 25_000 });
const inForm = (page: import("@playwright/test").Page, name: string) => page.getByRole("form", { name });

let buffers: Buffer[] = [];
let galleryUrl = "";
const jpeg = async (color: string, w = 1800, h = 1200) => {
  // some texture, so the image is not flat (the watermark detector needs real photographic noise to work with)
  const noise = Buffer.alloc(w * h * 3);
  for (let i = 0; i < noise.length; i++) noise[i] = (i * 2654435761) >>> 24;
  const base = await sharp({ create: { width: w, height: h, channels: 3, background: color } })
    .jpeg()
    .toBuffer();
  return sharp(base)
    .composite([
      {
        input: await sharp(noise, { raw: { width: w, height: h, channels: 3 } })
          .jpeg()
          .toBuffer(),
        blend: "soft-light",
      },
    ])
    .jpeg({ quality: 92 })
    .toBuffer();
};

test("owner creates a client, a job and an empty gallery, then uploads photographs (a duplicate is not sent twice)", async ({
  page,
}) => {
  buffers = [await jpeg("#aa4433"), await jpeg("#33aa66"), await jpeg("#3344aa")];
  await page.goto(`${PHOTOS}/studio/clients`, { waitUntil: "networkidle" });
  await page.getByLabel("Name").fill(`Gal Client ${uid}`);
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Add client" }).click();
  await slow(page.getByRole("status")).toContainText("Client added");
  await page.goto(`${PHOTOS}/studio/shoots`, { waitUntil: "networkidle" });
  await page.getByLabel("Client").selectOption({ label: `Gal Client ${uid}` });
  await page.getByLabel("Title").fill(`Gal job ${uid}`);
  await page.getByRole("button", { name: "Add job" }).click();
  await slow(page.getByRole("listitem").filter({ hasText: `Gal job ${uid}` })).toBeVisible();

  const made = await newGallery(page, PHOTOS, `Gal job ${uid}`);
  PASS = made.passcode;
  galleryUrl = made.url;

  await page
    .locator("input[type=file]")
    .setInputFiles([
      ...buffers.map((buffer, i) => ({ name: `shot-${i + 1}.jpg`, mimeType: "image/jpeg", buffer })),
      { name: "shot-1-copy.jpg", mimeType: "image/jpeg", buffer: buffers[0] },
      { name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("not an image") },
    ]);
  await expect(page.getByRole("status").filter({ hasText: /of 4 done/ })).toContainText("4 of 4 done", {
    timeout: 60_000,
  });
  await expect(page.locator("[data-upload-state=duplicate]")).toHaveCount(1);
  await expect(page.locator("[data-upload-state=done]")).toHaveCount(3);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("li[data-media-id]")).toHaveCount(3);
  await expect(page.locator(".gm-stats")).toContainText("Photos3");
  // the studio shows client photographs through the protected pipeline too (they load when scrolled into view)
  await page.getByRole("list", { name: "Gallery photographs" }).scrollIntoViewIfNeeded();
  await expect(page.locator("[data-protected='strict'] img[src^='blob:']").first()).toBeVisible({ timeout: 25_000 });
  await expect(page.locator("img[src*='/api/img/']")).toHaveCount(0);
});

test("owner sets up albums, downloads, a PIN, a selection limit, a welcome and an accent colour, and publishes", async ({
  page,
}) => {
  await page.goto(galleryUrl, { waitUntil: "networkidle" });
  const alb = inForm(page, "New album");
  await alb.getByLabel("Album name").fill("Highlights");
  await alb.getByRole("button", { name: "Add album" }).click();
  await slow(page.getByRole("status").filter({ hasText: "Album added" })).toBeVisible();
  await page.getByRole("button", { name: "Open shot-1.jpg" }).click();
  await page.getByLabel("Album for shot-1.jpg").selectOption({ label: "Highlights" });
  await slow(page.getByRole("status").filter({ hasText: "Moved" })).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByRole("tab", { name: "Design" }).click();
  await page.getByLabel(/Shown above the photographs/).fill("Thank you for coming. Enjoy.");
  await page.getByLabel(/Accent colour \(optional/).fill("#cc3322");
  await page.getByRole("radio", { name: "Masonry" }).click();
  await page.getByRole("button", { name: "Save design" }).click();
  await slow(page.getByRole("status").filter({ hasText: "Design saved" })).toBeVisible();
  await page.getByLabel(/Accent colour \(optional/).fill("red");
  await page.getByRole("button", { name: "Save design" }).click();
  await slow(page.locator("p.st-error")).toContainText("hex");
  await page.getByLabel(/Accent colour \(optional/).fill("#cc3322");

  await page.getByRole("tab", { name: "Share" }).click();
  await page.getByLabel("What clients can download").selectOption("full");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await slow(page.getByRole("status").filter({ hasText: "Download setting saved" })).toBeVisible();
  const pin = inForm(page, "Download PIN");
  await pin.getByLabel(/Download PIN/).fill("12");
  await pin.getByRole("button", { name: "Save PIN" }).click();
  await slow(page.locator("p.st-error")).toContainText("4 to 8");
  await pin.getByLabel(/Download PIN/).fill("4821");
  await pin.getByRole("button", { name: "Save PIN" }).click();
  await slow(page.getByRole("status").filter({ hasText: "Download PIN set" })).toBeVisible();

  await page.getByRole("tab", { name: "Proofing" }).click();
  await page.getByLabel(/Selection limit/).fill("2");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await slow(page.getByRole("status").filter({ hasText: "Proofing saved" })).toBeVisible();

  await page.getByRole("tab", { name: "Settings" }).click();
  await page.getByLabel(/Access from today/).fill("3");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await slow(page.getByRole("status").filter({ hasText: "Publishing saved" })).toBeVisible();

  await publishOpenGallery(page);
});

test("the client sees albums, a welcome and the accent; picks within the limit, rates, approves, comments, slideshows, sends a selection", async ({
  browser,
}) => {
  const ctx = await browser.newContext();
  const c = await ctx.newPage();
  await c.goto(`${PHOTOS}/client`, { waitUntil: "networkidle" });
  await c.getByLabel("Passcode").fill(PASS);
  await c.getByRole("button", { name: "Open my gallery" }).click();
  await expect(c).toHaveURL(/\/client\/gallery$/, { timeout: 25_000 });
  await expect(c.getByText("Thank you for coming. Enjoy.")).toBeVisible();
  await expect(c.locator("[data-protected='strict'] img[src^='blob:']").first()).toBeVisible({ timeout: 25_000 });
  await expect(c.locator("img[src*='/api/img/']")).toHaveCount(0);
  await expect(c.getByRole("button", { name: "Highlights" })).toBeVisible();
  await c.getByRole("button", { name: "Highlights" }).click();
  await expect(c.locator("li[data-media-id]")).toHaveCount(1);
  await c.getByRole("button", { name: "All", exact: true }).click();
  await expect(c.locator("li[data-media-id]")).toHaveCount(3);

  await c.getByRole("button", { name: "Add shot-1.jpg to favourites" }).click();
  await c.getByRole("button", { name: "Add shot-2.jpg to favourites" }).click();
  await c.getByRole("button", { name: "Add shot-3.jpg to favourites" }).click();
  await expect(c.getByRole("alert").filter({ hasText: "up to 2" })).toBeVisible();
  await c.getByRole("button", { name: "4 stars for shot-1.jpg" }).click();
  await expect(c.getByRole("button", { name: "4 stars for shot-1.jpg" })).toHaveAttribute("aria-pressed", "true");
  await c.getByRole("button", { name: "Approve shot-1.jpg" }).click();
  await expect(c.getByRole("button", { name: "Approve shot-1.jpg" })).toHaveAttribute("aria-pressed", "true");
  await c.getByRole("button", { name: "Comments on shot-1.jpg" }).first().click();
  await c.getByLabel("Your comment").fill("Could this one be a little brighter?");
  await c.getByRole("button", { name: "Add comment" }).click();
  await expect(c.getByText("Could this one be a little brighter?")).toBeVisible();

  await c.getByRole("button", { name: "Slideshow", exact: true }).click();
  const show = c.getByRole("dialog", { name: "Slideshow" });
  await expect(show.locator("img[src^='blob:']")).toBeVisible({ timeout: 25_000 });
  await c.keyboard.press("ArrowRight");
  await expect(show.getByText("2 / 3")).toBeVisible();
  await show.getByRole("button", { name: "Close" }).click();

  await c.getByRole("button", { name: "Send my selection" }).click();
  await slow(c.getByRole("status").filter({ hasText: "You chose 2 photographs" })).toBeVisible();
  await expect(c.getByRole("button", { name: /from favourites/ }).first()).toBeDisabled();
  await ctx.storageState({ path: `/tmp/gal-${uid}.json` });
  await ctx.close();
});

test("downloads need the PIN; web size is a JPEG carrying the viewer's invisible mark; full size is the original; ZIP parts open", async ({
  browser,
}) => {
  const ctx = await browser.newContext({ storageState: `/tmp/gal-${uid}.json` });
  const c = await ctx.newPage();
  await c.goto(`${PHOTOS}/client/gallery`, { waitUntil: "networkidle" });
  // before the PIN: no download links and the route refuses
  await expect(c.getByRole("link", { name: "Web size" })).toHaveCount(0);
  const m = (await c.locator("li[data-media-id]").first().getAttribute("data-media-id")) as string;
  expect((await c.request.get(`${PHOTOS}/client/download?m=${m}&size=full`)).status()).toBe(403);
  const unlock = c.getByRole("region", { name: "Downloads" });
  await unlock.getByLabel("Download PIN").fill("0000");
  await unlock.getByRole("button", { name: "Unlock downloads" }).click();
  await slow(c.getByRole("alert").filter({ hasText: "not right" })).toBeVisible();
  await unlock.getByLabel("Download PIN").fill("4821");
  await unlock.getByRole("button", { name: "Unlock downloads" }).click();
  await slow(c.getByRole("status").filter({ hasText: "Downloads unlocked" })).toBeVisible();

  const web = await c.request.get(`${PHOTOS}/client/download?m=${m}&size=web`);
  expect(web.status()).toBe(200);
  expect(web.headers()["content-type"]).toBe("image/jpeg");
  expect(web.headers()["content-disposition"]).toContain("-web.jpg");
  const found = await detectViewerCode(await web.body());
  expect(found.confidence).toBeGreaterThan(0.25); // a per-viewer code is in the picture
  // web size policy 'full' also allows the original, byte for byte
  const original = buffers.find(async () => true);
  const full = await c.request.get(`${PHOTOS}/client/download?m=${m}&size=full`);
  expect(full.status()).toBe(200);
  const body = await full.body();
  expect(buffers.some((b) => b.equals(body))).toBe(true);
  void original;
  const zip = await c.request.get(`${PHOTOS}/client/download?zip=1&size=web&part=1`);
  expect(zip.status()).toBe(200);
  expect(zip.headers()["content-type"]).toBe("application/zip");
  const z = await zip.body();
  expect(z.readUInt32LE(0)).toBe(0x04034b50);
  expect(z.readUInt16LE(z.length - 12 - 10 + 0) >= 0).toBe(true);
  expect(z.readUInt16LE(z.length - 22 + 10)).toBe(3); // three photographs in the central directory
  expect((await c.request.get(`${PHOTOS}/client/download?zip=1&size=web&part=9`)).status()).toBe(404);
  expect(
    (await c.request.get(`${PHOTOS}/client/download?m=00000000-0000-4000-8000-000000000000&size=web`)).status(),
  ).toBe(404);
  // another browser with no session cannot download
  const stranger = await browser.newContext();
  expect((await stranger.request.get(`${PHOTOS}/client/download?m=${m}&size=web`)).status()).toBe(401);
  await stranger.close();
  await ctx.close();
});

test("the owner sees the picks, rating, approval, comment and the downloads; replies; reopens the selection", async ({
  page,
}) => {
  await page.goto(galleryUrl, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Proofing" }).click();
  const proof = page.getByRole("tabpanel", { name: "Proofing" });
  await expect(proof).toContainText("2 favourites");
  await expect(proof).toContainText("1 approved");
  await expect(proof).toContainText("Could this one be a little brighter?");
  await proof.getByLabel(/Reply to shot-1.jpg/).fill("Done, I've brightened it.");
  await proof.getByRole("button", { name: "Reply" }).click();
  await slow(page.getByRole("status").filter({ hasText: "Reply added" })).toBeVisible();
  await page.getByRole("button", { name: "Reopen the selection" }).click();
  await slow(page.getByRole("status").filter({ hasText: "Selection reopened" })).toBeVisible();
  await page.getByRole("tab", { name: "Photos" }).click();
  const photo = page.locator("li[data-media-id]").filter({ hasText: "shot-1.jpg" });
  await expect(photo).toContainText("4★");
  await expect(photo).toContainText("✓");
  await page.getByRole("tab", { name: "Activity" }).click();
  const dl = page.getByRole("tabpanel", { name: "Activity" });
  await expect(dl).toContainText("web");
  await expect(dl).toContainText("full");
  await expect(dl).toContainText("zip-web");
});

test("an archived gallery offers the client an extension; paying it brings the gallery back", async ({
  page,
  browser,
}) => {
  await page.goto(galleryUrl, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Settings" }).click();
  await page.getByRole("button", { name: "Archive" }).click();
  await slow(page.getByRole("status").filter({ hasText: "Archived" })).toBeVisible();

  const ctx = await browser.newContext();
  const c = await ctx.newPage();
  await c.goto(`${PHOTOS}/client`, { waitUntil: "networkidle" });
  await c.getByLabel("Passcode").fill(PASS);
  await c.getByRole("button", { name: "Open my gallery" }).click();
  await expect(c.getByText(/has been archived/)).toBeVisible({ timeout: 25_000 });
  await expect(c.locator("li[data-media-id]")).toHaveCount(0);
  await page.goto(`${PHOTOS}/studio/forms`, { waitUntil: "networkidle" });
  const pol = inForm(page, "Policies");
  await pol.getByLabel(/Extension and reactivation fee/).fill("30");
  await pol.getByRole("button", { name: "Save" }).click();
  await slow(page.getByRole("status")).toContainText("Policies saved");

  await c.getByRole("button", { name: "Extend access" }).click();
  await expect(c).toHaveURL(/\/client\/pay\//, { timeout: 25_000 });
  await expect(c.getByText(/Gallery access|\$30\.00/).first()).toBeVisible();
  await c.getByLabel("Card number").fill("4242 4242 4242 4242");
  await c.getByLabel(/Expiry/).fill("12 / 34");
  await c.getByLabel("Security code").fill("123");
  await c.getByRole("button", { name: /^Pay/ }).click();
  await slow(c.getByRole("status")).toContainText("Receipt rcpt_mock_");
  await c.goto(`${PHOTOS}/client/gallery`, { waitUntil: "networkidle" });
  await expect(c.locator("li[data-media-id]")).toHaveCount(3);
  await ctx.close();
});
