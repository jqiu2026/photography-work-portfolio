import { expect, test } from "@playwright/test";
import sharp from "sharp";
import { newGallery, publishOpenGallery, uploadPhotos } from "./gallery-helpers";

/** The client portal: invite, password, magic link, home, documents by capability link, gallery, appointment, messages, ETA. */
const HUB = "http://localhost:3300";
const PHOTOS = "http://localhost:3302";
const uid = Date.now().toString(36);
const email = `portal-${uid}@example.test`;
const PASSWORD = "an unusual long passphrase 42";
test.describe.configure({ mode: "serial" });
const slow = expect.configure({ timeout: 25_000 });
const inForm = (page: import("@playwright/test").Page, name: string) => page.getByRole("form", { name });

function monday(weeksAhead: number) {
  const d = new Date(Date.now() + 14 * 86_400_000 + weeksAhead * 7 * 86_400_000);
  d.setUTCDate(d.getUTCDate() + ((8 - d.getUTCDay()) % 7 || 7));
  return d.toISOString().slice(0, 10);
}

async function latestLink(page: import("@playwright/test").Page, kind: string, pattern: RegExp) {
  // The email is written by a server action that may still be finishing: reload the inbox until it shows up.
  let found = "";
  await expect
    .poll(
      async () => {
        await page.goto(`${PHOTOS}/studio/inbox`, { waitUntil: "networkidle" });
        const mail = page.locator("li").filter({ hasText: email }).filter({ hasText: kind }).first();
        if (!(await mail.count())) return "";
        await mail.locator("summary").click();
        found = pattern.exec((await mail.locator("pre").textContent()) ?? "")?.[0] ?? "";
        return found;
      },
      { timeout: 30_000, message: `no link in the ${kind} email` },
    )
    .not.toBe("");
  return found.replace(/^https?:\/\/[^/]+/, "");
}

test("owner sets up: client, job, a published gallery, an invoice, a contract, a questionnaire, bookable hours", async ({
  page,
}) => {
  await page.goto(`${PHOTOS}/studio/clients`, { waitUntil: "networkidle" });
  await page.getByLabel("Name").fill(`Portal Client ${uid}`);
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Add client" }).click();
  await slow(page.getByRole("status")).toContainText("Client added");
  await page.goto(`${PHOTOS}/studio/shoots`, { waitUntil: "networkidle" });
  await page.getByLabel("Client").selectOption({ label: `Portal Client ${uid}` });
  await page.getByLabel("Title").fill(`Portal job ${uid}`);
  await page.getByLabel("Fee (dollars)").fill("300");
  await page.getByRole("button", { name: "Add job" }).click();
  const row = page.getByRole("listitem").filter({ hasText: `Portal job ${uid}` });
  await slow(row).toBeVisible();
  await row.getByRole("button", { name: "New invoice" }).click();
  await slow(page.getByRole("status")).toContainText(/Invoice \d{4}-\d{4} created/);
  await row.getByRole("button", { name: "New contract" }).click();
  await slow(page.getByRole("status")).toContainText("Contract created");

  await page.goto(`${PHOTOS}/studio/invoices`, { waitUntil: "networkidle" });
  await page
    .getByRole("listitem")
    .filter({ hasText: `Portal job ${uid}` })
    .getByRole("button", { name: "Send" })
    .click();
  await slow(page.locator("code").first()).toContainText("/client/pay/");
  await page.goto(`${PHOTOS}/studio/contracts`, { waitUntil: "networkidle" });
  await page
    .getByRole("listitem")
    .filter({ hasText: `Portal job ${uid}` })
    .getByRole("button", { name: "Send for signature" })
    .click();
  await slow(page.locator("code").first()).toContainText("/client/sign/");

  const buffer = await sharp({ create: { width: 1600, height: 1000, channels: 3, background: "#3ea58a" } })
    .jpeg()
    .toBuffer();
  await newGallery(page, PHOTOS, `Portal job ${uid}`);
  await uploadPhotos(page, [{ name: `portal-${uid}.jpg`, mimeType: "image/jpeg", buffer }]);
  await publishOpenGallery(page);

  await page.goto(`${PHOTOS}/studio/calendar`, { waitUntil: "networkidle" });
  const hours = page.locator('section[aria-labelledby="cal-hours"]');
  await hours.getByLabel("Day").selectOption("1");
  await hours.getByLabel("From").fill("10:00");
  await hours.getByLabel("To").fill("14:00");
  await hours.getByRole("button", { name: "Add hours" }).click();
  await slow(page.getByRole("status")).toContainText("Hours added");
});

test("a client books a consultation (so there is an appointment) with the same email", async ({ page }) => {
  await page.goto(`${PHOTOS}/book/schedule`, { waitUntil: "networkidle" });
  await page.getByLabel("Pick a day").fill(monday(3));
  const first = page.getByRole("list", { name: "Free times" }).getByRole("button").first();
  await expect(first).toBeVisible({ timeout: 15_000 });
  await first.click();
  await page.getByLabel("Your name").fill(`Portal Client ${uid}`);
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
  await page.getByLabel(/I agree that my details are stored/).check();
  await page.getByRole("button", { name: "Book this time" }).click();
  await slow(page.getByRole("status")).toContainText("You're booked");
});

test("owner invites the client; the client chooses a password from the link and is signed in", async ({
  page,
  browser,
}) => {
  await page.goto(`${PHOTOS}/studio/portal`, { waitUntil: "networkidle" });
  await page
    .locator("li[data-client-id]")
    .filter({ hasText: email })
    .getByRole("button", { name: "Invite to the portal" })
    .click();
  await slow(page.getByRole("status")).toContainText("Invitation sent");
  const link = await latestLink(page, "portal-invite", /https?:\/\/[^\s]+\/client\/login\/reset\?t=[A-Za-z0-9_-]+/);

  const ctx = await browser.newContext();
  const c = await ctx.newPage();
  expect((await c.request.get(`${PHOTOS}/client/home`, { maxRedirects: 0 })).status()).toBe(307);
  await c.goto(`${PHOTOS}${link}`, { waitUntil: "networkidle" });
  const form = inForm(c, "Choose a password");
  await form.getByLabel("New password").fill("short");
  await form.getByLabel("Type it again").fill("short");
  await form.getByRole("button", { name: "Save and sign in" }).click();
  await slow(c.locator("p.st-error")).toContainText("at least 10");
  await form.getByLabel("New password").fill(PASSWORD);
  await form.getByLabel("Type it again").fill("something different here");
  await form.getByRole("button", { name: "Save and sign in" }).click();
  await slow(c.locator("p.st-error")).toContainText("do not match");
  await form.getByLabel("New password").fill(PASSWORD);
  await form.getByLabel("Type it again").fill(PASSWORD);
  await form.getByRole("button", { name: "Save and sign in" }).click();
  await expect(c).toHaveURL(/\/client\/home$/, { timeout: 25_000 });
  await expect(c.getByRole("heading", { name: "What needs you" })).toBeVisible();
  // the link cannot be used twice
  await c.goto(`${PHOTOS}${link}`, { waitUntil: "networkidle" });
  await expect(c.getByRole("heading", { name: "This link has expired" })).toBeVisible();
  await ctx.storageState({ path: `/tmp/portal-${uid}.json` }).catch(() => {});
  await ctx.close();
});

test("password sign-in: wrong password is vague, right one works; magic link needs a button press and works once", async ({
  page: owner,
  browser,
}) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${PHOTOS}/client/login`, { waitUntil: "networkidle" });
  const pw = inForm(page, "Sign in with a password");
  await pw.getByLabel("Email").fill(email);
  await pw.getByLabel("Password").fill("not the password at all");
  await pw.getByRole("button", { name: "Sign in" }).click();
  await slow(page.locator("p.st-error")).toContainText("do not match");
  await pw.getByLabel("Password").fill(PASSWORD);
  await pw.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/client\/home$/, { timeout: 25_000 });

  // magic link in a fresh browser context
  const fresh = await browser.newContext();
  const p2 = await fresh.newPage();
  await p2.goto(`${PHOTOS}/client/login`, { waitUntil: "networkidle" });
  await p2.getByRole("tab", { name: "Email me a link" }).click();
  const ml = inForm(p2, "Email me a sign-in link");
  await ml.getByLabel("Email").fill("nobody-here@example.test");
  await ml.getByRole("button", { name: "Email me a link" }).click();
  const generic = await p2.getByRole("status").textContent();
  await ml.getByLabel("Email").fill(email);
  await ml.getByRole("button", { name: "Email me a link" }).click();
  await slow(p2.getByRole("status")).toContainText("a link is on its way");
  expect(await p2.getByRole("status").textContent()).toBe(generic); // identical for unknown and known addresses
  const link = await latestLink(owner, "magic-link", /https?:\/\/[^\s]+\/client\/login\/verify\?t=[A-Za-z0-9_-]+/);
  await p2.goto(`${PHOTOS}${link}`, { waitUntil: "networkidle" });
  expect(await p2.request.get(`${PHOTOS}/client/home`, { maxRedirects: 0 })).toBeTruthy();
  await p2.getByRole("button", { name: "Continue to my portal" }).click();
  await expect(p2).toHaveURL(/\/client\/home$/, { timeout: 25_000 });
  await p2.goto(`${PHOTOS}${link}`, { waitUntil: "networkidle" });
  await expect(p2.getByRole("heading", { name: "This link has expired" })).toBeVisible();
  await fresh.close();
  await ctx.storageState({ path: `/tmp/portal-${uid}.json` });
  await ctx.close();
});

test("the home page lists what needs the client; documents open from the portal; another session cannot use those links", async ({
  browser,
}) => {
  const ctx = await browser.newContext({ storageState: `/tmp/portal-${uid}.json` });
  const page = await ctx.newPage();
  await page.goto(`${PHOTOS}/client/home`, { waitUntil: "networkidle" });
  const todo = page.getByRole("region", { name: "What needs you" });
  await expect(todo).toContainText(/Invoice \d{4}-\d{4}/);
  await expect(todo).toContainText("Sign:");
  const payHref = (await todo.getByRole("link", { name: "Pay" }).first().getAttribute("href")) as string;
  expect(payHref).toMatch(/^\/client\/pay\/p\./);
  await page.goto(`${PHOTOS}${payHref}`, { waitUntil: "networkidle" });
  await expect(page.getByRole("button", { name: /^Pay/ })).toBeVisible();
  // a different browser with no session gets nothing from the same capability link
  const other = await browser.newContext();
  expect((await other.request.get(`${PHOTOS}${payHref}`)).status()).toBe(404);
  // a hand-typed id: reference is refused
  expect((await other.request.get(`${PHOTOS}/client/pay/id:00000000-0000-4000-8000-000000000000`)).status()).toBe(404);
  await other.close();
  await page.goto(`${PHOTOS}/client/home`, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "Open" }).first().click();
  await expect(page.locator("[data-protected='strict'] img[src^='blob:']").first()).toBeVisible({ timeout: 25_000 });
  await ctx.close();
});

test("job status shows the estimated delivery the owner set; the appointment can be moved and cancelled inside the policy", async ({
  page,
  browser,
}) => {
  await page.goto(`${PHOTOS}/studio/portal`, { waitUntil: "networkidle" });
  const eta = monday(8);
  const jobRow = page.locator("li[data-job-id]").filter({ hasText: `Portal job ${uid}` });
  await jobRow.locator('input[type="date"]').fill(eta);
  await jobRow.getByRole("button", { name: "Save" }).click();
  await slow(page.getByRole("status")).toContainText("Estimated delivery saved");

  const ctx = await browser.newContext({ storageState: `/tmp/portal-${uid}.json` });
  const c = await ctx.newPage();
  await c.goto(`${PHOTOS}/client/home`, { waitUntil: "networkidle" });
  await c
    .getByRole("listitem")
    .filter({ hasText: `Portal job ${uid}` })
    .getByRole("link", { name: "Details" })
    .click();
  await expect(c.getByRole("status").first()).toContainText(`Estimated delivery: ${eta}`);
  await expect(c.getByRole("list", { name: /Progress/ })).toBeVisible();
  // the consultation booked online lives on its own job
  await c.goto(`${PHOTOS}/client/home`, { waitUntil: "networkidle" });
  await c.getByRole("listitem").filter({ hasText: "Free consultation" }).getByRole("link", { name: "Details" }).click();
  // reschedule to another day's first free time
  await c.getByText("Pick another time").click();
  await c.getByLabel("Day").fill(monday(5));
  const slot = c.getByRole("list", { name: "Free times" }).getByRole("button").first();
  await expect(slot).toBeVisible({ timeout: 15_000 });
  await slot.click();
  await slow(c.getByRole("status").filter({ hasText: "Moved" })).toBeVisible();
  // cancel
  await c.getByRole("button", { name: "Cancel this appointment" }).click();
  await slow(c.getByRole("status").filter({ hasText: "Cancelled" })).toBeVisible();
  await ctx.close();
});

test("messages: the client writes, the owner replies, the client sees the reply with an unread badge and the emails in the thread", async ({
  page,
  browser,
}) => {
  const ctx = await browser.newContext({ storageState: `/tmp/portal-${uid}.json` });
  const c = await ctx.newPage();
  await c.goto(`${PHOTOS}/client/messages`, { waitUntil: "networkidle" });
  const compose = inForm(c, "New message");
  await compose.getByRole("textbox").last().fill(`When will my photos be ready? ${uid}`);
  await compose.getByRole("button", { name: "Send" }).click();
  await slow(c.getByRole("status").filter({ hasText: "Sent" })).toBeVisible();

  await page.goto(`${PHOTOS}/studio/portal`, { waitUntil: "networkidle" });
  const thread = page.locator("[data-thread-client]").filter({ hasText: `Portal Client ${uid}` });
  await expect(thread).toContainText(`When will my photos be ready? ${uid}`);
  await expect(thread).toContainText("1 new");
  await thread.getByRole("textbox").fill(`Friday, with an email when it's up. ${uid}`);
  await thread.getByRole("button", { name: "Send reply" }).click();
  await slow(page.getByRole("status")).toContainText("Sent");

  await c.goto(`${PHOTOS}/client/home`, { waitUntil: "networkidle" });
  await expect(c.getByRole("link", { name: /Messages \(1\)/ })).toBeVisible();
  await c.getByRole("link", { name: /Messages/ }).click();
  const convo = c.getByRole("list", { name: "Conversation" });
  await expect(convo).toContainText(`Friday, with an email when it's up. ${uid}`);
  await expect(convo).toContainText("Studio (email)"); // emails sent to this client are part of the thread
  await expect(convo).not.toContainText("Sign in"); // sign-in emails are not shown
  await ctx.close();
});

test("preferences, password change and sign out; signed-out pages redirect to sign-in", async ({ browser }) => {
  const ctx = await browser.newContext({ storageState: `/tmp/portal-${uid}.json` });
  const c = await ctx.newPage();
  await c.goto(`${PHOTOS}/client/account`, { waitUntil: "networkidle" });
  const prefs = inForm(c, "Email preferences");
  await prefs.getByLabel("News and offers").check();
  await prefs.getByRole("button", { name: "Save" }).click();
  await slow(c.getByRole("status").filter({ hasText: "Preferences saved" })).toBeVisible();
  const pw = inForm(c, "Password");
  await pw.getByLabel("Current password").fill("not right");
  await pw.getByLabel("New password").fill("a brand new long passphrase 7");
  await pw.getByLabel("Type it again").fill("a brand new long passphrase 7");
  await pw.getByRole("button", { name: "Save password" }).click();
  await slow(c.locator("p.st-error")).toContainText("current password");
  // the password fields clear after an error, on purpose
  await pw.getByLabel("Current password").fill(PASSWORD);
  await pw.getByLabel("New password").fill("a brand new long passphrase 7");
  await pw.getByLabel("Type it again").fill("a brand new long passphrase 7");
  await pw.getByRole("button", { name: "Save password" }).click();
  await slow(c.getByRole("status").filter({ hasText: "Password saved" })).toBeVisible();
  await c.getByRole("button", { name: "Sign out" }).click();
  await expect(c).toHaveURL(/\/client$/);
  await c.goto(`${PHOTOS}/client/messages`);
  await expect(c).toHaveURL(/\/client\/login$/);
  await ctx.close();
});
