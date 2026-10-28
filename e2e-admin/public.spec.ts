import { type Page, expect, test } from "@playwright/test";
import sharp from "sharp";

const uid = Date.now().toString(36);

// After an admin save the first request may still be served stale while Next regenerates the page in the background,
// so load the page until the expected text (or its absence) shows.
async function gotoUntil(page: Page, path: string, text: string, present = true) {
  await expect
    .poll(
      async () => {
        await page.goto(path);
        return (await page.getByText(text).count()) > 0;
      },
      { timeout: 30_000, intervals: [500, 1000, 2000] },
    )
    .toBe(present);
}

// The public sites read the CMS: what is published in the admin appears without a redeploy, and what is unpublished or
// trashed disappears. These run against the dev server and the throwaway database.

test.describe("the public site follows the CMS", () => {
  test("a post appears when published, shows the edited text, and disappears when trashed", async ({ page }) => {
    await page.goto("/admin/posts/new");
    await page.getByRole("textbox", { name: /^Title/ }).fill(`Public Post ${uid}`);
    await page.getByLabel("Body", { exact: true }).fill("Visible **to everyone** once published.");
    await page.getByLabel("Summary").fill("Summary for the public list.");
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page).toHaveURL(/\/admin\/posts\/[0-9a-f-]{36}$/);
    const slug = `public-post-${uid}`;

    // a draft is not public
    expect((await page.request.get(`/writing/${slug}`)).status()).toBe(404);

    await page.getByLabel("Status").selectOption("published");
    await page.getByRole("button", { name: "Publish" }).click();
    await expect(page.locator(".hm-toast", { hasText: "Published" })).toBeVisible();

    await page.goto(`/writing/${slug}`);
    await expect(page.getByRole("heading", { level: 1, name: `Public Post ${uid}` })).toBeVisible();
    await expect(page.locator("strong", { hasText: "to everyone" })).toBeVisible();
    await page.goto("/writing");
    await expect(page.getByRole("link", { name: new RegExp(`Public Post ${uid}`) })).toBeVisible();
    const rss = await page.request.get("/writing/rss.xml");
    expect(await rss.text()).toContain(`Public Post ${uid}`);

    // edit the title: the public page follows
    await page.goto("/admin/posts");
    await page.getByRole("link", { name: `Public Post ${uid}` }).click();
    await page.getByRole("textbox", { name: /^Title/ }).fill(`Public Post ${uid} edited`);
    await page
      .getByRole("button", { name: /Publish|Save/ })
      .first()
      .click();
    await expect(page.locator(".hm-toast").first()).toBeVisible();
    await page.goto(`/writing/${slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("edited");

    // trash it: gone from the site
    await page.goto("/admin/posts");
    await page.getByRole("link", { name: `Public Post ${uid} edited` }).click();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page).toHaveURL(/\/admin\/posts$/);
    expect((await page.request.get(`/writing/${slug}`)).status()).toBe(404);
  });

  test("a redirect rule is followed, and maintenance mode shows a notice but keeps the admin", async ({ page }) => {
    await page.goto("/admin/redirects", { waitUntil: "networkidle" });
    await page.getByLabel("From path").fill(`/gone-${uid}`);
    await page.getByLabel(/^To/).fill("/about");
    await page.getByRole("button", { name: "Add redirect" }).click();
    await expect(page.getByRole("cell", { name: `/gone-${uid}` })).toBeVisible();
    await page.goto(`/gone-${uid}`);
    await expect(page).toHaveURL(/\/about$/, { timeout: 30_000 });

    await page.goto("/admin/settings", { waitUntil: "networkidle" });
    const g = page.locator('section[aria-labelledby="g-general"]');
    await g.getByLabel("Maintenance mode").check();
    await g.getByLabel("Maintenance message").fill(`Updating ${uid}`);
    await g.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Saved").first()).toBeVisible();
    await gotoUntil(page, "/about", `Updating ${uid}`);
    await page.goto("/admin/settings", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Pages & settings" })).toBeVisible();
    // turn it off again so later tests see the site
    const g2 = page.locator('section[aria-labelledby="g-general"]');
    await g2.getByLabel("Maintenance mode").uncheck();
    await g2.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Saved").first()).toBeVisible();
    await gotoUntil(page, "/about", `Updating ${uid}`, false);
  });

  test("the profile headline edited in the admin shows on the About page", async ({ page }) => {
    await page.goto("/admin/profile", { waitUntil: "networkidle" });
    await page.getByLabel("Headline").fill(`Headline ${uid}`);
    await page.getByRole("button", { name: "Save" }).first().click();
    await expect(page.getByText("Saved").first()).toBeVisible();
    await gotoUntil(page, "/about", `Headline ${uid}`);
  });

  test("images are served by the image route: derivatives only, cacheable, no original path", async ({ page }) => {
    await page.goto("/admin/media", { waitUntil: "networkidle" });
    // its own colour: the same bytes as the media spec's upload would be recognised as a duplicate and not stored again
    const buffer = await sharp({ create: { width: 1800, height: 1200, channels: 3, background: "#4a7e95" } })
      .jpeg()
      .toBuffer();
    await page.getByLabel("Upload images").setInputFiles({ name: `pub-${uid}.jpg`, mimeType: "image/jpeg", buffer });
    await expect(page.getByText(/Done/)).toBeVisible({ timeout: 30_000 });
    await page.getByRole("link", { name: new RegExp(`pub-${uid}`) }).click();
    await expect(page).toHaveURL(/\/admin\/media\/[0-9a-f-]{36}$/);
    const id = page.url().split("/").pop() as string;
    const res = await page.request.get(`/api/img/${id}?w=960&v=1`, { headers: { accept: "image/webp" } });
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toMatch(/image\/(webp|avif)/);
    expect(res.headers()["cache-control"]).toContain("public");
    expect(res.headers()["x-content-type-options"]).toBe("nosniff");
    // blocked crawlers and bad input
    expect((await page.request.get(`/api/img/${id}?w=960`, { headers: { "user-agent": "GPTBot/1.0" } })).status()).toBe(
      403,
    );
    expect((await page.request.get(`/api/img/${id}?w=999999`)).status()).toBe(400);
    expect((await page.request.get("/api/img/not-an-id?w=960")).status()).toBe(404);
  });
});
