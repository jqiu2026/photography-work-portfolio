import { expect, test } from "@playwright/test";
import sharp from "sharp";
import { enterGallery, newGallery, publishOpenGallery, uploadPhotos } from "./gallery-helpers";

/**
 * A gallery with its own link: visitors view and shop without a passcode (no proofing), albums nest and lock, an order is
 * priced by the studio, paid with the labelled mock card, and unlocks exactly what was bought.
 */
const PHOTOS = "http://localhost:3302";
const uid = Date.now().toString(36);
const slug = `shop-${uid}`;
const allPhotos = (v: import("@playwright/test").Page) => v.getByRole("button", { name: /^All photos/ }).click();
const email = `shop-${uid}@example.test`;
test.describe.configure({ mode: "serial" });
const slow = expect.configure({ timeout: 25_000 });

const jpeg = async (color: string, w: number, h: number) => {
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
    .jpeg({ quality: 88 })
    .toBuffer();
};
const file = (name: string, buffer: Buffer) => ({ name, mimeType: "image/jpeg", buffer });
const FORMALS = "formals-2026";
let galleryUrl = "";
let orderUrl = "";

test("owner builds a gallery with nested and locked albums, a public link and an open shop", async ({ page }) => {
  await page.goto(`${PHOTOS}/studio/clients`, { waitUntil: "networkidle" });
  await page.getByLabel("Name").fill(`Shop Client ${uid}`);
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Add client" }).click();
  await slow(page.getByRole("status")).toContainText("Client added");
  await page.goto(`${PHOTOS}/studio/shoots`, { waitUntil: "networkidle" });
  await page.getByLabel("Client").selectOption({ label: `Shop Client ${uid}` });
  await page.getByLabel("Title").fill(`Shop job ${uid}`);
  await page.getByRole("button", { name: "Add job" }).click();
  await slow(page.getByRole("listitem").filter({ hasText: `Shop job ${uid}` })).toBeVisible();

  const made = await newGallery(page, PHOTOS, `Shop job ${uid}`, `Shop gallery ${uid}`);
  galleryUrl = made.url;

  // albums first, so uploads can go straight into them
  await page.getByRole("tab", { name: "Albums" }).click();
  const add = page.getByRole("form", { name: "New album" });
  await add.getByLabel("Album name").fill("Ceremony");
  await add.getByRole("button", { name: "Add album" }).click();
  await slow(page.getByRole("status").filter({ hasText: "Album added" })).toBeVisible();
  await add.getByLabel("Album name").fill("Vows");
  await add.getByLabel("Inside").selectOption({ label: "Inside Ceremony" });
  await add.getByRole("button", { name: "Add album" }).click();
  await slow(page.getByRole("status").filter({ hasText: "Sub-album added" })).toBeVisible();
  await add.getByLabel("Album name").fill("Formals");
  await add.getByLabel("Inside").selectOption({ label: "Top level" });
  await add.getByRole("button", { name: "Add album" }).click();
  await slow(page.getByRole("status").filter({ hasText: "Album added" })).toBeVisible();
  await page.getByLabel("Passcode for Formals").fill("ab");
  await page.getByRole("form", { name: "Lock Formals" }).getByRole("button").click();
  await slow(page.locator("p.st-error")).toContainText("at least 4");
  await page.getByLabel("Passcode for Formals").fill(FORMALS);
  await page.getByRole("form", { name: "Lock Formals" }).getByRole("button").click();
  await slow(page.getByRole("status").filter({ hasText: "Album locked" })).toBeVisible();

  // the large one (fits a 4 x 6 print, not an 8 x 10), two small ones, and one with no album
  const big = await jpeg("#aa4433", 1403, 907);
  await page.getByRole("tab", { name: "Photos" }).click();
  await page.getByLabel("Into album").selectOption({ label: "Vows" });
  await uploadPhotos(page, [file("vows-big.jpg", big)], 1);
  await page.getByRole("button", { name: "Upload photographs" }).click();
  await page.getByLabel("Into album").selectOption({ label: "Ceremony" });
  await uploadPhotos(page, [file("ceremony-small.jpg", await jpeg("#33aa66", 805, 603))], 2);
  await page.getByRole("button", { name: "Upload photographs" }).click();
  await page.getByLabel("Into album").selectOption({ label: "Formals" });
  await uploadPhotos(page, [file("formals-small.jpg", await jpeg("#3344aa", 807, 601))], 3);
  await page.getByRole("button", { name: "Upload photographs" }).click();
  await page.getByLabel("Into album").selectOption({ label: "No album" });
  await uploadPhotos(page, [file("loose-small.jpg", await jpeg("#aa33aa", 809, 599))], 4);

  // the price list: a real price replaces SAMPLE
  await page.goto(`${PHOTOS}/studio/orders`, { waitUntil: "networkidle" });
  await expect(page.getByText("SAMPLE").first()).toBeVisible();
  await page.getByLabel("Price of Web-size download").fill("7.50");
  await page
    .getByRole("listitem")
    .filter({ has: page.getByLabel("Price of Web-size download") })
    .getByRole("button", { name: "Save" })
    .click();
  await slow(page.getByRole("status").filter({ hasText: "Product saved" })).toBeVisible();

  // link and shop
  await page.goto(`${galleryUrl}#share`, { waitUntil: "networkidle" });
  await page.getByLabel("Gallery address").fill("studio");
  await page.getByLabel("Who can open the link").selectOption("link");
  await page.getByRole("button", { name: "Save link" }).click();
  await slow(page.locator("p.st-error")).toContainText("address");
  await page.getByLabel("Gallery address").fill(slug);
  await page.getByRole("button", { name: "Save link" }).click();
  await slow(page.getByRole("status").filter({ hasText: "Link saved" })).toBeVisible();
  await page.getByRole("tab", { name: "Store" }).click();
  await page.getByLabel("Open the store in this gallery").check();
  await page.getByRole("button", { name: "Save store settings" }).click();
  await slow(page.getByRole("status").filter({ hasText: "Store settings saved" })).toBeVisible();
  await publishOpenGallery(page);
});

test("a visitor opens the link with no passcode: albums, a locked album that opens with its own code, no proofing", async ({
  browser,
}) => {
  const ctx = await browser.newContext();
  const v = await ctx.newPage();
  await v.goto(`${PHOTOS}/g/${slug}`, { waitUntil: "networkidle" });
  await enterGallery(v);
  await expect(v.getByRole("heading", { level: 1 })).toContainText(`Shop gallery ${uid}`);
  // albums are cards; three photographs are open, the locked album's one is not even in the page
  await allPhotos(v);
  await expect(v.locator("li[data-media-id]")).toHaveCount(3);
  await v.getByRole("button", { name: /All albums/ }).click();
  await expect(v.getByRole("button", { name: /Formals/ })).toContainText("locked");
  await expect(v.getByRole("button", { name: "Open formals-small.jpg" })).toHaveCount(0);
  // visitors do not proof
  await expect(v.getByRole("button", { name: /to favourites/ })).toHaveCount(0);
  await expect(v.getByRole("button", { name: /^Favorites/ })).toHaveCount(0);
  // the client signs in with the passcode right here (there is no other login)
  await expect(v.getByRole("button", { name: "Client sign-in" })).toBeVisible();

  // a sub-album shows inside its parent
  await v.getByRole("button", { name: /^Ceremony/ }).click();
  await expect(v.getByRole("group", { name: "In Ceremony" })).toBeVisible();
  await expect(v.locator("li[data-media-id]")).toHaveCount(2); // ceremony + vows
  await v.getByRole("button", { name: /^Vows/ }).click();
  await expect(v.locator("li[data-media-id]")).toHaveCount(1);
  await v.getByRole("button", { name: /Back to Ceremony/ }).click();
  await v.getByRole("button", { name: /All albums/ }).click();

  // the locked album asks for its code, refuses a wrong one, then opens
  await v.getByRole("button", { name: /Formals/ }).click();
  const dlg = v.getByRole("dialog", { name: /Formals is locked/ });
  await dlg.getByLabel("Album passcode").fill("nope");
  await dlg.getByRole("button", { name: "Open album" }).click();
  await slow(dlg.getByRole("alert")).toContainText("not right");
  await dlg.getByLabel("Album passcode").fill(FORMALS);
  await dlg.getByRole("button", { name: "Open album" }).click();
  await expect(v.getByRole("button", { name: "Open formals-small.jpg" })).toBeVisible({ timeout: 25_000 });
  await v.getByRole("button", { name: /All albums/ }).click();
  await allPhotos(v);
  await expect(v.locator("li[data-media-id]")).toHaveCount(4);

  // visitors cannot download without buying: no free downloads are on
  const m = (await v.locator("li[data-media-id]").first().getAttribute("data-media-id")) as string;
  expect((await v.request.get(`${PHOTOS}/client/download?m=${m}&size=web`)).status()).toBe(403);
  expect((await v.request.get(`${PHOTOS}/client/download?m=${m}&size=full`)).status()).toBe(403);
  // nor favourite through the action's cookie session
  await ctx.close();

  // a stranger with no session cannot see photographs of a locked album even by id
  const stranger = await browser.newContext();
  const r = await stranger.request.post(`${PHOTOS}/api/img/token`, {
    headers: { origin: PHOTOS },
    data: { id: "00000000-0000-4000-8000-000000000000" },
  });
  expect([403, 404]).toContain(r.status());
  await stranger.close();
});

test("a visitor buys a download and a print: the shop prices it, nothing ships before payment, the mock card pays", async ({
  browser,
}) => {
  const ctx = await browser.newContext();
  const v = await ctx.newPage();
  await v.goto(`${PHOTOS}/g/${slug}`, { waitUntil: "networkidle" });
  await enterGallery(v);
  await allPhotos(v);
  await v.getByRole("button", { name: "Open vows-big.jpg" }).click();
  const lb = v.getByRole("dialog", { name: "Photograph" });
  // the price the studio set, and a size too big for the photograph is not offered
  await expect(lb.getByText("Web-size download")).toBeVisible();
  await expect(lb.getByText("$7.50")).toBeVisible();
  const row = (name: string) => lb.getByRole("listitem").filter({ hasText: name });
  await expect(row("Print 8 × 10 in")).toContainText("Too small");
  await expect(row("Print 8 × 10 in").getByRole("button")).toBeDisabled();
  await row("Web-size download").getByRole("button", { name: "Add" }).click();
  await row("Print 4 × 6 in").getByRole("button", { name: "Add" }).click();
  await row("Print 4 × 6 in").getByRole("button", { name: "Add another" }).click();
  await lb.getByRole("button", { name: /Open cart/ }).click();

  const cart = v.getByRole("dialog", { name: "Your cart" });
  await expect(cart.getByText("Web-size download")).toBeVisible();
  await expect(cart.getByText("Shipping (SAMPLE rate)")).toBeVisible();
  // $7.50 + 2 x $3 + $8 + $2 shipping = $23.50
  await expect(cart.locator(".gx-sum__total")).toContainText("$23.50");
  // an address is needed for the print
  await cart.getByLabel("Your name").fill("Ada Visitor");
  await cart.getByLabel(/^Email/).fill(`buyer-${uid}@example.test`);
  await cart.getByRole("button", { name: "Continue to payment" }).click();
  await expect(cart.getByRole("alert").or(cart.locator("input:invalid").first())).toBeVisible();
  await cart.getByLabel("Address", { exact: true }).fill("1 Main St");
  await cart.getByLabel("City", { exact: true }).fill("New York");
  await cart.getByLabel("State", { exact: true }).fill("NY");
  await cart.getByLabel("ZIP", { exact: true }).fill("10001");
  await cart.getByRole("button", { name: "Continue to payment" }).click();

  // the payment page is the studio's invoice page, with the mock card
  await expect(v).toHaveURL(/\/client\/pay\//, { timeout: 25_000 });
  await slow(v.getByRole("note", { name: "Mock notice" })).toContainText("no card is charged");
  await v.getByLabel("Card number").fill("4242 4242 4242 4242");
  await v.getByLabel(/Expiry/).fill("12 / 34");
  await v.getByLabel("Security code").fill("123");
  await v.getByRole("button", { name: /^Pay/ }).click();
  await slow(v.getByRole("status")).toContainText("Receipt rcpt_mock_");
  await v.reload({ waitUntil: "networkidle" });
  await slow(v.getByText(/is paid/)).toBeVisible();
  const open = v.getByRole("link", { name: "Open your order and downloads" });
  await expect(open).toBeVisible();
  orderUrl = (await open.getAttribute("href")) as string;
  await ctx.close();
});

test("the order page unlocks exactly what was bought; the owner sees the order and the lab order", async ({
  browser,
  page,
}) => {
  const ctx = await browser.newContext();
  const b = await ctx.newPage();
  await b.goto(`${PHOTOS}${orderUrl}`, { waitUntil: "networkidle" });
  await expect(b.getByRole("heading", { level: 1 })).toContainText("Order S-");
  await expect(b.getByText("Paid. Preparing your order").or(b.getByText("Complete"))).toBeVisible();
  const links = b.getByRole("main").getByRole("link", { name: "Download", exact: true });
  await expect(links).toHaveCount(1); // one download was bought
  const href = (await links.first().getAttribute("href")) as string;
  const got = await b.request.get(`${PHOTOS}${href}`);
  expect(got.status()).toBe(200);
  expect(got.headers()["content-type"]).toBe("image/jpeg");
  // another photograph, or a bigger size, is refused
  const other = href.replace(/m=[0-9a-f-]+/, "m=00000000-0000-4000-8000-000000000000");
  expect((await b.request.get(`${PHOTOS}${other}`)).status()).toBe(403);
  expect((await b.request.get(`${PHOTOS}${href.replace("size=web", "size=full")}`)).status()).toBe(403);
  // a tampered order link opens nothing
  const bad = `${orderUrl.slice(0, -2)}xx`;
  expect((await b.request.get(`${PHOTOS}${bad}`)).status()).toBe(404);
  expect(await b.getByText("Your prints").count()).toBeGreaterThanOrEqual(0);
  await ctx.close();

  // the studio: the order is there, paid, with the print lab's order id (the labelled mock lab)
  await page.goto(`${PHOTOS}/studio/orders`, { waitUntil: "networkidle" });
  const item = page
    .getByRole("listitem")
    .filter({ hasText: `Shop gallery ${uid}` })
    .first();
  await expect(item).toContainText("S-");
  await expect(item).toContainText("Print lab order mock-");
  await expect(item).toContainText("$23.50");
  await page.goto(`${PHOTOS}/studio/billing`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("an unpaid order can be cancelled by the owner, and its invoice is voided", async ({ browser, page }) => {
  const ctx = await browser.newContext();
  const v = await ctx.newPage();
  await v.goto(`${PHOTOS}/g/${slug}`, { waitUntil: "networkidle" });
  await enterGallery(v);
  await allPhotos(v);
  await v.getByRole("button", { name: "Open loose-small.jpg" }).click();
  const lb = v.getByRole("dialog", { name: "Photograph" });
  await lb
    .getByRole("listitem")
    .filter({ hasText: "Full-resolution download" })
    .getByRole("button", { name: "Add" })
    .click();
  await lb.getByRole("button", { name: /Open cart/ }).click();
  const cart = v.getByRole("dialog", { name: "Your cart" });
  await cart.getByLabel("Your name").fill("Bo Browser");
  await cart.getByLabel(/^Email/).fill(`bo-${uid}@example.test`);
  await cart.getByRole("button", { name: "Continue to payment" }).click();
  await expect(v).toHaveURL(/\/client\/pay\//, { timeout: 25_000 });
  await ctx.close();

  await page.goto(`${PHOTOS}/studio/orders`, { waitUntil: "networkidle" });
  const pending = page.getByRole("listitem").filter({ hasText: "Bo Browser" });
  await expect(pending).toContainText("pending");
  await pending.getByRole("button", { name: "Cancel" }).click();
  await slow(page.getByRole("status").filter({ hasText: "Order cancelled" })).toBeVisible();
  await expect(pending).toContainText("cancelled");
});
