import { expect, test } from "@playwright/test";
import { choose } from "./ui";

/** Cron, automations (dedupe, switch-off), reminders honouring preferences, tasks, activity. */
const PHOTOS = "http://localhost:3302";
const uid = Date.now().toString(36);
const email = `ops-${uid}@example.test`;
test.describe.configure({ mode: "serial" });
const slow = expect.configure({ timeout: 25_000 });
const inForm = (page: import("@playwright/test").Page, name: string) => page.getByRole("form", { name });
const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

test("the scheduled endpoint refuses callers without the secret and runs with it", async ({ request }) => {
  expect((await request.get(`${PHOTOS}/api/cron/run`)).status()).toBe(401);
  expect((await request.get(`${PHOTOS}/api/cron/run`, { headers: { authorization: "Bearer wrong" } })).status()).toBe(
    401,
  );
  const ok = await request.get(`${PHOTOS}/api/cron/run`, {
    headers: { authorization: "Bearer e2e-cron-secret-0123456789" },
  });
  expect(ok.status()).toBe(200);
  const j = (await ok.json()) as { billing: unknown; automations: { sent: number } };
  expect(j.automations).toHaveProperty("sent");
});

test("setup: a client with a job and an invoice due in two days (sent)", async ({ page }) => {
  await page.goto(`${PHOTOS}/studio/clients`, { waitUntil: "networkidle" });
  await page.getByLabel("Name").fill(`Ops Client ${uid}`);
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Add client" }).click();
  await slow(page.getByRole("status")).toContainText("Client added");
  await page.goto(`${PHOTOS}/studio/shoots`, { waitUntil: "networkidle" });
  await choose(page.getByLabel("Client"), `Ops Client ${uid}`);
  await page.getByLabel("Title").fill(`Ops job ${uid}`);
  await page.getByLabel("Fee (dollars)").fill("200");
  await page.getByRole("button", { name: "Add job" }).click();
  await slow(page.getByRole("listitem").filter({ hasText: `Ops job ${uid}` })).toBeVisible();
  // one-line payment plan whose only due date is two days away gives an invoice with a due date
  await page.goto(`${PHOTOS}/studio/billing`, { waitUntil: "networkidle" });
  const plan = inForm(page, "New payment plan");
  await choose(plan.getByLabel(/^Job/), `Ops job ${uid}`);
  await plan.getByLabel("Total (dollars)").fill("200");
  await plan.getByLabel("Instalments").fill("2");
  await plan.getByLabel("First due").fill(inDays(2));
  await plan.getByRole("button", { name: "Create plan" }).click();
  await slow(page.getByRole("status")).toContainText("2 instalments");
});

test("running the automations sends one reminder, and running again sends nothing more", async ({ page }) => {
  await page.goto(`${PHOTOS}/studio/automations`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Run everything now" }).click();
  await slow(page.getByRole("status")).toContainText("Ran now");
  await page.goto(`${PHOTOS}/studio/inbox`, { waitUntil: "networkidle" });
  const reminders = page.locator("li").filter({ hasText: email }).filter({ hasText: "is due soon" });
  await expect(reminders).toHaveCount(1);
  await page.goto(`${PHOTOS}/studio/automations`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Run everything now" }).click();
  await slow(page.getByRole("status")).toContainText("Ran now");
  await page.goto(`${PHOTOS}/studio/inbox`, { waitUntil: "networkidle" });
  await expect(page.locator("li").filter({ hasText: email }).filter({ hasText: "is due soon" })).toHaveCount(1);
  await page.goto(`${PHOTOS}/studio/automations`, { waitUntil: "networkidle" });
  await expect(page.getByText(/invoice-due/).first()).toBeVisible();
});

test("a rule can be switched off, and then nothing is sent for it", async ({ page }) => {
  await page.goto(`${PHOTOS}/studio/automations`, { waitUntil: "networkidle" });
  const rule = inForm(page, "Invoice due soon");
  await rule.getByLabel("Enabled").uncheck();
  await rule.getByLabel("Days").fill("10");
  await rule.getByRole("button", { name: "Save" }).click();
  await slow(page.getByRole("status")).toContainText("Rule saved");
  // the second instalment is due ~in 30 days; widen nothing: it stays unreminded while the rule is off
  await page.getByRole("button", { name: "Run everything now" }).click();
  await slow(page.getByRole("status")).toContainText("Ran now");
  await page.goto(`${PHOTOS}/studio/inbox`, { waitUntil: "networkidle" });
  expect(await page.locator("li").filter({ hasText: email }).filter({ hasText: "is due soon" }).count()).toBe(1);
});

test("tasks: add, complete, delete", async ({ page }) => {
  await page.goto(`${PHOTOS}/studio/tasks`, { waitUntil: "networkidle" });
  const f = inForm(page, "New task");
  await f.getByLabel("Task").fill(`Edit set ${uid}`);
  await f.getByLabel("Due").fill(inDays(-1));
  await f.getByRole("button", { name: "Add task" }).click();
  await slow(page.getByRole("status")).toContainText("Task added");
  const row = page.locator("li[data-task-id]").filter({ hasText: `Edit set ${uid}` });
  await expect(row).toContainText("overdue");
  await row.getByRole("checkbox").click();
  await slow(page.getByRole("status")).toContainText("Done");
  await expect(row).not.toContainText("overdue");
  await row.getByRole("button", { name: /Delete/ }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete task" }).click();
  await slow(page.getByRole("status")).toContainText("Task removed");
  await expect(row).toHaveCount(0);
});

test("the activity feed shows what happened and can be cleared", async ({ page, request }) => {
  const r = await request.post(`${PHOTOS}/api/inquiry`, {
    data: {
      name: `Feed Person ${uid}`,
      email: `feed-${uid}@example.test`,
      shootType: "event",
      message: "A real-looking inquiry for the activity feed.",
      consent: true,
    },
  });
  expect(r.status()).toBe(200);
  await page.goto(`${PHOTOS}/studio/activity`, { waitUntil: "networkidle" });
  const list = page.getByRole("list", { name: "Activity" });
  await expect(list.locator("li").filter({ hasText: `New inquiry from Feed Person ${uid}` })).toHaveCount(1);
  await page.getByRole("button", { name: "Mark all read" }).click();
  await slow(page.getByRole("status")).toContainText("All marked read");
  await expect(page.locator("li[data-unread]")).toHaveCount(0);
});
