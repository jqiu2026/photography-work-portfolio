import { expect, type Page } from "@playwright/test";
import { choose, note } from "./ui";

type File = { name: string; mimeType: string; buffer: Buffer };

/** Creates an empty draft gallery for a job through the studio and opens it. Returns the client passcode (shown once) and the page URL. */
export async function newGallery(page: Page, photos: string, jobTitle: string, title?: string) {
  await page.goto(`${photos}/studio/galleries`, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "New gallery" }).click();
  const form = page.getByRole("form", { name: "New gallery" });
  await choose(
    form.getByRole("combobox", { name: "Job" }),
    new RegExp(jobTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
  );
  if (title) await form.getByLabel(/^Title/).fill(title);
  await form.getByRole("button", { name: "Create" }).click();
  const made = page.getByRole("status", { name: "Gallery created" });
  await expect(made).toBeVisible({ timeout: 25_000 });
  const passcode = ((await made.locator("code").textContent()) ?? "").trim();
  expect(passcode.length).toBeGreaterThanOrEqual(6);
  await made.getByRole("button", { name: "Open the gallery" }).click();
  await expect(page).toHaveURL(/\/studio\/gallery\/[0-9a-f-]{36}/, { timeout: 25_000 });
  // the gallery's own address is the one link to share
  await page.getByRole("tab", { name: "Share" }).click();
  const slug = await page.getByLabel("Gallery address").inputValue();
  expect(slug).toMatch(/^[a-z0-9-]{3,48}$/);
  await page.getByRole("tab", { name: "Photos" }).click();
  return { passcode, slug, url: page.url().split("#")[0] };
}

/** Uploads photographs inside the open gallery page and waits for them to be processed. */
export async function uploadPhotos(page: Page, files: File[], expected = files.length) {
  if (!(await page.locator("input[type=file]").count()))
    await page.getByRole("button", { name: "Upload photographs" }).click();
  await page.locator("input[type=file]").setInputFiles(files);
  await expect(
    note(page)
      .filter({ hasText: /of \d+ done/ })
      .first(),
  ).toContainText(`${files.length} of ${files.length} done`, {
    timeout: 60_000,
  });
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("li[data-media-id]")).toHaveCount(expected);
}

/** Publishes the open gallery from its header. */
export async function publishOpenGallery(page: Page) {
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(note(page).filter({ hasText: "Published" }).first()).toBeVisible({ timeout: 25_000 });
}

/** Past the cover page and the rules note, if the gallery has them (they appear once per visit). */
export async function enterGallery(page: Page) {
  const view = page.getByRole("button", { name: "View Gallery" });
  const nav = page.getByRole("navigation", { name: "Gallery" });
  await expect(view.or(nav)).toBeVisible({ timeout: 25_000 });
  if (await view.isVisible()) await view.click();
  await expect(nav).toBeVisible({ timeout: 25_000 });
  const cont = page.getByRole("dialog").getByRole("button", { name: "Continue" });
  if (await cont.isVisible().catch(() => false)) await cont.click();
}

/** A client opens their gallery the only way there is: its own link, then the passcode on that page. */
export async function clientOpen(page: Page, photos: string, slug: string, passcode: string) {
  await page.goto(`${photos}/g/${slug}`, { waitUntil: "networkidle" });
  await page.getByLabel("Passcode").fill(passcode);
  await page.getByRole("button", { name: "Open my gallery" }).click();
  await enterGallery(page);
}
