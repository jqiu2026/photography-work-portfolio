import { expect, type Page } from "@playwright/test";

type File = { name: string; mimeType: string; buffer: Buffer };

/** Creates an empty draft gallery for a job through the studio and opens it. Returns the client passcode (shown once) and the page URL. */
export async function newGallery(page: Page, photos: string, jobTitle: string, title?: string) {
  await page.goto(`${photos}/studio/galleries`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "New gallery" }).click();
  const form = page.getByRole("form", { name: "New gallery" });
  const select = form.locator("select");
  const value = await select.evaluate(
    (el, t) => [...(el as HTMLSelectElement).options].find((o) => o.text.includes(t))?.value ?? "",
    jobTitle,
  );
  expect(value).not.toBe("");
  await select.selectOption(value);
  if (title) await form.getByLabel(/^Title/).fill(title);
  await form.getByRole("button", { name: "Create" }).click();
  const made = page.getByRole("status", { name: "Gallery created" });
  await expect(made).toBeVisible({ timeout: 25_000 });
  const passcode = ((await made.locator("code").textContent()) ?? "").trim();
  expect(passcode.length).toBeGreaterThanOrEqual(6);
  await made.getByRole("button", { name: "Open the gallery" }).click();
  await expect(page).toHaveURL(/\/studio\/gallery\/[0-9a-f-]{36}/, { timeout: 25_000 });
  return { passcode, url: page.url().split("#")[0] };
}

/** Uploads photographs inside the open gallery page and waits for them to be processed. */
export async function uploadPhotos(page: Page, files: File[], expected = files.length) {
  if (!(await page.locator("input[type=file]").count()))
    await page.getByRole("button", { name: "Upload photographs" }).click();
  await page.locator("input[type=file]").setInputFiles(files);
  await expect(page.getByRole("status").filter({ hasText: /of \d+ done/ })).toContainText(
    `${files.length} of ${files.length} done`,
    {
      timeout: 60_000,
    },
  );
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("li[data-media-id]")).toHaveCount(expected);
}

/** Publishes the open gallery from its header. */
export async function publishOpenGallery(page: Page) {
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Published" })).toBeVisible({ timeout: 25_000 });
}
