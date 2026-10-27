import { expect, test } from "@playwright/test";
import { choose, note } from "./ui";

/**
 * Studio records (audit 2026-10-27): a shoot can be edited, moved back a stage and cancelled; an inquiry can be archived
 * and restored; Mark paid asks first and records only the balance; an invoice made by mistake can be voided.
 */
const PHOTOS = "http://localhost:3302";
const uid = Date.now().toString(36);
const client = `Records Client ${uid}`;
const shoot = `Records shoot ${uid}`;

test.describe.configure({ mode: "serial" });
const slow = expect.configure({ timeout: 25_000 });

test("a shoot is edited, moved back a stage and cancelled", async ({ page }) => {
  await page.goto(`${PHOTOS}/studio/clients`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Add a client" }).click();
  await page.getByLabel("Name").fill(client);
  await page.getByRole("textbox", { name: "Email" }).fill(`records-${uid}@example.test`);
  await page.getByRole("button", { name: "Add client" }).click();
  await slow(note(page).last()).toContainText("Client added");

  await page.goto(`${PHOTOS}/studio/shoots`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Add a shoot" }).click();
  await choose(page.getByLabel("Client"), client);
  await page.getByLabel("Title").fill(shoot);
  await page.getByLabel("Fee (dollars)").fill("500");
  await page.getByRole("button", { name: "Add shoot" }).click();
  await slow(note(page).last()).toContainText("Shoot added");
  const row = page.getByRole("listitem").filter({ hasText: shoot });
  await row.getByRole("button", { name: /^Advance / }).click();
  await slow(row.getByRole("progressbar", { name: "Progress: booked" })).toBeVisible();

  await row.getByRole("button", { name: /^More for/ }).click();
  await page.getByRole("menuitem", { name: "Edit shoot" }).click();
  const form = page.getByRole("form", { name: "Edit shoot" });
  await choose(form.getByLabel("Stage"), "Inquiry");
  await form.getByLabel("Where").fill("Prospect Park");
  await form.getByRole("button", { name: "Save shoot" }).click();
  await slow(note(page).last()).toContainText("Shoot saved");
  await slow(row.getByRole("progressbar", { name: "Progress: inquiry" })).toBeVisible();

  await row.getByRole("button", { name: /^More for/ }).click();
  await page.getByRole("menuitem", { name: "Edit shoot" }).click();
  await choose(form.getByLabel("Stage"), "Cancelled");
  await form.getByRole("button", { name: "Save shoot" }).click();
  await slow(note(page).last()).toContainText("Shoot saved");
  await slow(page.getByRole("list", { name: "Cancelled shoots" }).getByText(shoot)).toBeVisible();
});

test("Mark paid asks first and records the balance; a mistaken invoice is voided", async ({ page }) => {
  await page.goto(`${PHOTOS}/studio/shoots`, { waitUntil: "networkidle" });
  const row = page.getByRole("listitem").filter({ hasText: shoot });
  for (const amount of ["120", "75"]) {
    await row.getByRole("button", { name: /^More for/ }).click();
    await page.getByRole("menuitem", { name: "New invoice" }).click();
    const form = page.getByRole("form", { name: "New invoice" });
    await form.getByLabel("Amount (dollars)").fill(amount);
    await form.getByRole("button", { name: "Create invoice" }).click();
    await slow(note(page).last()).toContainText(/Invoice \d{4}-\d{4} created/);
  }

  await page.goto(`${PHOTOS}/studio/invoices`, { waitUntil: "networkidle" });
  const mine = page.locator("li[data-invoice-id]").filter({ hasText: shoot });
  await expect(mine.first()).toContainText(client);
  const paying = mine.filter({ hasText: "$120.00" });
  await paying.getByRole("button", { name: "Mark paid (cash, Zelle)" }).click();
  const ask = page.getByRole("alertdialog");
  await expect(ask).toContainText("$120.00");
  await ask.getByRole("button", { name: "Cancel" }).click();
  await expect(paying).toContainText("draft");
  await paying.getByRole("button", { name: "Mark paid (cash, Zelle)" }).click();
  await ask.getByRole("button", { name: "Mark paid" }).click();
  await slow(note(page).last()).toContainText("$120.00 received");
  await slow(paying).toContainText("paid");
  await expect(paying.getByRole("button", { name: /Mark paid|Void/ })).toHaveCount(0);

  const mistake = mine.filter({ hasText: "$75.00" });
  await mistake.getByRole("button", { name: /^Void invoice/ }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Void invoice" }).click();
  await slow(note(page).last()).toContainText("voided");
  await slow(mistake).toContainText("void");
  await expect(mistake.getByRole("button", { name: /Mark paid|Send/ })).toHaveCount(0);
});

test("an inquiry is archived out of New and restored", async ({ page, request }) => {
  const who = `Archive Me ${uid}`;
  const r = await request.post(`${PHOTOS}/api/inquiry`, {
    data: {
      name: who,
      email: `archive-${uid}@example.test`,
      shootType: "event",
      message: "An inquiry the photographer will turn down.",
      consent: true,
    },
  });
  expect(r.status()).toBe(200);
  await page.goto(`${PHOTOS}/studio/bookings`, { waitUntil: "networkidle" });
  const lead = page.locator("li[data-lead-id]").filter({ hasText: who });
  await lead.getByRole("button", { name: `Archive the inquiry from ${who}` }).click();
  await slow(note(page).last()).toContainText(`Archived the inquiry from ${who}`);
  await slow(lead).toHaveCount(0);
  await page.getByRole("button", { name: /^All/ }).click();
  await expect(lead).toContainText("archived");
  await lead.getByRole("button", { name: `Restore the inquiry from ${who}` }).click();
  await slow(note(page).last()).toContainText("back in New");
  await page.getByRole("button", { name: /^New/ }).click();
  await slow(lead.getByRole("button", { name: "Convert to client" })).toBeVisible();
});
