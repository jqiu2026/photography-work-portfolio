import { expect, test } from "@playwright/test";
import { choose } from "./ui";
import sharp from "sharp";
import { enterGallery, newGallery, publishOpenGallery, uploadPhotos } from "./gallery-helpers";
import { signStripePayload } from "../packages/payments/src/index";

/**
 * Studio (Phase 3, database-backed): clients, jobs, client gallery with a passcode and strict-tier images, contract signed
 * through a one-time link, invoice paid through the labelled mock provider (Stripe is not configured in tests), webhook
 * signature handling. Runs against the dev servers and the throwaway database.
 */
const HUB = "http://localhost:3300";
const PHOTOS = "http://localhost:3302";
const uid = Date.now().toString(36);
const email = `client-${uid}@example.test`;
let galleryPass = "";
let gallerySlug = "";

test.describe.configure({ mode: "serial" });
// the first call of each server action compiles it in the dev server
const expectSlow = expect.configure({ timeout: 25_000 });

async function linkFrom(page: import("@playwright/test").Page, path: string) {
  const code = page.locator("code").first();
  await expectSlow(code).toContainText(path);
  return (await code.textContent())!.replace(/^https?:\/\/[^/]+/, "");
}

test("owner creates a client, a job, a gallery with photographs, a contract and an invoice", async ({ page }) => {
  await page.goto(`${PHOTOS}/studio/clients`, { waitUntil: "networkidle" });
  await page.getByLabel("Name").fill(`E2E Client ${uid}`);
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByRole("button", { name: "Add client" }).click();
  await expectSlow(page.locator("[role=alert]").filter({ hasText: /email/i }).first()).toBeVisible();
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Add client" }).click();
  await expectSlow(page.getByRole("status")).toContainText("Client added");
  await expectSlow(page.getByText(email)).toBeVisible();
  await page.getByLabel("Name").fill("Dup");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Add client" }).click();
  await expectSlow(
    page
      .locator("[role=alert]")
      .filter({ hasText: /already exists/ })
      .first(),
  ).toBeVisible();

  await page.goto(`${PHOTOS}/studio/shoots`, { waitUntil: "networkidle" });
  await choose(page.getByLabel("Client"), `E2E Client ${uid}`);
  await page.getByLabel("Title").fill(`E2E job ${uid}`);
  await page.getByLabel("Fee (dollars)").fill("350");
  await page.getByRole("button", { name: "Add job" }).click();
  const row = page.getByRole("listitem").filter({ hasText: `E2E job ${uid}` });
  await expectSlow(row).toBeVisible();
  await row.getByRole("button", { name: "Advance" }).click();
  await expectSlow(row.getByRole("progressbar", { name: "Progress: booked" })).toBeVisible();
  await row.getByRole("button", { name: "New contract" }).click();
  await expectSlow(page.getByRole("status")).toContainText("Contract created");
  await row.getByRole("button", { name: "New invoice" }).click();
  await expectSlow(page.getByRole("status")).toContainText(/Invoice \d{4}-\d{4} created/);

  const buffer = await sharp({ create: { width: 1600, height: 1000, channels: 3, background: "#7a3ea5" } })
    .jpeg()
    .toBuffer();
  const made = await newGallery(page, PHOTOS, `E2E job ${uid}`);
  galleryPass = made.passcode;
  gallerySlug = made.slug;
  await uploadPhotos(page, [{ name: `studio-${uid}.jpg`, mimeType: "image/jpeg", buffer }]);
  await publishOpenGallery(page);
});

test("client opens the gallery with the passcode (wrong one refused), sees strict images, and keeps favorites", async ({
  page,
  request,
}) => {
  await page.goto(`${PHOTOS}/g/${gallerySlug}`, { waitUntil: "networkidle" });
  await page.getByLabel("Passcode").fill("wrong-code");
  await page.getByRole("button", { name: "Open my gallery" }).click();
  await expectSlow(page.locator("p[role=alert]")).toContainText("doesn't match");
  await page.getByLabel("Passcode").fill(galleryPass.toUpperCase());
  await page.getByRole("button", { name: "Open my gallery" }).click();
  await enterGallery(page);
  await expectSlow(page.getByRole("heading", { level: 1 })).toContainText(`E2E job ${uid}`);
  // protected: no file URL in the page source, the image loads through a token as a blob
  const html = await page.content();
  expect(html).not.toMatch(/\/opt\/|originals?\//);
  await page.locator("[aria-label=Photographs]").scrollIntoViewIfNeeded();
  await expectSlow(page.locator("img[src^='blob:']").first()).toBeVisible({ timeout: 20_000 });
  const heart = page.getByRole("button", { name: /Add .* to favorites/ }).first();
  await heart.click();
  await expectSlow(page.getByRole("button", { name: /Remove .* from favorites/ }).first()).toBeVisible();
  await page.reload({ waitUntil: "networkidle" });
  await expectSlow(page.getByRole("button", { name: /Remove .* from favorites/ }).first()).toBeVisible();
  // the image route refuses a client photograph without a token
  const id = await page.evaluate(
    () =>
      (document.querySelector("[aria-label=Photographs] [data-image-id]") as HTMLElement | null)?.dataset.imageId ?? "",
  );
  if (id) expect((await request.get(`${PHOTOS}/api/img/${id}?w=960`)).status()).toBeGreaterThanOrEqual(400);
  // leaving the gallery ends the session
  await page.getByRole("button", { name: "Sign out" }).click();
  await expectSlow(page.getByLabel("Passcode")).toBeVisible();
  await page.goto(`${PHOTOS}/g/${gallerySlug}`, { waitUntil: "networkidle" });
  await expectSlow(page.getByLabel("Passcode")).toBeVisible();
});

test("contract: one-time link, name and agreement required, signed once", async ({ page }) => {
  await page.goto(`${PHOTOS}/studio/contracts`, { waitUntil: "networkidle" });
  const k = page.getByRole("listitem").filter({ hasText: `E2E job ${uid}` });
  await k.getByRole("button", { name: "Send for signature" }).click();
  const link = await linkFrom(page, "/client/sign/");
  await page.goto(`${PHOTOS}${link}`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Sign contract" }).click();
  await expectSlow(page.locator("p[role=alert]")).toContainText("full name");
  await page.getByLabel("Type your full name to sign").fill("E2E Client");
  await page.getByRole("button", { name: "Sign contract" }).click();
  await expectSlow(page.locator("p[role=alert]")).toContainText("agree");
  await page.getByLabel(/I agree to these terms/).check();
  await page.getByLabel(/sign, and to keep records/).check();
  await page.getByRole("button", { name: "Sign contract" }).click();
  await expectSlow(page.getByRole("status")).toContainText("Signed");
  await page.reload({ waitUntil: "networkidle" });
  await expectSlow(page.getByText(/signed by E2E Client/)).toBeVisible();
  await page.goto(`${PHOTOS}/client/sign/not-a-real-token`);
  await expectSlow(page.getByText(/not found|404/i).first()).toBeVisible();
});

test("invoice: payment link, declined then successful mock card, then marked paid in the studio", async ({ page }) => {
  await page.goto(`${PHOTOS}/studio/invoices`, { waitUntil: "networkidle" });
  const inv = page.getByRole("listitem").filter({ hasText: `E2E job ${uid}` });
  await inv.getByRole("button", { name: "Send" }).click();
  const link = await linkFrom(page, "/client/pay/");
  await page.goto(`${PHOTOS}${link}`, { waitUntil: "networkidle" });
  await expectSlow(page.getByRole("note", { name: "Mock notice" })).toContainText("no card is charged");
  await page.getByLabel("Card number").fill("4000 0000 0000 0002");
  await page.getByLabel(/Expiry/).fill("12 / 34");
  await page.getByLabel("Security code").fill("123");
  await page.getByRole("button", { name: /^Pay/ }).click();
  await expectSlow(page.locator("p[role=alert]")).toContainText("declined");
  await page.getByLabel("Card number").fill("4242 4242 4242 4242");
  await page.getByRole("button", { name: /^Pay/ }).click();
  await expectSlow(page.getByRole("status")).toContainText("Receipt rcpt_mock_");
  await page.goto(`${PHOTOS}${link}`, { waitUntil: "networkidle" });
  await expectSlow(page.getByText(/is paid/)).toBeVisible();
  await page.goto(`${PHOTOS}/studio/invoices`, { waitUntil: "networkidle" });
  await expectSlow(page.getByRole("listitem").filter({ hasText: `E2E job ${uid}` })).toContainText("paid");
});

test("the Stripe webhook: bad signatures refused, a signed event pays the invoice once, a replay changes nothing", async ({
  page,
  request,
}) => {
  const secret = "whsec_e2e_secret";
  const bad = await request.post(`${PHOTOS}/api/webhooks/stripe`, {
    data: "{}",
    headers: { "stripe-signature": "t=1,v1=bad" },
  });
  expect(bad.status()).toBe(400);

  await page.goto(`${PHOTOS}/studio/shoots`, { waitUntil: "networkidle" });
  const job = page.getByRole("listitem").filter({ hasText: `E2E job ${uid}` });
  await job.getByRole("button", { name: "New invoice" }).click();
  await expectSlow(page.getByRole("status")).toContainText(/Invoice \d{4}-\d{4} created/);
  await page.goto(`${PHOTOS}/studio/invoices`, { waitUntil: "networkidle" });
  const open = page.locator("li[data-invoice-id]").filter({ hasText: /draft/ }).first();
  const invoiceId = await open.getAttribute("data-invoice-id");
  expect(invoiceId).toBeTruthy();
  const event = JSON.stringify({
    id: `evt_${uid}`,
    type: "checkout.session.completed",
    data: {
      object: {
        id: `cs_${uid}`,
        client_reference_id: invoiceId,
        payment_status: "paid",
        amount_total: 30000,
        payment_intent: `pi_${uid}`,
      },
    },
  });
  const send = () =>
    request.post(`${PHOTOS}/api/webhooks/stripe`, {
      data: event,
      headers: { "stripe-signature": signStripePayload(event, secret), "content-type": "application/json" },
    });
  const first = await send();
  expect(first.status()).toBe(200);
  expect((await first.json()).duplicate).toBe(false);
  const replay = await send();
  expect((await replay.json()).duplicate).toBe(true);
  await page.goto(`${PHOTOS}/studio/invoices`, { waitUntil: "networkidle" });
  await expectSlow(page.locator(`li[data-invoice-id="${invoiceId}"]`)).toContainText("paid");
});

test("an inquiry becomes a scored lead, the visitor and the owner get email (labelled mock outbox), and the lead can be converted", async ({
  page,
}) => {
  const who = `Lead ${uid}`;
  await page.goto(`${PHOTOS}/book`, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: /Performances/ }).click();
  await expect(page).toHaveURL(/\/book\/performance$/);
  await page.getByLabel("Your name").fill(who);
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(`lead-${uid}@example.com`);
  await page.getByLabel("Date (if you have one)").fill("2027-03-01");
  await page.getByLabel("Where").fill("Brooklyn");
  await page.getByLabel("Production or ensemble").fill("Spring concert");
  await page
    .getByLabel("Tell me about it")
    .fill("A spring concert with about 120 people; I'd like coverage and a gallery.");
  await page.getByRole("button", { name: "Send inquiry" }).click();
  await expect(page.getByText("Please tick the box")).toBeVisible();
  await page.getByLabel(/I agree that my message is stored/).check();
  await page.getByRole("button", { name: "Send inquiry" }).click();
  await expectSlow(page.getByRole("status")).toContainText("Thanks, I got your message");

  await page.goto(`${PHOTOS}/studio/bookings`, { waitUntil: "networkidle" });
  const lead = page.locator("li[data-lead-id]").filter({ hasText: who });
  await expect(lead).toContainText("performance");
  await expect(lead).toContainText(/score \d+/);
  await expect(lead).toContainText("Spring concert");

  await page.goto(`${PHOTOS}/studio/inbox`, { waitUntil: "networkidle" });
  const mails = page.locator("li").filter({ hasText: `lead-${uid}@example.com` });
  await expect(mails.first()).toContainText("mock");
  await expect(page.getByText("New inquiry: performance").first()).toBeVisible();

  await page.goto(`${PHOTOS}/studio/bookings`, { waitUntil: "networkidle" });
  await page
    .locator("li[data-lead-id]")
    .filter({ hasText: who })
    .getByRole("button", { name: "Convert to client" })
    .click();
  await expectSlow(page.getByRole("status")).toContainText(/client/i);
});
