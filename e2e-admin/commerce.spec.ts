import { expect, test } from "@playwright/test";
import { choose, note } from "./ui";

/** Packages, add-ons, codes, quotes with upsell and accept-and-pay, gift cards. Dev servers and the throwaway database. */
const PHOTOS = "http://localhost:3302";
const uid = Date.now().toString(36);
test.describe.configure({ mode: "serial" });
const slow = expect.configure({ timeout: 25_000 });

test("the public Packages page shows $XX for sample prices, deliverables, included fees and the bundle's standalone value", async ({
  page,
  request,
}) => {
  await page.goto(`${PHOTOS}/studio/packages`, { waitUntil: "networkidle" }); // seeds the SAMPLE catalog
  const res = await request.get(`${PHOTOS}/packages`);
  const html = await res.text();
  expect(html).toContain("$XX");
  expect(html).not.toMatch(/\$400\.00|\$420\.00/);
  await page.goto(`${PHOTOS}/packages`, { waitUntil: "networkidle" });
  const plus = page
    .getByRole("listitem")
    .filter({ has: page.getByRole("heading", { name: "Plus" }) })
    .first();
  await expect(plus).toContainText("Gallery access");
  await expect(plus).toContainText("6 months");
  await expect(plus).toContainText("Includes Gallery extension");
  await expect(plus).toContainText("Booking fee included");
  await expect(page.getByRole("note")).toContainText("SAMPLE");
});

test("owner creates a client, a code, a gift card and a quote; sends it; the email is in the inbox", async ({
  page,
}) => {
  await page.goto(`${PHOTOS}/studio/clients`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Add a client" }).click();
  await page.getByLabel("Name").first().fill(`Quote Client ${uid}`);
  await page.getByLabel("Email").first().fill(`quote-${uid}@example.com`);
  await page.getByRole("button", { name: "Add client", exact: true }).click();
  await slow(note(page).last()).toContainText("Client added");

  await page.goto(`${PHOTOS}/studio/codes`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "New code" }).click();
  await page.getByLabel("Code", { exact: true }).fill(`SAVE10-${uid}`);
  await page.getByLabel("Value").fill("10");
  await page.getByRole("button", { name: "Create code" }).click();
  await slow(note(page).last()).toContainText("created");
  await expect(page.locator("li[data-promo]").filter({ hasText: `save10-${uid}` })).toContainText("Active");
  await page.getByRole("button", { name: "New gift card" }).click();
  await page.getByLabel(/Gift card amount/).fill("50");
  await page.getByRole("button", { name: "Create gift card" }).click();
  await slow(note(page).last()).toContainText(/Gift card gift-[0-9a-f]+ created/);

  await page.goto(`${PHOTOS}/studio/packages`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Change" }).click();
  await page.getByLabel("Tax rate (percent)").fill("8.875");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await slow(note(page).last()).toContainText("Saved");

  await page.goto(`${PHOTOS}/studio/quotes`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "New quote" }).click();
  await choose(page.getByLabel(/^Client/), `Quote Client ${uid}`);
  await page.getByRole("textbox", { name: "Title" }).fill(`Spring shoot ${uid}`);
  await choose(page.getByLabel(/^Package/), "Standard ($400.00)");
  await page.getByLabel("Promo code").fill(`save10-${uid}`);
  await page.getByRole("button", { name: "Create quote" }).click();
  await slow(note(page).last()).toContainText(/Quote Q\d{4}-\d{4} created/);
  const row = page.locator("li[data-quote-id]").filter({ hasText: `Spring shoot ${uid}` });
  await expect(row).toContainText("SAMPLE");
  await row.getByRole("button", { name: "Send" }).click();
  await slow(page.locator(".hm-toast-description").last()).toContainText("/client/quote/");
  const link = ((await page.locator(".hm-toast-description").last().textContent()) as string).replace(
    /^https?:\/\/[^/]+/,
    "",
  );
  test.info().annotations.push({ type: "quote-link", description: link });
  process.env.E2E_QUOTE_LINK = link;
  await page.goto(`${PHOTOS}/studio/inbox`, { waitUntil: "networkidle" });
  await expect(page.getByText(`Your quote: Spring shoot ${uid}`).first()).toBeVisible();
});

test("the client sees tax as its own line and the bundle price, adds an extra (re-priced on the server), accepts, and pays the deposit", async ({
  page,
}) => {
  const link = process.env.E2E_QUOTE_LINK as string;
  expect(link).toBeTruthy();
  await page.goto(`${PHOTOS}${link}`, { waitUntil: "networkidle" });
  await expect(page.getByRole("note").first()).toContainText("SAMPLE");
  const table = page.getByRole("table", { name: "Quote lines" });
  await expect(table).toContainText("Standard");
  await expect(table).toContainText("Included: Booking fee");
  await expect(table).toContainText(`Code save10-${uid}`);
  await expect(table).toContainText("Sales tax (8.88%)");
  await expect(table).toContainText("Total");
  await expect(table).toContainText("Deposit due on acceptance");
  const total = async () =>
    ((await table.locator("tr", { hasText: "Total" }).last().textContent()) as string).replace(/[^0-9.]/g, "");
  const before = await total();
  await page.getByLabel("Extra edited images quantity").fill("3");
  await page.getByLabel("Extra edited images quantity").press("Tab"); // a typed number counts once you leave the field
  await slow(note(page).last()).toContainText("Updated");
  await expect.poll(total, { timeout: 15_000 }).not.toBe(before);
  // accept needs consent and a name
  await page.getByRole("button", { name: /^Accept and pay/ }).click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: /tick the box|full name/ })
      .first(),
  ).toBeVisible();
  await page.getByLabel("Type your full name to accept").fill(`Quote Client ${uid}`);
  await page.getByLabel(/I have read this quote/).check();
  await page.getByRole("button", { name: /^Accept and pay/ }).click();
  await expect(page).toHaveURL(/\/client\/pay\//, { timeout: 25_000 });
  await expect(page.getByRole("note", { name: "Mock notice" })).toContainText("no card is charged");
  await page.getByLabel("Card number").fill("4242 4242 4242 4242");
  await page.getByLabel(/Expiry/).fill("12 / 34");
  await page.getByLabel("Security code").fill("123");
  await page.getByRole("button", { name: /^Pay/ }).click();
  await slow(note(page).last()).toContainText("Receipt rcpt_mock_");
  // the quote now reads accepted and cannot be accepted again
  await page.goto(`${PHOTOS}${link}`, { waitUntil: "networkidle" });
  await expect(page.getByText(`Accepted by Quote Client ${uid}`)).toBeVisible();
  await expect(page.getByRole("button", { name: /^Accept/ })).toHaveCount(0);
});

test("the pipeline shows the accepted quote as a job, and a bogus quote link is a 404", async ({ page, request }) => {
  await page.goto(`${PHOTOS}/studio/pipeline`, { waitUntil: "networkidle" });
  await expect(page.locator("li[data-job-id]").filter({ hasText: `Spring shoot ${uid}` })).toHaveCount(1);
  expect((await request.get(`${PHOTOS}/client/quote/not-a-real-token`)).status()).toBe(404);
});
