import { expect, test } from "@playwright/test";
import { choose, pickDate, note } from "./ui";
import sharp from "sharp";
import { enterGallery, newGallery, publishOpenGallery, uploadPhotos } from "./gallery-helpers";

/**
 * The gallery editor's settings, end to end: brand details, a watermark, free-download rules (size, watermark, PIN, limit),
 * the cover page and rules note, a banner, the About tab, an email gate with the Visitors list, music, price sheets, reports,
 * and the two plans.
 */
const PHOTOS = "http://localhost:3302";
const uid = Date.now().toString(36);
const email = `set-${uid}@example.test`;
test.describe.configure({ mode: "serial" });
const slow = expect.configure({ timeout: 25_000 });

let slug = "";
let url = "";
let photo: Buffer;
const wav = () => {
  const n = 8000;
  const b = Buffer.alloc(44 + n);
  b.write("RIFF", 0);
  b.writeUInt32LE(36 + n, 4);
  b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(8000, 24);
  b.writeUInt32LE(8000, 28);
  b.writeUInt16LE(1, 32);
  b.writeUInt16LE(8, 34);
  b.write("data", 36);
  b.writeUInt32LE(n, 40);
  b.fill(128, 44);
  return b;
};

test("owner sets brand, a watermark, a track, rules and the branding of a gallery", async ({ page }) => {
  // brand details (shown in About)
  await page.goto(`${PHOTOS}/studio/brand`, { waitUntil: "networkidle" });
  await page.getByLabel("Brand name").fill(`Set Studio ${uid}`);
  await page.getByLabel("Email", { exact: true }).fill(`hello-${uid}@example.test`);
  await page.getByRole("button", { name: "Save brand details" }).click();
  await slow(note(page).filter({ hasText: "Brand details saved" }).first()).toBeVisible();

  // a watermark
  await page.goto(`${PHOTOS}/studio/watermarks`, { waitUntil: "networkidle" });
  await page.getByLabel("Name", { exact: true }).fill(`Mark ${uid}`);
  await page.getByLabel("Words", { exact: true }).fill(`© Set ${uid}`);
  await page.getByRole("button", { name: "Add watermark" }).click();
  await slow(page.getByRole("list", { name: "Watermarks" })).toContainText(`Mark ${uid}`);

  // a track
  await page.goto(`${PHOTOS}/studio/music`, { waitUntil: "networkidle" });
  await page.locator("input[type=file]").setInputFiles({ name: "quiet.wav", mimeType: "audio/wav", buffer: wav() });
  await page.getByLabel("Title (blank = the file name)").fill(`Quiet ${uid}`);
  await page.getByRole("button", { name: "Add track" }).click();
  await slow(page.getByRole("list", { name: "Tracks" })).toContainText(`Quiet ${uid}`);

  // a client, a job, a gallery with one large photograph
  await page.goto(`${PHOTOS}/studio/clients`, { waitUntil: "networkidle" });
  await page.getByLabel("Name").fill(`Set Client ${uid}`);
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Add client" }).click();
  await slow(note(page).last()).toContainText("Client added");
  await page.goto(`${PHOTOS}/studio/shoots`, { waitUntil: "networkidle" });
  await choose(page.getByLabel("Client"), `Set Client ${uid}`);
  await page.getByLabel("Title").fill(`Set job ${uid}`);
  await page.getByRole("button", { name: "Add job" }).click();
  await slow(page.getByRole("listitem").filter({ hasText: `Set job ${uid}` })).toBeVisible();
  const made = await newGallery(page, PHOTOS, `Set job ${uid}`, `Set gallery ${uid}`);
  slug = made.slug;
  url = made.url;
  photo = await sharp({ create: { width: 2400, height: 1600, channels: 3, background: "#3a6ea5" } })
    .jpeg()
    .toBuffer();
  await uploadPhotos(page, [{ name: "wide.jpg", mimeType: "image/jpeg", buffer: photo }]);

  // downloads: a free 720 px rule with the watermark, and a PIN-protected one with a limit and a license
  await page.getByRole("tab", { name: "Downloads" }).click();
  const rule = page.getByRole("form", { name: "Download rule" });
  await rule.getByLabel("Rule name (visitors see it)").fill("Free (720 px)");
  await choose(rule.getByLabel("Watermark"), `Mark ${uid}`);
  await rule.getByRole("button", { name: "Add rule" }).click();
  await slow(note(page).filter({ hasText: "Download rule saved" }).first()).toBeVisible();
  await rule.getByLabel("Rule name (visitors see it)").fill("High resolution (PIN)");
  await rule.getByLabel(/Longest side in pixels/).fill("1600");
  await rule.getByLabel(/Downloads per visitor/).fill("2");
  await rule.getByLabel(/^PIN/).fill("2468");
  await rule.getByLabel(/License to accept/).fill("<p><b>Personal use only.</b> Credit <i>Set Studio</i>.</p>");
  await rule.getByRole("button", { name: "Add rule" }).click();
  await slow(page.getByRole("list", { name: "Download rules" })).toContainText("High resolution (PIN)");

  // branding: a rules note pasted as HTML, a banner, About text, the playlist
  await page.getByRole("tab", { name: "Branding" }).click();
  await page.getByLabel("Note heading").fill("House rules");
  await page
    .getByLabel(/^Note \(blank/)
    .fill("<p><b>Please read.</b> Use the photos kindly.</p><ul><li>Keep the watermark</li><li>Tag me</li></ul>");
  await page.getByLabel("Show a banner across the top").check();
  await page.getByLabel("Banner text").fill(`Book me for your event ${uid}`);
  await page.getByLabel(/A few lines about you/).fill(`About text ${uid}`);
  await page.getByLabel(`Quiet ${uid}`).check();
  await page.getByRole("button", { name: "Save branding" }).click();
  await slow(note(page).filter({ hasText: "Look saved" }).first()).toBeVisible();

  // access: ask visitors for an email, a shoot date, open link, published
  await page.getByRole("tab", { name: "Settings" }).click();
  await pickDate(page.getByLabel("Shoot date"), "2026-06-06");
  await page.getByRole("button", { name: "Save settings" }).click();
  await slow(note(page).filter({ hasText: "Gallery settings saved" }).first()).toBeVisible();
  await page.getByRole("tab", { name: "Share" }).click();
  await page.getByLabel("Ask visitors for their email address before they see the gallery").check();
  await page.getByRole("button", { name: "Save", exact: true }).first().click();
  await slow(note(page).filter({ hasText: "Access settings saved" }).first()).toBeVisible();
  await choose(
    page.getByLabel("Who can open the link"),
    "Anyone with the link (view and shop; the passcode adds proofing)",
  );
  await page.getByRole("button", { name: "Save link" }).click();
  await slow(note(page).filter({ hasText: "Link saved" }).first()).toBeVisible();
  await publishOpenGallery(page);
});

test("a visitor gives an email, sees the cover, the rules note and the banner, and finds About", async ({
  browser,
}) => {
  const ctx = await browser.newContext();
  const v = await ctx.newPage();
  await v.goto(`${PHOTOS}/g/${slug}`, { waitUntil: "networkidle" });
  // the email gate comes first
  await v.getByLabel("Email").fill("not-an-email");
  await v.getByRole("button", { name: "Open the gallery" }).click();
  await slow(v.locator("p[role=alert]")).toContainText("valid email");
  await v.getByLabel("Email").fill(`visitor-${uid}@example.test`);
  await v.getByLabel("Name (optional)").fill("Vee Sitor");
  await v.getByRole("button", { name: "Open the gallery" }).click();
  // the cover page, then the note
  await expect(v.getByRole("heading", { level: 1 })).toContainText(`Set gallery ${uid}`, { timeout: 25_000 });
  await v.getByRole("button", { name: "View Gallery" }).click();
  const note = v.getByRole("dialog", { name: "House rules" });
  await expect(note.getByText("Please read.")).toBeVisible();
  await expect(note.locator("li")).toHaveCount(2); // the pasted HTML became a list
  await note.getByRole("button", { name: "Continue" }).click();
  await expect(v.getByText(`Book me for your event ${uid}`)).toBeVisible();
  // About shows the brand and the text
  await v.getByRole("button", { name: "About" }).click();
  await expect(v.getByText(`About text ${uid}`)).toBeVisible();
  await expect(v.getByRole("heading", { level: 1 })).toContainText(`Set Studio ${uid}`);
  await expect(v.getByRole("link", { name: `hello-${uid}@example.test` })).toBeVisible();
  // the music player is there
  await expect(v.getByRole("group", { name: "Music" })).toContainText(`Quiet ${uid}`);
  await ctx.close();
});

test("free downloads follow their rules: resized and marked, a PIN, a license, a limit", async ({ browser, page }) => {
  const ctx = await browser.newContext();
  const v = await ctx.newPage();
  await v.goto(`${PHOTOS}/g/${slug}`, { waitUntil: "networkidle" });
  await v.getByLabel("Email").fill(`second-${uid}@example.test`);
  await v.getByRole("button", { name: "Open the gallery" }).click();
  await enterGallery(v);
  await v.getByRole("button", { name: "Open wide.jpg" }).click();
  const lb = v.getByRole("dialog", { name: "Photograph" });
  const free = lb.getByRole("listitem").filter({ hasText: "Free (720 px)" });
  const href = (await free.getByRole("link", { name: "Download" }).getAttribute("href")) as string;
  const got = await v.request.get(`${PHOTOS}${href}`);
  expect(got.status()).toBe(200);
  const meta = await sharp(await got.body()).metadata();
  expect(Math.max(meta.width ?? 0, meta.height ?? 0)).toBe(720);
  expect(got.headers()["content-disposition"]).toContain("720px");
  // the watermark changed the picture (a flat blue photograph would otherwise stay flat)
  const stats = await sharp(await got.body()).stats();
  expect(stats.channels.some((c) => c.max - c.min > 20)).toBe(true);

  // the PIN rule: refused until the PIN is entered, then the license must be accepted
  const pinHref = href.replace(/rule=[0-9a-f-]+/, "rule=RULE");
  const hi = lb.getByRole("listitem").filter({ hasText: "High resolution (PIN)" });
  await hi.getByLabel("PIN").fill("0000");
  await hi.getByRole("button", { name: "Unlock" }).click();
  await slow(v.locator("p[role=alert]")).toContainText("not right");
  await hi.getByLabel("PIN").fill("2468");
  await hi.getByRole("button", { name: "Unlock" }).click();
  await expect(hi.getByRole("button", { name: "Accept the license first" })).toBeVisible({ timeout: 25_000 });
  await hi.locator("summary").click();
  await hi.getByLabel("I accept this licence").check();
  const link = hi.getByRole("link", { name: "Download" });
  const hiHref = (await link.getAttribute("href")) as string;
  expect(pinHref).toContain("RULE");
  const a = await v.request.get(`${PHOTOS}${hiHref}`);
  expect(a.status()).toBe(200);
  expect(
    Math.max(
      ...Object.values(await sharp(await a.body()).metadata())
        .filter((x): x is number => typeof x === "number" && x < 5000)
        .slice(0, 2),
    ),
  ).toBe(1600);
  expect((await v.request.get(`${PHOTOS}${hiHref}`)).status()).toBe(200); // the second of two
  expect((await v.request.get(`${PHOTOS}${hiHref}`)).status()).toBe(429); // the limit
  // a rule that is not this gallery's is refused
  expect(
    (
      await v.request.get(`${PHOTOS}${href.replace(/rule=[0-9a-f-]+/, "rule=00000000-0000-4000-8000-000000000000")}`)
    ).status(),
  ).toBe(404);
  await ctx.close();

  // the studio lists the two visitors who gave an email
  await page.goto(`${PHOTOS}/studio/visitors`, { waitUntil: "networkidle" });
  await expect(page.getByText(`visitor-${uid}@example.test`)).toBeVisible();
  await expect(page.getByText(`second-${uid}@example.test`)).toBeVisible();
});

test("the music file plays with byte ranges for people who opened the gallery, and not for strangers", async ({
  browser,
}) => {
  const ctx = await browser.newContext();
  const v = await ctx.newPage();
  await v.goto(`${PHOTOS}/g/${slug}`, { waitUntil: "networkidle" });
  await v.getByLabel("Email").fill(`third-${uid}@example.test`);
  await v.getByRole("button", { name: "Open the gallery" }).click();
  await enterGallery(v);
  const src = await v.locator("audio").getAttribute("src");
  expect(src).toMatch(/^\/g\/audio\/[0-9a-f-]{36}$/);
  const full = await v.request.get(`${PHOTOS}${src}`);
  expect(full.status()).toBe(200);
  expect((await full.body()).length).toBe(44 + 8000);
  const part = await v.request.get(`${PHOTOS}${src}`, { headers: { range: "bytes=0-99" } });
  expect(part.status()).toBe(206);
  expect(part.headers()["content-range"]).toBe(`bytes 0-99/${44 + 8000}`);
  await ctx.close();
  const stranger = await browser.newContext();
  expect((await stranger.request.get(`${PHOTOS}${src}`)).status()).toBe(404);
  await stranger.close();
});

test("price sheets, reports, and the Free plan's limits (then back to Full Frame)", async ({ page }) => {
  // a second price sheet, picked by the gallery
  await page.goto(`${PHOTOS}/studio/orders`, { waitUntil: "networkidle" });
  await page.getByLabel("New sheet name").fill(`Sheet ${uid}`);
  await page.getByRole("form", { name: "New price sheet" }).getByRole("button", { name: "Add sheet" }).click();
  await slow(note(page).filter({ hasText: "Price sheet created" }).first()).toBeVisible();
  await page.goto(`${url}#shop`, { waitUntil: "networkidle" });
  await choose(page.getByLabel("Price sheet"), `Sheet ${uid}`);
  await page.getByLabel(/Smallest order/).fill("25");
  await page.getByRole("button", { name: "Save store settings" }).click();
  await slow(note(page).filter({ hasText: "Store settings saved" }).first()).toBeVisible();

  // reports
  await page.goto(`${PHOTOS}/studio/reports`, { waitUntil: "networkidle" });
  for (const t of ["Sales", "Orders", "Order files", "Products", "Invoices"])
    await expect(page.getByRole("navigation", { name: "Reports" }).getByRole("link", { name: t })).toBeVisible();
  await page.getByRole("navigation", { name: "Reports" }).getByRole("link", { name: "Order files" }).click();
  await expect(page.getByRole("table")).toContainText("free rule");

  // plan: Full Frame at 100% off bills $0; Free blocks the store and music with a message that names the upgrade
  await page.goto(`${PHOTOS}/studio/plan`, { waitUntil: "networkidle" });
  await expect(page.getByText("100% discount, billed monthly at $0.00")).toBeVisible();
  await expect(page.getByText("No payment needed").first()).toBeVisible();
  await page.getByRole("button", { name: "Switch to Free" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Switch to Free" }).click();
  await slow(note(page).filter({ hasText: "Switched to Free" }).first()).toBeVisible();
  await page.goto(`${url}#shop`, { waitUntil: "networkidle" });
  await page.getByLabel("Open the store in this gallery").check();
  await page.getByRole("button", { name: "Save store settings" }).click();
  await slow(note(page).last()).toContainText("Full Frame");
  await page.goto(`${PHOTOS}/studio/reports`, { waitUntil: "networkidle" });
  await expect(page.getByText("Reports are part of Full Frame")).toBeVisible();
  await page.goto(`${PHOTOS}/studio/plan`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /^Upgrade/ }).click();
  await slow(note(page).filter({ hasText: "Back on Full Frame" }).first()).toBeVisible();
  await expect(page.getByText("100% discount, billed monthly at $0.00")).toBeVisible();
});
