import { expect, test } from "@playwright/test";
import { choose, pickDate } from "./ui";

/** Pipeline, calendar, availability, online booking with a deposit hold, mini-sessions, the .ics feed and the embed. */
const PHOTOS = "http://localhost:3302";
const uid = Date.now().toString(36);
test.describe.configure({ mode: "serial" });
const slow = expect.configure({ timeout: 25_000 });

/** A Monday far enough ahead to clear the default notice, as YYYY-MM-DD. */
function monday(weeksAhead: number) {
  const d = new Date(Date.now() + 14 * 86_400_000 + weeksAhead * 7 * 86_400_000);
  d.setUTCDate(d.getUTCDate() + ((8 - d.getUTCDay()) % 7 || 7));
  return d.toISOString().slice(0, 10);
}
const MON = monday(0);

test("owner sets bookable hours and a blocked day; the calendar refuses a double booking", async ({ page }) => {
  await page.goto(`${PHOTOS}/studio/calendar`, { waitUntil: "networkidle" });
  const hours = page.locator('section[aria-labelledby="cal-hours"]');
  await choose(hours.getByLabel("Day"), "Monday");
  await hours.getByLabel("From").fill("10:00");
  await hours.getByLabel("To").fill("14:00");
  await hours.getByRole("button", { name: "Add hours" }).click();
  await slow(page.getByRole("status")).toContainText("Hours added");

  const add = page.locator('section[aria-labelledby="cal-add"]');
  const fill = async (title: string, start: string, end: string) => {
    await add.getByLabel("Title").fill(title);
    await pickDate(add.getByLabel("Date", { exact: true }), monday(3));
    await add.getByLabel("Start").fill(start);
    await add.getByLabel("End").fill(end);
    await add.getByRole("button", { name: "Add" }).click();
  };
  await fill(`Wedding ${uid}`, "09:00", "11:00");
  await slow(page.getByRole("status")).toContainText("Added to the calendar");
  await fill(`Clash ${uid}`, "10:30", "12:00");
  await slow(page.locator("p.st-error")).toContainText(`conflicts with "Wedding ${uid}"`);
  await fill(`Buffer clash ${uid}`, "11:05", "12:00"); // inside the 15 minute default buffer
  await slow(page.locator("p.st-error")).toContainText("conflicts");
  await expect(page.locator("li[data-appointment-id]").filter({ hasText: `Wedding ${uid}` })).toHaveCount(1);

  const black = page.locator('section[aria-labelledby="cal-black"]');
  await pickDate(black.getByLabel("Day"), monday(4));
  await black.getByRole("button", { name: "Block day" }).click();
  await slow(page.getByRole("status")).toContainText("Day blocked");
});

test("the slots API offers free times only, and not on a blocked day or outside the hours", async ({ request }) => {
  const free = await request.get(`${PHOTOS}/api/slots?kind=consult&date=${MON}`);
  expect(free.status()).toBe(200);
  const j = (await free.json()) as { slots: { start: string; label: string }[] };
  expect(j.slots.length).toBeGreaterThan(3);
  const blocked = (await (await request.get(`${PHOTOS}/api/slots?kind=consult&date=${monday(4)}`)).json()) as {
    slots: unknown[];
  };
  expect(blocked.slots).toHaveLength(0);
  const tuesday = new Date(`${MON}T12:00:00Z`);
  tuesday.setUTCDate(tuesday.getUTCDate() + 1);
  const off = (await (
    await request.get(`${PHOTOS}/api/slots?kind=consult&date=${tuesday.toISOString().slice(0, 10)}`)
  ).json()) as { slots: unknown[] };
  expect(off.slots).toHaveLength(0);
  expect((await request.get(`${PHOTOS}/api/slots?kind=nope&date=${MON}`)).status()).toBe(400);
});

test("a visitor books a free consultation; it is confirmed, emailed, and that time disappears", async ({ page }) => {
  await page.goto(`${PHOTOS}/book/schedule`, { waitUntil: "networkidle" });
  await pickDate(page.getByLabel("Pick a day"), MON);
  const first = page.getByRole("group", { name: "Free times" }).getByRole("button").first();
  await expect(first).toBeVisible({ timeout: 15_000 });
  const label = (await first.textContent()) as string;
  await first.click();
  await page.getByLabel("Your name").fill(`Consult ${uid}`);
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(`consult-${uid}@example.com`);
  await page.getByLabel(/I agree that my details are stored/).check();
  await page.getByRole("button", { name: "Book this time" }).click();
  await slow(page.getByRole("status")).toContainText("You're booked");
  await page.goto(`${PHOTOS}/book/schedule`, { waitUntil: "networkidle" });
  await pickDate(page.getByLabel("Pick a day"), MON);
  await expect(page.getByRole("group", { name: "Free times" }).getByRole("button").first()).not.toHaveText(label, {
    timeout: 15_000,
  });
  await page.goto(`${PHOTOS}/studio/inbox`, { waitUntil: "networkidle" });
  await expect(
    page
      .locator("li")
      .filter({ hasText: `consult-${uid}@example.com` })
      .first(),
  ).toContainText("mock");
});

test("a paid session is held until the deposit is paid (mock card), then confirmed and the job is booked", async ({
  page,
}) => {
  await page.goto(`${PHOTOS}/book/schedule`, { waitUntil: "networkidle" });
  await page.getByLabel(/Portrait session/).check();
  await pickDate(page.getByLabel("Pick a day"), monday(1));
  const slot = page.getByRole("group", { name: "Free times" }).getByRole("button").first();
  await expect(slot).toBeVisible({ timeout: 15_000 });
  await slot.click();
  await expect(page.getByText(/SAMPLE amount/)).toBeVisible();
  await page.getByLabel("Your name").fill(`Deposit ${uid}`);
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(`deposit-${uid}@example.com`);
  await page.getByLabel(/I agree that my details are stored/).check();
  await page.getByRole("button", { name: "Hold this time" }).click();
  await expect(page).toHaveURL(/\/client\/pay\//, { timeout: 25_000 });
  await expect(page.getByRole("note", { name: "Mock notice" })).toContainText("no card is charged");
  await page.getByLabel("Card number").fill("4242 4242 4242 4242");
  await page.getByLabel(/Expiry/).fill("12 / 34");
  await page.getByLabel("Security code").fill("123");
  await page.getByRole("button", { name: /^Pay/ }).click();
  await slow(page.getByRole("status")).toContainText("Receipt rcpt_mock_");

  await page.goto(`${PHOTOS}/studio/calendar`, { waitUntil: "networkidle" });
  const row = page.locator("li[data-appointment-id]").filter({ hasText: `Deposit ${uid}` });
  await expect(row).toContainText("confirmed");
  await page.goto(`${PHOTOS}/studio/pipeline`, { waitUntil: "networkidle" });
  const booked = page.locator('section[aria-labelledby="col-booked"]');
  await expect(booked.locator("li[data-job-id]").filter({ hasText: `Deposit ${uid}` })).toHaveCount(1);
  await page.goto(`${PHOTOS}/studio/inbox`, { waitUntil: "networkidle" });
  await expect(page.getByText(/Booked: Portrait session/).first()).toBeVisible();
});

test("the pipeline moves a job forward", async ({ page }) => {
  await page.goto(`${PHOTOS}/studio/pipeline`, { waitUntil: "networkidle" });
  const card = page
    .locator('section[aria-labelledby="col-booked"] li[data-job-id]')
    .filter({ hasText: `Deposit ${uid}` });
  await card.getByRole("button", { name: /Move .* to Shot/ }).click();
  await expect(
    page.locator('section[aria-labelledby="col-shot"] li[data-job-id]').filter({ hasText: `Deposit ${uid}` }),
  ).toHaveCount(1, { timeout: 25_000 });
});

test("mini-sessions: the owner opens slots, one visitor wins a slot, the next sees it gone", async ({
  page,
  browser,
}) => {
  await page.goto(`${PHOTOS}/studio/calendar`, { waitUntil: "networkidle" });
  const mini = page.locator('section[aria-labelledby="cal-mini"]');
  await mini.getByLabel("Name").fill(`Minis ${uid}`);
  await pickDate(mini.getByLabel("Day"), monday(6)); // a Monday far out (outside weekly hours: minis ignore hours)
  await mini.getByLabel("First slot").fill("16:00");
  await mini.getByLabel("Slots", { exact: true }).fill("2");
  await mini.getByRole("button", { name: "Open slots" }).click();
  await slow(page.getByRole("status")).toContainText("2 slots opened");

  const book = async (ctxPage: import("@playwright/test").Page, who: string) => {
    await ctxPage.goto(`${PHOTOS}/book/minis`, { waitUntil: "networkidle" });
    const group = ctxPage.getByRole("region", { name: `Minis ${uid}` });
    await group.getByRole("button").first().click();
    await ctxPage.getByLabel("Your name").fill(who);
    await ctxPage.getByRole("textbox", { name: "Email", exact: true }).fill(`${who.replace(/\s/g, "")}@example.com`);
    await ctxPage.getByLabel(/I agree/).check();
    await ctxPage.getByRole("button", { name: "Book this slot" }).click();
  };
  await book(page, `Mini One ${uid}`);
  await slow(page.getByRole("status")).toContainText("You're booked");
  const ctx2 = await browser.newContext();
  const p2 = await ctx2.newPage();
  await book(p2, `Mini Two ${uid}`);
  await expect(p2.getByRole("status")).toContainText("You're booked", { timeout: 25_000 });
  await p2.goto(`${PHOTOS}/book/minis`, { waitUntil: "networkidle" });
  await expect(p2.getByRole("region", { name: `Minis ${uid}` })).toHaveCount(0);
  await expect(p2.getByText(/No mini-session slots are open/)).toBeVisible();
  await ctx2.close();
});

test("the owner's .ics feed needs its secret link and is valid iCalendar", async ({ page, request }) => {
  await page.goto(`${PHOTOS}/studio/calendar`, { waitUntil: "networkidle" });
  const url = ((await page.locator("code").filter({ hasText: "/api/ics/" }).first().textContent()) as string).trim();
  const path = url.replace(/^https?:\/\/[^/]+/, "");
  const ok = await request.get(`${PHOTOS}${path}`);
  expect(ok.status()).toBe(200);
  expect(ok.headers()["content-type"]).toContain("text/calendar");
  const body = await ok.text();
  expect(body).toContain("BEGIN:VCALENDAR");
  expect(body).toContain(`Wedding ${uid}`);
  expect(body).toContain(`Minis ${uid} slot 1`); // booked mini-session slots are on the feed (open ones are not)
  expect((await request.get(`${PHOTOS}/api/ics/not-the-token`)).status()).toBe(404);
});

test("the embeddable inquiry form may be framed; other pages may not", async ({ request }) => {
  const embed = await request.get(`${PHOTOS}/embed/inquiry`);
  expect(embed.status()).toBe(200);
  expect(embed.headers()["content-security-policy"]).toContain("https://jerryqiu.com");
  const home = await request.get(`${PHOTOS}/book`);
  expect(home.headers()["content-security-policy"]).toBe("frame-ancestors 'self'");
});
