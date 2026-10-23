import { expect, test } from "@playwright/test";
import { choose, note } from "./ui";

/** Contract templates, releases (minor + guardian), e-sign consent, questionnaires and the gallery policy clause. */
const PHOTOS = "http://localhost:3302";
const uid = Date.now().toString(36);
const email = `forms-${uid}@example.test`;
test.describe.configure({ mode: "serial" });
const slow = expect.configure({ timeout: 25_000 });
const select = (form: import("@playwright/test").Locator, label: RegExp) => form.getByLabel(label);

test("owner adds a client and a job, saves policies, and creates a contract from the Event template with merged fields", async ({
  page,
}) => {
  await page.goto(`${PHOTOS}/studio/clients`, { waitUntil: "networkidle" });
  await page.getByLabel("Name").fill(`Forms Client ${uid}`);
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Add client" }).click();
  await slow(note(page).last()).toContainText("Client added");
  await page.goto(`${PHOTOS}/studio/shoots`, { waitUntil: "networkidle" });
  await choose(page.getByLabel("Client"), `Forms Client ${uid}`);
  await page.getByLabel("Title").fill(`Forms job ${uid}`);
  await page.getByLabel("Fee (dollars)").fill("500");
  await page.getByRole("button", { name: "Add job" }).click();
  await slow(page.getByRole("listitem").filter({ hasText: `Forms job ${uid}` })).toBeVisible();

  await page.goto(`${PHOTOS}/studio/forms`, { waitUntil: "networkidle" });
  const pol = page.getByRole("form", { name: "Policies" });
  await pol.getByLabel("Gallery access included (months)").fill("6");
  await pol.getByLabel(/Extension and reactivation fee/).fill("30");
  await pol.getByRole("button", { name: "Save" }).click();
  await slow(note(page).last()).toContainText("Policies saved");

  const make = page.getByRole("form", { name: "Create from template" });
  await choose(select(make, /^Job/), `Forms job ${uid}`);
  await choose(select(make, /^Template/), "Event photography agreement");
  await make.getByRole("button", { name: "Create draft" }).click();
  await slow(note(page).last()).toContainText("Created (draft)");

  await page.goto(`${PHOTOS}/studio/contracts`, { waitUntil: "networkidle" });
  const row = page
    .getByRole("listitem")
    .filter({ hasText: `Forms job ${uid}` })
    .first();
  await row.getByRole("button", { name: "Send for signature" }).click();
  await slow(page.locator(".hm-toast-description").last()).toContainText("/client/sign/");
  const link = ((await page.locator(".hm-toast-description").last().textContent()) as string).replace(
    /^https?:\/\/[^/]+/,
    "",
  );
  await page.goto(`${PHOTOS}${link}`, { waitUntil: "networkidle" });
  const text = (await page.locator("pre.st-contract").textContent()) as string;
  expect(text).toContain("SAMPLE ONLY");
  expect(text).toContain(`Forms Client ${uid}`);
  expect(text).toContain("$500.00");
  expect(text).toContain("stays available for 6 months");
  expect(text).toContain("$30.00 per additional 3 months");
  // signing needs the terms box AND the e-sign consent
  await page.getByLabel("Type your full name to sign").fill(`Forms Client ${uid}`);
  await page.getByLabel(/I agree to these terms/).check();
  await page.getByRole("button", { name: "Sign contract" }).click();
  await slow(page.locator("p[role=alert]")).toContainText("electronically");
  await page.getByLabel(/sign, and to keep records/).check();
  await page.getByRole("button", { name: "Sign contract" }).click();
  await slow(note(page).last()).toContainText("Signed");
});

test("a release for a minor needs the guardian's name", async ({ page }) => {
  await page.goto(`${PHOTOS}/studio/forms`, { waitUntil: "networkidle" });
  const make = page.getByRole("form", { name: "Create from template" });
  await choose(select(make, /^Job/), `Forms job ${uid}`);
  await choose(select(make, /^Template/), "Model release");
  await make.getByRole("button", { name: "Create draft" }).click();
  await slow(note(page).last()).toContainText("who or what");
  await make.getByLabel("Who or what it covers").fill("Sam Student");
  await make.getByLabel(/under 18/).check();
  await make.getByRole("button", { name: "Create draft" }).click();
  await slow(note(page).last()).toContainText("Created (draft)");
  await page.goto(`${PHOTOS}/studio/contracts`, { waitUntil: "networkidle" });
  const row = page
    .getByRole("listitem")
    .filter({ hasText: `Forms job ${uid}` })
    .filter({ hasText: "Model release" })
    .first();
  await row.getByRole("button", { name: "Send for signature" }).click();
  await slow(page.locator(".hm-toast-description").last()).toContainText("/client/sign/");
  const link = ((await page.locator(".hm-toast-description").last().textContent()) as string).replace(
    /^https?:\/\/[^/]+/,
    "",
  );
  await page.goto(`${PHOTOS}${link}`, { waitUntil: "networkidle" });
  await page.getByLabel("Type your full name to sign").fill("Pat Parent");
  await page.getByLabel(/I agree to these terms/).check();
  await page.getByLabel(/sign, and to keep records/).check();
  await page.getByRole("button", { name: "Sign contract" }).click();
  await slow(page.locator("p[role=alert]")).toContainText("guardian");
  await page.getByLabel(/Parent or legal guardian/).fill("Pat Parent");
  await page.getByRole("button", { name: "Sign contract" }).click();
  await slow(note(page).last()).toContainText("Signed");
});

test("a questionnaire is sent by email, answered once through its link, and the answers show in the studio", async ({
  page,
}) => {
  await page.goto(`${PHOTOS}/studio/forms`, { waitUntil: "networkidle" });
  const send = page.getByRole("form", { name: "Send questionnaire" });
  await choose(select(send, /^Questionnaire/), "Event details");
  await choose(select(send, /^Client/), `Forms Client ${uid}`);
  await send.getByRole("button", { name: "Send" }).click();
  await slow(page.locator(".hm-toast-description").last()).toContainText("/client/questionnaire/");
  const link = ((await page.locator(".hm-toast-description").last().textContent()) as string).replace(
    /^https?:\/\/[^/]+/,
    "",
  );
  await page.goto(`${PHOTOS}/studio/inbox`, { waitUntil: "networkidle" });
  await expect(
    page.locator("li").filter({ hasText: email }).filter({ hasText: "questionnaire-sent" }).first(),
  ).toBeVisible();

  await page.goto(`${PHOTOS}${link}`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Send my answers" }).click();
  await slow(page.locator("p.st-error")).toContainText("Please answer");
  await page.getByLabel(/What time does the event start/).fill("3pm to 6pm");
  await page.getByLabel(/Moments or people that must/).fill("The cake");
  await page
    .getByRole("group", { name: /Will children be photographed/ })
    .getByRole("radio", { name: "Yes" })
    .check();
  await page.getByLabel(/Who is my contact/).fill("Pat 555-0100");
  await page.getByRole("button", { name: "Send my answers" }).click();
  await slow(note(page).last()).toContainText("Your answers are saved");
  await page.goto(`${PHOTOS}${link}`, { waitUntil: "networkidle" });
  await expect(note(page).last()).toContainText("Your answers were sent");

  await page.goto(`${PHOTOS}/studio/forms`, { waitUntil: "networkidle" });
  const ans = page.locator("li[data-send-id]").filter({ hasText: `Forms Client ${uid}` });
  await ans.locator("summary").click();
  await expect(ans).toContainText("3pm to 6pm");
  await expect(ans).toContainText("The cake");
  expect((await page.request.get(`${PHOTOS}/client/questionnaire/not-a-token`)).status()).toBe(404);
});
