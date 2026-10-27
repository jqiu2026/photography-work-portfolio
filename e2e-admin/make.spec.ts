import { expect as baseExpect, test } from "@playwright/test";
import { choose } from "./ui";

/**
 * The Make site end to end against the dev servers: the studio makes a project, a screenshot stays hidden until it is
 * described and marked checked, the showcase holds at most five, and the now log shows on the site.
 */
const expect = baseExpect.configure({ timeout: 30_000 });
const MAKE = "http://localhost:3306";
const uid = Date.now().toString(36);

/** A 1x1 PNG. */
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

test.describe.configure({ mode: "serial" });
test.setTimeout(240_000);

test("a screenshot stays hidden until it is described and marked checked", async ({ page, request }) => {
  const title = `E2E Project ${uid}`;
  await page.goto(`${MAKE}/studio/projects/new`, { waitUntil: "networkidle" });
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("One-line summary").fill("A project made by the end-to-end test.");
  await page.getByLabel("Tools", { exact: true }).fill("TypeScript, Postgres");
  await page
    .getByLabel("Write-up (Markdown)")
    .fill("## How it works\n\nIt just does.\n\n[a link](https://example.com) and [bad](javascript:alert(1))");
  await choose(page.getByLabel("Where it stands"), "Shelf: finished and working");
  await page.getByLabel("Published in the showcase").check();
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page).toHaveURL(/\/studio\/projects\/[0-9a-f-]{36}$/);
  const editUrl = page.url();

  await page.locator('input[type="file"]').setInputFiles({ name: "shot.png", mimeType: "image/png", buffer: PNG });
  await page.getByRole("button", { name: "Upload" }).click();
  await expect(page.getByText(/stays hidden until/)).toBeVisible();
  await page.goto(editUrl, { waitUntil: "networkidle" });
  const imgSrc = await page.locator('img[src^="/studio/preview/"]').first().getAttribute("src");
  expect(imgSrc).toBeTruthy();
  const imageId = (imgSrc as string).split("/").pop() as string;

  // hidden while unchecked
  expect((await request.get(`${MAKE}/api/img/${imageId}`)).status()).toBe(404);

  // checking needs a description
  await page.getByLabel("Checked: no secrets or private data").check();
  await page.getByRole("button", { name: "Save", exact: true }).first().click();
  await expect(page.getByText(/Describe the screenshot/)).toBeVisible();
  await page.getByLabel("Description (for people who cannot see it)").fill("A one pixel test image");
  await page.getByRole("button", { name: "Save", exact: true }).first().click();
  await expect(page.getByText("Saved.").first()).toBeVisible();
  expect((await request.get(`${MAKE}/api/img/${imageId}`)).status()).toBe(200);

  // the public page: place with its plain meaning, tools, safe links only
  await page.goto(`${MAKE}/projects?place=shelf`, { waitUntil: "networkidle" });
  await expect(page.getByText("Finished and working").first()).toBeVisible();
  await page.getByRole("link", { name: new RegExp(title) }).click();
  await expect(page.getByRole("img", { name: "A one pixel test image" })).toBeVisible();
  await expect(page.getByRole("link", { name: "a link" })).toHaveAttribute("href", "https://example.com");
  await expect(page.getByRole("link", { name: "bad" })).toHaveCount(0);
  await expect(page.getByText("TypeScript").first()).toBeVisible();
  await page.goto(`${MAKE}/tools`, { waitUntil: "networkidle" });
  await expect(page.getByText("Postgres").first()).toBeVisible();
});

test("the showcase holds at most five published projects", async ({ page }) => {
  await page.goto(`${MAKE}/studio/projects`, { waitUntil: "networkidle" });
  const published = await page.getByText("published", { exact: true }).count();
  for (let i = published; i < 5; i++) {
    await page.goto(`${MAKE}/studio/projects/new`, { waitUntil: "networkidle" });
    await page.getByLabel("Title").fill(`Filler ${uid} ${i}`);
    await page.getByLabel("Published in the showcase").check();
    await page.getByRole("button", { name: "Create project" }).click();
    await expect(page).toHaveURL(/\/studio\/projects\/[0-9a-f-]{36}$/);
  }
  await page.goto(`${MAKE}/studio/projects/new`, { waitUntil: "networkidle" });
  await page.getByLabel("Title").fill(`One too many ${uid}`);
  await page.getByLabel("Published in the showcase").check();
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page.getByText(/holds at most 5 projects/)).toBeVisible();
});

test("a line in the now log shows on the site", async ({ page }) => {
  await page.goto(`${MAKE}/studio/now`, { waitUntil: "networkidle" });
  await page.getByLabel("What are you working on?").fill(`Testing the log ${uid}`);
  await page.getByRole("button", { name: "Log it" }).click();
  await expect(page.getByText("Logged.")).toBeVisible();
  await page.goto(`${MAKE}/now`, { waitUntil: "networkidle" });
  await expect(page.getByText(`Testing the log ${uid}`)).toBeVisible();
});
