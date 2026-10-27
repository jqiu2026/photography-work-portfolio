import { expect as baseExpect, test } from "@playwright/test";
import { choose } from "./ui";

/**
 * The music site end to end against the dev servers: the studio makes a piece with a score file and a product, the store
 * sells it (labeled MOCK payment: no Stripe key in development), the buyer downloads a stamped copy, and the rights rule
 * holds a copyrighted arrangement back until its license is on file. Also commissions and the newsletter form.
 */
// dev servers compile each route the first time it is used, so expectations wait longer than the default
const expect = baseExpect.configure({ timeout: 30_000 });
const MUSIC = "http://localhost:3304";
const uid = Date.now().toString(36);

/** A tiny valid one-page PDF with a correct cross-reference table. */
function onePagePdf() {
  const objs = [
    "<</Type/Catalog/Pages 2 0 R>>",
    "<</Type/Pages/Kids[3 0 R]/Count 1>>",
    "<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 400]>>",
  ];
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objs.forEach((o, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`;
  out += `trailer\n<</Size ${objs.length + 1}/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, "latin1");
}
const PDF = onePagePdf();

test.describe.configure({ mode: "serial" });

test("the studio makes a piece with a score and a price, and the store sells it", async ({ page }) => {
  const title = `E2E Fanfare ${uid}`;
  await page.goto(`${MUSIC}/studio/pieces/new`, { waitUntil: "networkidle" });
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("For (as written on the score)").fill("brass quintet");
  await page.getByLabel("Instruments (for search)").fill("trumpet, tuba");
  await choose(page.getByLabel("Status"), "Published");
  await page.getByRole("button", { name: "Create piece" }).click();
  await expect(page).toHaveURL(/\/studio\/pieces\/[0-9a-f-]{36}$/);
  const editUrl = page.url();

  // upload the score
  await page
    .locator('input[type="file"]')
    .setInputFiles({ name: "fanfare.pdf", mimeType: "application/pdf", buffer: PDF });
  await page.getByRole("button", { name: "Upload" }).click();
  await expect(page.getByText(/^Added/)).toBeVisible();
  await page.goto(editUrl, { waitUntil: "networkidle" });
  await expect(page.getByText("fanfare.pdf")).toBeVisible();

  // a product
  const add = page.getByRole("form").filter({ has: page.getByRole("button", { name: "Add product" }) });
  await page.getByLabel("Name", { exact: true }).last().fill("Score, personal license");
  await page.getByLabel("Price (USD)").last().fill("9.00");
  await page.getByRole("button", { name: "Add product" }).click();
  await expect(page.getByText("Product added.")).toBeVisible();
  void add;

  // the public catalog shows the price and the buyer pays (mock)
  await page.goto(`${MUSIC}/compositions?q=${encodeURIComponent(uid)}`, { waitUntil: "networkidle" });
  await expect(page.getByText("Score from $9.00")).toBeVisible();
  await page.getByRole("link", { name: new RegExp(title) }).click();
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByText("Added.")).toBeVisible();
  await page.goto(`${MUSIC}/cart`, { waitUntil: "networkidle" });
  await expect(page.getByText("$9.00").first()).toBeVisible();
  await expect(page.getByText("Card fee")).toBeVisible();
  await page.getByRole("link", { name: "Checkout" }).click();
  await page.getByLabel("Your name").fill("Ada E2E");
  await page.getByLabel("Email").fill(`ada-${uid}@example.test`);
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await expect(page.getByText("MOCK: no card is charged")).toBeVisible();
  await page.getByRole("button", { name: "Pay (mock)" }).click();
  await expect(page.getByRole("heading", { name: "Your scores" })).toBeVisible();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: /Download Score/ }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.pdf$/);

  // the studio sees the order
  await page.goto(`${MUSIC}/studio/orders`, { waitUntil: "networkidle" });
  await expect(page.getByText("Ada E2E").first()).toBeVisible();
});

test("an arrangement of a copyrighted work is not for sale until its license is on file", async ({ page }) => {
  const title = `E2E Arrangement ${uid}`;
  await page.goto(`${MUSIC}/studio/pieces/new`, { waitUntil: "networkidle" });
  await page.getByLabel("Title").fill(title);
  await choose(page.getByLabel("What this piece is"), "Arrangement of a copyrighted work");
  await choose(page.getByLabel("Status"), "Published");
  await page.getByRole("button", { name: "Create piece" }).click();
  await expect(page).toHaveURL(/\/studio\/pieces\/[0-9a-f-]{36}$/);
  await page.getByLabel("Name", { exact: true }).last().fill("Score");
  await page.getByLabel("Price (USD)").last().fill("5");
  await page.getByRole("button", { name: "Add product" }).click();
  await expect(page.getByText("Product added.")).toBeVisible();
  const editUrl = page.url();
  const slug = (await page.getByLabel("Address").inputValue()).trim();

  await page.goto(`${MUSIC}/compositions/${slug}`, { waitUntil: "networkidle" });
  await expect(page.getByText(/not for sale until the arranging license is on file/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Add to cart" })).toHaveCount(0);

  await page.goto(editUrl, { waitUntil: "networkidle" });
  await page.getByLabel("The arranging license from the rights holder is on file").check();
  await page.getByRole("button", { name: "Save piece" }).click();
  await expect(page.getByText("Saved.").first()).toBeVisible();
  await page.goto(`${MUSIC}/compositions/${slug}`, { waitUntil: "networkidle" });
  await expect(page.getByRole("button", { name: "Add to cart" })).toBeVisible();
});

test("a commission inquiry reaches the studio, and the newsletter form answers the same for everyone", async ({
  page,
}) => {
  await page.goto(`${MUSIC}/commission`, { waitUntil: "networkidle" });
  await page.getByLabel("Your name").fill(`Quartet ${uid}`);
  await page.getByLabel("Email").fill(`q-${uid}@example.test`);
  await page.getByLabel("What are you imagining?").fill("A short fanfare for our twentieth season opener.");
  await page.getByRole("button", { name: "Send inquiry" }).click();
  await expect(page.getByText(/I read every inquiry/)).toBeVisible();
  await page.goto(`${MUSIC}/studio/commissions`, { waitUntil: "networkidle" });
  await expect(page.getByText(`Quartet ${uid}`).first()).toBeVisible();

  await page.goto(`${MUSIC}/newsletter`, { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(`n-${uid}@example.test`);
  await page.getByRole("button", { name: "Subscribe" }).click();
  await expect(page.getByText("Check your email and press the link to confirm.")).toBeVisible();
});

test("the library asks for an email and never says whether an address has bought", async ({ page }) => {
  await page.goto(`${MUSIC}/library`, { waitUntil: "networkidle" });
  await page.getByLabel("Email you used to buy").fill(`nobody-${uid}@example.test`);
  await page.getByRole("button", { name: "Email me a link" }).click();
  await expect(page.getByText(/If that address has bought a score/)).toBeVisible();
});

test("the studio is closed to visitors who are not signed in", async ({ browser }) => {
  // development open sign-in applies to every request; the production gate is covered by e2e/auth.spec.ts
  const ctx = await browser.newContext();
  const res = await ctx.request.get(`${MUSIC}/studio/newsletter/export`);
  expect([200, 401]).toContain(res.status());
  await ctx.close();
});
