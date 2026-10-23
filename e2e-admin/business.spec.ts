import { expect, test } from "@playwright/test";
import { choose, pickDate, note } from "./ui";

/** Expenses and mileage, testimonials that need consent, gear double-booking warnings, call sheets, the toast. */
const PHOTOS = "http://localhost:3302";
const uid = Date.now().toString(36);
test.describe.configure({ mode: "serial" });
const slow = expect.configure({ timeout: 25_000 });
const inForm = (page: import("@playwright/test").Page, name: string) => page.getByRole("form", { name });
const today = new Date().toISOString().slice(0, 10);

test("results of an action appear as a toast in the corner, not a banner above the page", async ({ page }) => {
  await page.goto(`${PHOTOS}/studio/expenses`, { waitUntil: "networkidle" });
  const form = inForm(page, "New expense");
  await pickDate(form.getByLabel("Date"), today);
  await form.getByLabel("Amount (USD)").fill("49.99");
  await form.getByLabel("What for").fill(`Memory card ${uid}`);
  await form.getByRole("button", { name: "Add expense" }).click();
  const toast = note(page).filter({ hasText: "Expense added" }).first();
  await slow(toast).toBeVisible();
  const box = await toast.boundingBox();
  const vp = page.viewportSize();
  expect(box && vp && box.y > vp.height / 2).toBe(true);
  await expect(page.locator(".st-banner")).toHaveCount(0);
  await expect(page.getByText(`Memory card ${uid}`)).toBeVisible();
});

test("mileage multiplies miles by the rate, and the CSV link is offered", async ({ page }) => {
  await page.goto(`${PHOTOS}/studio/expenses`, { waitUntil: "networkidle" });
  const form = inForm(page, "New expense");
  await choose(form.getByLabel("Type"), "Mileage");
  await pickDate(form.getByLabel("Date"), today);
  await form.getByLabel("Miles").fill("20");
  await form.getByLabel(/^Rate/).fill("0.50");
  await form.getByRole("button", { name: "Add trip" }).click();
  await slow(note(page).filter({ hasText: "Trip added" }).first()).toBeVisible();
  await expect(page.getByText("$10.00").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Download CSV/ })).toBeEnabled();
});

test("a testimonial cannot go public until consent is recorded", async ({ page }) => {
  await page.goto(`${PHOTOS}/studio/testimonials`, { waitUntil: "networkidle" });
  const add = inForm(page, "New testimonial");
  await add.getByLabel(/^Name to show/).fill(`Pat ${uid}`);
  await add.getByLabel("What they said").fill(`Calm, quick and kind to the kids ${uid}.`);
  await add.getByRole("button", { name: "Save" }).click();
  await slow(note(page).filter({ hasText: "Testimonial saved" }).first()).toBeVisible();
  const item = page.locator("li", { hasText: `Pat ${uid}` });
  await expect(item.getByRole("button", { name: "Publish" })).toHaveCount(0);
  await expect(item.getByText("No consent yet")).toBeVisible();
  await page.goto(`${PHOTOS.replace("3302", "3302")}/about`, { waitUntil: "networkidle" });
  await expect(page.getByText(`Calm, quick and kind to the kids ${uid}.`)).toHaveCount(0);
  await page.goto(`${PHOTOS}/studio/testimonials`, { waitUntil: "networkidle" });
  await item.getByLabel(`How Pat ${uid} agreed`).fill("Email of today");
  await item.getByRole("button", { name: "Record consent" }).click();
  await slow(note(page).filter({ hasText: "Consent recorded" }).first()).toBeVisible();
  await item.getByRole("button", { name: "Publish" }).click();
  await slow(note(page).filter({ hasText: "Published on the About page" }).first()).toBeVisible();
  await page.goto(`${PHOTOS}/about`, { waitUntil: "networkidle" });
  await expect(page.getByText(`Calm, quick and kind to the kids ${uid}.`)).toBeVisible();
});

test("setup: a client with two jobs on the same day", async ({ page }) => {
  await page.goto(`${PHOTOS}/studio/clients`, { waitUntil: "networkidle" });
  await page.getByLabel("Name").fill(`Gear Client ${uid}`);
  await page.getByLabel("Email").fill(`gear-${uid}@example.test`);
  await page.getByRole("button", { name: "Add client" }).click();
  await slow(note(page).filter({ hasText: "Client added" }).first()).toBeVisible();
  for (const t of ["A", "B"]) {
    await page.goto(`${PHOTOS}/studio/shoots`, { waitUntil: "networkidle" });
    await choose(page.getByLabel("Client"), `Gear Client ${uid}`);
    await page.getByLabel("Title").fill(`Gear job ${t} ${uid}`);
    await page.getByRole("button", { name: "Add job" }).click();
    await slow(page.getByRole("listitem").filter({ hasText: `Gear job ${t} ${uid}` })).toBeVisible();
  }
});

test("gear on two jobs the same day shows a clash", async ({ page }) => {
  await page.goto(`${PHOTOS}/studio/gear`, { waitUntil: "networkidle" });
  const add = inForm(page, "New gear");
  await add.getByLabel("Name").fill(`Body ${uid}`);
  await add.getByRole("button", { name: "Add gear" }).click();
  await slow(note(page).filter({ hasText: "Gear added" }).first()).toBeVisible();
  const assign = inForm(page, "Assign gear");
  for (const t of ["A", "B"]) {
    await choose(assign.getByLabel("Gear"), `Body ${uid}`);
    await choose(assign.getByLabel("Job"), `Gear job ${t} ${uid}`);
    // the day stays selected between the two, and picking it again would clear it
    if (t === "A") await pickDate(assign.getByLabel("Day"), today);
    await assign.getByRole("button", { name: "Assign" }).click();
    // the second one is the clash, and the toast says so
    await slow(
      note(page)
        .filter({ hasText: t === "A" ? /^Assigned$/ : /also on/ })
        .first(),
    ).toBeVisible();
  }
  await expect(page.getByText(/is on .* and .* on /)).toContainText(`Body ${uid}`);
});

test("a call sheet keeps its shot list and people", async ({ page }) => {
  await page.goto(`${PHOTOS}/studio/callsheets`, { waitUntil: "networkidle" });
  await choose(page.getByLabel("Job"), `Gear job A ${uid}`);
  await page.waitForURL(/job=/);
  const sheet = inForm(page, "Call sheet");
  await sheet.getByLabel("Call time").fill("6:30 pm");
  await page.getByLabel("New shot").fill("Cast walk-in");
  await page.getByRole("button", { name: "Add shot" }).click();
  await page.getByRole("button", { name: "Save call sheet" }).click();
  await slow(note(page).filter({ hasText: "Call sheet saved" }).first()).toBeVisible();
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText("Cast walk-in")).toBeVisible();
  await expect(sheet.getByLabel("Call time")).toHaveValue("6:30 pm");
});

test("the sidebar lists the current group's pages as sub-items", async ({ page }) => {
  await page.goto(`${PHOTOS}/studio/galleries`, { waitUntil: "networkidle" });
  const sub = page.getByRole("list", { name: "Galleries pages" });
  for (const name of ["Visitors", "Watermarks", "Music"]) await expect(sub.getByRole("link", { name })).toBeVisible();
});

test("newsletter: the footer signup needs the emailed confirmation, and unsubscribing is one click", async ({
  page,
}) => {
  const address = `reader-${uid}@example.test`;
  await page.goto(`${PHOTOS}/about`, { waitUntil: "networkidle" });
  const form = page.getByRole("form", { name: "Newsletter signup" });
  await form.getByLabel("Occasional news, no spam").fill(address);
  await form.getByRole("button", { name: "Sign up" }).click();
  await slow(page.getByText("Check your inbox for a confirmation link.")).toBeVisible();
  // not on the list yet
  await page.goto(`${PHOTOS}/studio/subscribers`, { waitUntil: "networkidle" });
  await expect(page.locator("li", { hasText: address }).getByText("Not confirmed")).toBeVisible();
  // the confirmation email carries the link
  await page.goto(`${PHOTOS}/studio/inbox`, { waitUntil: "networkidle" });
  const mail = page.locator("li").filter({ hasText: address }).filter({ hasText: "Please confirm your email" }).first();
  await expect(mail).toBeVisible();
  const text = (await mail.textContent()) ?? "";
  const token = /newsletter\/confirm\?t=([A-Za-z0-9_%-]+)/.exec(text)?.[1];
  expect(token).toBeTruthy();
  await page.goto(`${PHOTOS}/newsletter/confirm?t=${token}`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "You're on the list" })).toBeVisible();
  await page.goto(`${PHOTOS}/studio/subscribers`, { waitUntil: "networkidle" });
  await expect(page.locator("li", { hasText: address }).getByText("Confirmed")).toBeVisible();
  await page.goto(`${PHOTOS}/newsletter/unsubscribe?t=${token}`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "You're unsubscribed" })).toBeVisible();
  await page.goto(`${PHOTOS}/newsletter/confirm?t=bogus`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "That link didn't work" })).toBeVisible();
});

test("the rights page, and an old per-type booking link opens the questionnaire with that kind chosen", async ({
  page,
}) => {
  await page.goto(`${PHOTOS}/studio/rights`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Rights" })).toBeVisible();
  await page.goto(`${PHOTOS}/book/aviation`, { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/\/book\?type=aviation$/);
  await expect(page.getByRole("heading", { name: /A few details about the aviation/ })).toBeVisible();
});
