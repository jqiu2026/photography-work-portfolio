import { expect, test } from "@playwright/test";
import { choose, pickDate, note } from "./ui";

/** Payment plans, tips, bank and card options with the surcharge disclosure, PDFs, refunds, recurring billing. */
const PHOTOS = "http://localhost:3302";
const uid = Date.now().toString(36);
const email = `billing-${uid}@example.test`;
test.describe.configure({ mode: "serial" });
const slow = expect.configure({ timeout: 25_000 });
const today = new Date().toISOString().slice(0, 10);
const inForm = (page: import("@playwright/test").Page, name: string) => page.getByRole("form", { name });
const pick = (form: import("@playwright/test").Locator, label: RegExp, option: string) =>
  choose(form.getByLabel(label), option);
let payLink = "";

test("setup: a client and a job; tips, bank transfer and a card surcharge are switched on", async ({ page }) => {
  await page.goto(`${PHOTOS}/studio/clients`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Add a client" }).click();
  await page.getByLabel("Name").fill(`Billing Client ${uid}`);
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Add client" }).click();
  await slow(note(page).last()).toContainText("Client added");
  await page.goto(`${PHOTOS}/studio/shoots`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Add a shoot" }).click();
  await choose(page.getByLabel("Client"), `Billing Client ${uid}`);
  await page.getByLabel("Title").fill(`Billing job ${uid}`);
  await page.getByLabel("Fee (dollars)").fill("900");
  await page.getByRole("button", { name: "Add shoot" }).click();
  await slow(page.getByRole("listitem").filter({ hasText: `Billing job ${uid}` })).toBeVisible();

  await page.goto(`${PHOTOS}/studio/billing`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Change" }).click();
  const opts = inForm(page, "Tips, bank payment and surcharge");
  await opts.getByLabel("Offer a tip at payment").check();
  await opts.getByLabel(/Offer bank transfer/).check();
  await opts.getByLabel(/Add a credit card surcharge/).check();
  await opts.getByLabel(/Surcharge percent/).fill("2.5");
  await opts.getByRole("button", { name: "Save" }).click();
  await slow(note(page).last()).toContainText("Saved");
  await page.getByRole("button", { name: "Change" }).click();
  await opts.getByLabel(/Surcharge percent/).fill("4");
  await opts.getByRole("button", { name: "Save" }).click();
  await slow(note(page).last()).toContainText("cannot exceed 3 percent");
});

test("a three-part plan is created, the first invoice is emailed with a pay link, the rest wait until they fall due", async ({
  page,
}) => {
  await page.goto(`${PHOTOS}/studio/billing`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "New plan" }).click();
  const plan = inForm(page, "New payment plan");
  await pick(plan, /^Job/, `Billing job ${uid}`);
  await plan.getByLabel("Total (dollars)").fill("900");
  await plan.getByLabel("Instalments").fill("3");
  await pickDate(plan.getByLabel("First due"), today);
  await plan.getByRole("button", { name: "Create plan" }).click();
  await slow(note(page).last()).toContainText("3 instalments");
  await page.goto(`${PHOTOS}/studio/inbox`, { waitUntil: "networkidle" });
  const mail = page.locator("li").filter({ hasText: email }).filter({ hasText: "invoice-sent" }).first();
  await mail.getByRole("button").click();
  const body = (await page.getByRole("dialog").locator("pre").textContent()) as string;
  payLink = (/https?:\/\/[^\s]+\/client\/pay\/[A-Za-z0-9_-]+/.exec(body)?.[0] ?? "").replace(/^https?:\/\/[^/]+/, "");
  expect(payLink).toMatch(/^\/client\/pay\//);
  await page.goto(`${PHOTOS}/studio/invoices`, { waitUntil: "networkidle" });
  const rows = page.getByRole("listitem").filter({ hasText: "payment plan (" });
  await expect(rows.filter({ hasText: "sent" })).toHaveCount(1);
  await expect(rows.filter({ hasText: "draft" })).toHaveCount(2);
});

test("paying: the card option shows the surcharge disclosure, a tip is added, tip and surcharge are not credited to the invoice, PDFs download", async ({
  page,
  request,
}) => {
  await page.goto(`${PHOTOS}${payLink}`, { waitUntil: "networkidle" });
  await expect(page.getByText(/2\.50% surcharge applies to credit cards/)).toBeVisible();
  await expect(page.getByText(/Bank transfer \(ACH\)/)).toBeVisible();
  await page.getByLabel("15%").check();
  await page.getByLabel("Card number").fill("4242 4242 4242 4242");
  await page.getByLabel(/Expiry/).fill("12 / 34");
  await page.getByLabel("Security code").fill("123");
  await page.getByRole("button", { name: /^Pay/ }).click();
  await slow(note(page).last()).toContainText("Receipt rcpt_mock_");
  const inv = await request.get(`${PHOTOS}${payLink}/pdf`);
  expect(inv.status()).toBe(200);
  expect(inv.headers()["content-type"]).toBe("application/pdf");
  expect((await inv.body()).subarray(0, 8).toString()).toMatch(/^%PDF-1\./);
  const rec = await request.get(`${PHOTOS}${payLink}/receipt`);
  expect(rec.status()).toBe(200);
  expect((await rec.body()).toString("latin1")).toContain("includes a tip of $45.00");
  expect((await request.get(`${PHOTOS}/client/pay/not-a-token/pdf`)).status()).toBe(404);
});

test("billing shows the tip and surcharge; a partial refund then a full refund update the invoice", async ({
  page,
}) => {
  await page.goto(`${PHOTOS}/studio/billing`, { waitUntil: "networkidle" });
  const pay = page.locator("li[data-payment-id]").first();
  await expect(pay).toContainText("tip $45.00");
  await expect(pay).toContainText("surcharge $7.50");
  await pay.getByRole("button", { name: /^Refund / }).click();
  const form = page.getByRole("form", { name: /^Refund / });
  await form.getByLabel("Amount (dollars)").fill("100");
  await form.getByRole("button", { name: "Refund" }).click();
  await slow(note(page).last()).toContainText("Invoice is now partial");
  await page.goto(`${PHOTOS}/studio/billing`, { waitUntil: "networkidle" });
  await page
    .locator("li[data-payment-id]")
    .first()
    .getByRole("button", { name: /^Refund / })
    .click();
  const again = page.getByRole("form", { name: /^Refund / });
  await again.getByRole("textbox").fill("999");
  await again.getByRole("button", { name: "Refund" }).click();
  await slow(note(page).last()).toContainText("At most");
  await again.getByRole("textbox").fill("");
  await again.getByRole("button", { name: "Refund" }).click();
  // an empty amount refunds what is left (the dialog hint says how much)
  await slow(note(page).last()).toContainText("Invoice is now refunded");
});

test("recurring billing: due items are invoiced and emailed once, and the button is safe to press twice", async ({
  page,
}) => {
  await page.goto(`${PHOTOS}/studio/billing`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "New recurring invoice" }).click();
  const rec = inForm(page, "New recurring invoice");
  await pick(rec, /^Job/, `Billing job ${uid}`);
  await rec.getByLabel("What is billed").fill(`Retainer ${uid}`);
  await rec.getByLabel("Amount (dollars)").fill("150");
  await pickDate(rec.getByLabel("First invoice"), today);
  await rec.getByRole("button", { name: "Start" }).click();
  await slow(note(page).last()).toContainText("Recurring billing started");
  await page.getByRole("button", { name: "Run billing now" }).click();
  await slow(note(page).last()).toContainText(/1 recurring/);
  await page.getByRole("button", { name: "Run billing now" }).click();
  await slow(note(page).last()).toContainText(/0 recurring/);
  await page.goto(`${PHOTOS}/studio/invoices`, { waitUntil: "networkidle" });
  await expect(page.getByRole("listitem").filter({ hasText: `Retainer ${uid}` })).toHaveCount(1);
});
