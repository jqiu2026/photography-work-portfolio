import { expect, test } from "@playwright/test";
import sharp from "sharp";

const uid = Date.now().toString(36);
const photo = (w: number, h: number, color: string) =>
  sharp({ create: { width: w, height: h, channels: 3, background: color } })
    .jpeg()
    .toBuffer();

test.describe("galleries", () => {
  test("create a gallery, upload into it, reorder, hide, set a cover, and delete it", async ({ page }) => {
    await page.goto("/admin/galleries/new", { waitUntil: "networkidle" });
    await page.getByRole("textbox", { name: /^Title/ }).fill(`E2E Gallery ${uid}`);
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/galleries\/[0-9a-f-]{36}$/);

    await page.getByLabel("Upload into this gallery").setInputFiles([
      { name: `g1-${uid}.jpg`, mimeType: "image/jpeg", buffer: await photo(900, 600, "#aa3333") },
      { name: `g2-${uid}.jpg`, mimeType: "image/jpeg", buffer: await photo(900, 600, "#33aa33") },
    ]);
    await expect(page.getByText("2 images added")).toBeVisible({ timeout: 40_000 });
    await page.waitForLoadState("networkidle");
    const items = page.locator(".adm-gitems li");
    await expect(items).toHaveCount(2, { timeout: 15_000 });
    await expect(items.first()).toContainText(`g1-${uid}.jpg`);

    // reorder with the arrows, and the order persists after a reload
    await items.first().getByRole("button", { name: "Move later" }).click();
    await expect(items.first()).toContainText(`g2-${uid}.jpg`);
    await page.waitForTimeout(800);
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator(".adm-gitems li").first()).toContainText(`g2-${uid}.jpg`);

    // caption + hide + cover
    const first = page.locator(".adm-gitems li").first();
    await first.getByLabel(/^Caption for/).fill("First light");
    await first.getByLabel(/^Alt text for/).fill("A green test image");
    await first.getByLabel(/^Alt text for/).blur();
    await first.getByRole("button", { name: "Hide from gallery" }).click();
    await first.getByRole("button", { name: "Use as cover" }).click();
    await expect(page.getByText("Cover set")).toBeVisible();
    await page.waitForTimeout(500);
    await page.reload({ waitUntil: "networkidle" });
    await expect(
      page
        .locator(".adm-gitems li")
        .first()
        .getByLabel(/^Caption for/),
    ).toHaveValue("First light");
    await expect(page.locator(".adm-gitems li").first()).toHaveAttribute("data-hidden", "true");

    // protection level is saved
    await page.getByLabel("Image protection").selectOption("strict");
    await page.getByRole("button", { name: "Save" }).first().click();
    await expect(page.locator(".hm-toast", { hasText: "Saved" })).toBeVisible();

    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Delete" }).first().click();
    await expect(page).toHaveURL(/\/admin\/galleries$/);
  });
});

test.describe("music", () => {
  test("player ids are validated per service, and a recording can be added", async ({ page }) => {
    await page.goto("/admin/music/new", { waitUntil: "networkidle" });
    await page.getByRole("textbox", { name: /^Title/ }).fill(`Recording ${uid}`);
    await page.getByLabel("Player").selectOption("youtube");
    await page.getByLabel("Link id").fill("<script>alert(1)</script>");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText(/A YouTube video id/)).toBeVisible();
    await page.getByLabel("Link id").fill("aqz-KE-bpKQ");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/music$/);
    await expect(page.getByRole("link", { name: `Recording ${uid}` })).toBeVisible();
  });
  test("a link id without choosing a service is refused", async ({ page }) => {
    await page.goto("/admin/music/new", { waitUntil: "networkidle" });
    await page.getByRole("textbox", { name: /^Title/ }).fill("No service");
    await page.getByLabel("Link id").fill("something");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText("Choose the service for this link")).toBeVisible();
  });
});

test.describe("flying", () => {
  test("an entry cannot go visible until the safety checklist is complete", async ({ page }) => {
    await page.goto("/admin/flying/new", { waitUntil: "networkidle" });
    await page.getByRole("textbox", { name: /^Title/ }).fill(`Flight ${uid}`);
    await page.getByLabel("Visible on the site").check();
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText(/Tick the safety checklist first/)).toBeVisible();
    // saving hidden is fine
    await page.getByLabel("Visible on the site").uncheck();
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/flying$/);
    await page.getByRole("link", { name: `Flight ${uid}` }).click();
    for (const l of [/does not reveal where I am/, /decided on purpose/, /Nobody identifiable/])
      await page.getByLabel(l).check();
    await page.getByLabel("Visible on the site").check();
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/flying$/);
    await expect(page.getByRole("row", { name: new RegExp(`Flight ${uid}`) })).toContainText("visible");
  });
  test("add an aircraft", async ({ page }) => {
    await page.goto("/admin/flying", { waitUntil: "networkidle" });
    const blank = page.locator(".adm-card").last();
    await blank.locator('input[name="name"]').fill(`Test aircraft ${uid}`);
    await blank.getByRole("button", { name: "Add aircraft" }).click();
    await expect(page.getByText("Added")).toBeVisible();
  });
});
