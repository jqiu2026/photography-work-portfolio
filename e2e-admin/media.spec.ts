import { expect, test } from "@playwright/test";
import sharp from "sharp";

const uid = Date.now().toString(36);
const photo = (w: number, h: number, color: string) =>
  sharp({ create: { width: w, height: h, channels: 3, background: color } })
    .jpeg()
    .toBuffer();

test.describe("media library", () => {
  test("upload a photo, see it processed, edit details, and mark minors for review", async ({ page }) => {
    await page.goto("/admin/media", { waitUntil: "networkidle" });
    const file = { name: `e2e-${uid}.jpg`, mimeType: "image/jpeg", buffer: await photo(1800, 1200, "#3a6ea5") };
    await page.getByLabel("Upload images").setInputFiles(file);
    await expect(page.getByText(/Done/)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("1 image added")).toBeVisible();
    await page.getByRole("link", { name: new RegExp(`e2e-${uid}`) }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(`e2e-${uid}.jpg`);
    await expect(page.getByText(/1800 × 1200 px/)).toBeVisible();
    await page.getByLabel("Alt text").fill("A blue test picture");
    await page.getByLabel("Includes minors").check();
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText(/marked “needs review”/)).toBeVisible();
    await page.reload();
    await expect(page.getByLabel("Alt text")).toHaveValue("A blue test picture");
    await expect(page.getByLabel("Review status")).toHaveValue("needs_review");
    // the derivative preview is served to the signed-in admin
    const img = page.locator("img").first();
    await expect(img).toHaveJSProperty("complete", true);
  });

  test("the browser never gets the private original through the admin file route", async ({ page, request }) => {
    await page.goto("/admin/media");
    const href = await page.locator(".adm-media a").first().getAttribute("href");
    const id = href?.split("/").pop();
    const res = await request.get(`/api/admin/media/${id}/file?w=480`);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("image/webp");
    expect(res.headers()["cache-control"]).toContain("private");
    // intentionally mangled id and path traversal attempts are refused
    expect((await request.get("/api/admin/media/not-a-uuid/file")).status()).toBe(404);
    expect(
      (await request.get("/api/storage/originals/../../etc/passwd?exp=1&m=GET&sig=x")).status(),
    ).toBeGreaterThanOrEqual(403);
  });

  test("an HTML file renamed .jpg is refused when processed, and nothing is added", async ({ page }) => {
    await page.goto("/admin/media", { waitUntil: "networkidle" });
    const before = await page.locator(".adm-media li").count();
    await page.getByLabel("Upload images").setInputFiles({
      name: `evil-${uid}.jpg`,
      mimeType: "image/jpeg",
      buffer: Buffer.from("<html><script>alert(1)</script></html>"),
    });
    await expect(page.getByText(/isn't a readable image|Only JPEG/)).toBeVisible({ timeout: 30_000 });
    await page.reload();
    expect(await page.locator(".adm-media li").count()).toBe(before);
  });

  test("an SVG is refused before it is even uploaded", async ({ page }) => {
    await page.goto("/admin/media", { waitUntil: "networkidle" });
    await page.getByLabel("Upload images").setInputFiles({
      name: "x.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>'),
    });
    await expect(page.getByText(/Unsupported file/)).toBeVisible({ timeout: 15_000 });
  });

  test("replace-in-place keeps the id and updates dimensions", async ({ page }) => {
    await page.goto("/admin/media", { waitUntil: "networkidle" });
    await page
      .getByLabel("Upload images")
      .setInputFiles({ name: `replace-${uid}.jpg`, mimeType: "image/jpeg", buffer: await photo(1000, 700, "#aa5533") });
    await expect(page.getByText(/Done/)).toBeVisible({ timeout: 30_000 });
    await page.getByRole("link", { name: new RegExp(`replace-${uid}`) }).click();
    await expect(page).toHaveURL(/\/admin\/media\/[0-9a-f-]{36}$/);
    const url = page.url();
    await expect(page.getByText(/1000 × 700 px/)).toBeVisible();
    await page
      .getByLabel("Choose replacement")
      .setInputFiles({ name: "new.jpg", mimeType: "image/jpeg", buffer: await photo(640, 480, "#33aa55") });
    await expect(page.getByText(/Done/)).toBeVisible({ timeout: 30_000 });
    await page.waitForLoadState("networkidle");
    expect(page.url()).toBe(url);
    await expect(page.getByText(/640 × 480 px/)).toBeVisible();
  });

  test("an image used by a post cover cannot be deleted until it is removed", async ({ page }) => {
    await page.goto("/admin/media", { waitUntil: "networkidle" });
    await page
      .getByLabel("Upload images")
      .setInputFiles({ name: `used-${uid}.jpg`, mimeType: "image/jpeg", buffer: await photo(900, 600, "#556677") });
    await expect(page.getByText(/Done/)).toBeVisible({ timeout: 30_000 });
    // use it as a post cover via the picker
    await page.goto("/admin/posts/new", { waitUntil: "networkidle" });
    await page.getByRole("textbox", { name: /^Title/ }).fill(`Cover test ${uid}`);
    await page.getByRole("button", { name: "Choose" }).click();
    await page.getByRole("button", { name: new RegExp(`Use used-${uid}`) }).click();
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page).toHaveURL(/\/admin\/posts\/[0-9a-f-]{36}$/);
    await page.goto("/admin/media");
    await page.getByRole("link", { name: new RegExp(`used-${uid}`) }).click();
    await expect(page.getByRole("link", { name: `Cover test ${uid}` })).toBeVisible();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText(/is used in 1 place/)).toBeVisible();
  });
});
