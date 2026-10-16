import { expect, test } from "@playwright/test";
import sharp from "sharp";

const uid = Date.now().toString(36);
const PHOTOS = "http://localhost:3302";
const photo = (color: string) =>
  sharp({ create: { width: 1600, height: 1000, channels: 3, background: color } })
    .jpeg()
    .toBuffer();

async function makeGallery(page: import("@playwright/test").Page, slug: string, protection: "light" | "strict") {
  await page.goto("/admin/galleries/new", { waitUntil: "networkidle" });
  await page.getByRole("textbox", { name: /^Title/ }).fill(`Prot ${slug}`);
  await page.getByLabel("URL").fill(slug);
  await page.getByLabel("Image protection").selectOption(protection);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL(/\/admin\/galleries\/[0-9a-f-]{36}$/);
  await page.getByLabel("Upload into this gallery").setInputFiles([
    { name: `${slug}-1.jpg`, mimeType: "image/jpeg", buffer: await photo("#aa3333") },
    { name: `${slug}-2.jpg`, mimeType: "image/jpeg", buffer: await photo("#3333aa") },
  ]);
  await expect(page.getByText("2 images added")).toBeVisible({ timeout: 40_000 });
  await expect(page.locator(".adm-gitems li")).toHaveCount(2, { timeout: 15_000 });
}

const COMBOS: [string, Record<string, unknown>][] = [
  ["PrintScreen", { key: "PrintScreen", code: "PrintScreen" }],
  ["Cmd+Shift+3", { key: "#", code: "Digit3", metaKey: true, shiftKey: true }],
  ["Cmd+Shift+4", { key: "$", code: "Digit4", metaKey: true, shiftKey: true }],
  ["Cmd+Shift+5", { key: "%", code: "Digit5", metaKey: true, shiftKey: true }],
  ["Win+Shift+S", { key: "S", code: "KeyS", metaKey: true, shiftKey: true }],
  ["Ctrl+S", { key: "s", code: "KeyS", ctrlKey: true }],
  ["Ctrl+P", { key: "p", code: "KeyP", ctrlKey: true }],
  ["Ctrl+U", { key: "u", code: "KeyU", ctrlKey: true }],
  ["Ctrl+Shift+I", { key: "I", code: "KeyI", ctrlKey: true, shiftKey: true }],
  ["F12", { key: "F12", code: "F12" }],
  ["Cmd+Opt+J", { key: "j", code: "KeyJ", metaKey: true, altKey: true }],
];

test.describe("a strict gallery on the photography site", () => {
  const slug = `strict-${uid}`;

  test("the page source has no image URL, the image still loads through a token, and the guard reacts to every shortcut", async ({
    page,
    request,
  }) => {
    await makeGallery(page, slug, "strict");
    // the hub pokes the photography site's cache after a change; the new gallery shows up within seconds
    await expect
      .poll(async () => (await request.get(`${PHOTOS}/portfolio/${slug}`)).status(), { timeout: 20_000 })
      .toBe(200);

    const html = await (await request.get(`${PHOTOS}/portfolio/${slug}`)).text();
    expect(html).toContain("data-pid");
    expect(html).not.toMatch(/\/api\/img\/[0-9a-f-]{36}\?/);
    expect(html).not.toMatch(/\.(webp|avif|jpe?g)\b/);
    expect(html).not.toMatch(/originals?[/\\]/);

    await page.goto(`${PHOTOS}/portfolio/${slug}`, { waitUntil: "networkidle" });
    const shown = page.locator("[data-protected='strict'] img[src^='blob:']");
    await expect(shown.first()).toBeVisible({ timeout: 20_000 });
    await expect(page.locator("img[src*='/api/img/']")).toHaveCount(0);
    await expect(shown.first()).toHaveAttribute("alt", /./);

    // the file URL cannot be fetched without a valid token
    const id = (await page.locator("[data-pid]").first().getAttribute("data-pid")) as string;
    expect((await request.get(`${PHOTOS}/api/img/${id}?w=960`)).status()).toBe(403);
    expect((await request.get(`${PHOTOS}/api/img/${id}?w=960&t=forged.token`)).status()).toBe(403);

    // right-click and drag are blocked over the picture
    const blocked = await page.evaluate(() => {
      const el = document.querySelector("[data-protected='strict']") as HTMLElement;
      const ev = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
      el.dispatchEvent(ev);
      const drag = new Event("dragstart", { bubbles: true, cancelable: true });
      el.dispatchEvent(drag);
      return [ev.defaultPrevented, drag.defaultPrevented];
    });
    expect(blocked).toEqual([true, true]);

    // every shortcut shows the dialog and hides the media; dismissing brings the media back
    for (const [name, init] of COMBOS) {
      await page.evaluate(
        (i) => window.dispatchEvent(new KeyboardEvent("keydown", { ...i, bubbles: true, cancelable: true })),
        init,
      );
      const dialog = page.getByRole("alertdialog");
      await expect(dialog, name).toBeVisible();
      await expect(dialog).toContainText("not a lock");
      await expect(page.locator("html")).toHaveClass(/hl-guard-hide/);
      await dialog.getByRole("button", { name: /understand/ }).click();
      await expect(dialog).toHaveCount(0);
      await expect(page.locator("html")).not.toHaveClass(/hl-guard-hide/);
    }
    // ordinary typing does nothing
    await page.keyboard.press("a");
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
  });

  test("an expired token is refreshed transparently", async ({ page }) => {
    let denied = 0;
    await page.route(/\/api\/img\/[0-9a-f-]{36}\?w=\d+&t=/, async (route) => {
      if (denied < 2) {
        denied++;
        return route.fulfill({ status: 403, body: "" });
      }
      return route.continue();
    });
    let refreshed = 0;
    page.on("request", (r) => r.url().endsWith("/api/img/token") && refreshed++);
    await page.goto(`${PHOTOS}/portfolio/${slug}`, { waitUntil: "networkidle" });
    await expect(page.locator("[data-protected='strict'] img[src^='blob:']").first()).toBeVisible({ timeout: 20_000 });
    expect(refreshed).toBeGreaterThan(0);
  });

  test("printing hides protected media", async ({ page }) => {
    await page.goto(`${PHOTOS}/portfolio/${slug}`, { waitUntil: "networkidle" });
    await expect(page.locator("[data-protected='strict'] img[src^='blob:']").first()).toBeVisible({ timeout: 20_000 });
    await page.emulateMedia({ media: "print" });
    await expect(page.locator("[data-protected='strict']").first()).toBeHidden();
  });
});

test.describe("a gallery the CMS marks as light is still protected on the photo site", () => {
  test("there is no plain image URL, and the file route refuses unsigned requests", async ({ page, request }) => {
    const slug = `light-${uid}`;
    await makeGallery(page, slug, "light");
    await page.waitForTimeout(1500);
    await page.goto(`${PHOTOS}/portfolio/${slug}`, { waitUntil: "networkidle" });
    await expect(page.locator("[data-protected='strict'] img[src^='blob:']").first()).toBeVisible({ timeout: 20_000 });
    await expect(page.locator("img[src*='/api/img/']")).toHaveCount(0);
    const id = (await page.locator("[data-pid]").first().getAttribute("data-pid")) as string;
    expect((await request.get(`${PHOTOS}/api/img/${id}?w=960&v=1`)).status()).toBe(403);
    // the guard is on whenever a photograph is on the page
    await page.evaluate(() =>
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "PrintScreen", bubbles: true })),
    );
    await expect(page.getByRole("alertdialog")).toBeVisible();
  });
});

test.describe("the watermark setting", () => {
  test("changes what the image route serves", async ({ page, request }) => {
    const slug = `wm-${uid}`;
    await makeGallery(page, slug, "light");
    await page.goto("/admin/media", { waitUntil: "networkidle" });
    await page.getByRole("link", { name: new RegExp(`${slug}-1`) }).click();
    await expect(page).toHaveURL(/\/admin\/media\/[0-9a-f-]{36}$/);
    const id = page.url().split("/").pop() as string;
    const fetchImage = async () => {
      const tk = await request.post(`${PHOTOS}/api/img/token`, {
        headers: { origin: PHOTOS, "sec-fetch-site": "same-origin" },
        data: { ids: [id] },
      });
      const t = ((await tk.json()) as { tokensById: Record<string, Record<string, string>> }).tokensById[id]["960"];
      const r = await request.get(`${PHOTOS}/api/img/${id}?w=960&t=${t}`, {
        headers: { accept: "image/webp", "sec-fetch-site": "same-origin", "sec-fetch-dest": "image" },
      });
      expect(r.status()).toBe(200);
      return Buffer.from(await r.body());
    };
    const plain = await fetchImage();

    await page.goto("/admin/settings", { waitUntil: "networkidle" });
    // settings are per site: switch to the photography site first
    await page.getByRole("group", { name: "Choose site" }).first().getByRole("button", { name: "Photography" }).click();
    await expect(page.getByText(/Settings for the Photography site/)).toBeVisible();
    const card = page.locator('section[aria-labelledby="g-protection"]');
    await card.getByLabel("Add a visible watermark to images").check();
    await card.getByLabel("Watermark text").fill("© E2E");
    await card.getByRole("button", { name: "Save" }).click();
    await expect(page.locator(".hl-toast", { hasText: "Saved" })).toBeVisible();

    const marked = await fetchImage();
    expect(marked.equals(plain)).toBe(false);
    expect(marked.length).toBeGreaterThan(0);

    // restore for later tests
    await card.getByLabel("Add a visible watermark to images").uncheck();
    await card.getByRole("button", { name: "Save" }).click();
    await expect(page.locator(".hl-toast", { hasText: "Saved" }).last()).toBeVisible();
    await page.getByRole("group", { name: "Choose site" }).first().getByRole("button", { name: "Hub" }).click();
  });
});
