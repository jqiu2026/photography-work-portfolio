import { expect, test } from "@playwright/test";
import { photos } from "./routes";

/**
 * Every photograph on the photo site goes through the protected pipeline (docs/project/01-photo-site-spec.md section 4).
 * Production build, no database: this exercises the bundled photographs.
 */
const PAGES = [
  "/",
  "/portfolio",
  "/portfolio/theater",
  "/portfolio/aviation",
  "/work",
  "/work/stuy-sing-26",
  "/work/stuypa-cny-dinner-26",
];
const FILE_URL = /(\/opt\/|\/images\/|\.(webp|avif|jpe?g|png|gif)(\?|"|'|\s|\)|,|$)|\/api\/img\/[0-9a-f-]{36}\?)/i;

test.describe("no direct file URL in the server HTML", () => {
  for (const path of PAGES)
    test(path, async ({ request }) => {
      const res = await request.get(`${photos}${path}`);
      expect(res.status()).toBe(200);
      const html = (await res.text()).replace(/data:image\/[a-z+]+;base64,[A-Za-z0-9+/=]+/g, "data:image");
      const hit = html.match(FILE_URL);
      expect(hit?.[0] ?? null, `${path} exposes ${hit?.[0]}`).toBeNull();
      expect(html).toContain("data-pid");
    });
});

test.describe("every photograph element is a protected image", () => {
  for (const path of PAGES)
    test(path, async ({ page }) => {
      await page.goto(`${photos}${path}`, { waitUntil: "networkidle" });
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 600) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 80));
        }
      });
      await page.waitForTimeout(1500);
      const report = await page.evaluate(() => {
        const imgs = [...document.querySelectorAll("img")];
        const bad = imgs.filter((i) => !i.src.startsWith("blob:") && !i.closest("[data-protected]")).map((i) => i.src);
        const css = [...document.querySelectorAll<HTMLElement>("*")]
          .map((e) => getComputedStyle(e).backgroundImage)
          .filter((b) => b !== "none" && /url\((?!"?data:)/.test(b) && !/gradient/.test(b));
        return { n: imgs.length, blobs: imgs.filter((i) => i.src.startsWith("blob:")).length, bad, css };
      });
      expect(report.blobs, "photographs actually rendered").toBeGreaterThan(0);
      expect(report.bad).toEqual([]);
      expect(report.css).toEqual([]);
    });
});

test("the image route refuses unsigned, forged and cross-site requests; files are not addressable", async ({
  page,
  request,
}) => {
  await page.goto(`${photos}/portfolio/theater`, { waitUntil: "networkidle" });
  const id = (await page.locator("[data-pid]").first().getAttribute("data-pid")) as string;
  expect(id).toMatch(/^[0-9a-f-]{36}$/);
  expect((await request.get(`${photos}/api/img/${id}?w=960`)).status()).toBe(403);
  expect((await request.get(`${photos}/api/img/${id}?w=960&t=forged.token`)).status()).toBe(403);
  for (const f of ["/opt/gallery/jry0473-480.webp", "/opt/gallery/manifest.json", "/images/gallery/_JRY0011.jpg"])
    expect((await request.get(`${photos}${f}`)).status(), f).toBe(404);
  // tokens are only minted for same-origin browser calls
  const cross = await request.post(`${photos}/api/img/token`, {
    headers: { origin: "https://evil.example" },
    data: { ids: [id] },
  });
  expect(cross.status()).toBe(403);
  const ok = await request.post(`${photos}/api/img/token`, {
    headers: { origin: photos, "sec-fetch-site": "same-origin" },
    data: { ids: [id] },
  });
  expect(ok.status()).toBe(200);
  const t = ((await ok.json()) as { tokensById: Record<string, Record<string, string>> }).tokensById[id]["480"];
  // a token for one width does not work for another
  const wrong = await request.get(`${photos}/api/img/${id}?w=960&t=${t}`, {
    headers: { "sec-fetch-site": "same-origin", "sec-fetch-dest": "image" },
  });
  expect(wrong.status()).toBe(403);
  const right = await request.get(`${photos}/api/img/${id}?w=480&t=${t}`, {
    headers: { "sec-fetch-site": "same-origin", "sec-fetch-dest": "image", accept: "image/webp" },
  });
  expect(right.status()).toBe(200);
  expect(right.headers()["content-type"]).toContain("image/");
  expect(right.headers()["x-robots-tag"]).toContain("noai");
});

test("the screenshot guard is on whenever a photograph is on the page, and off on text pages", async ({ page }) => {
  await page.goto(`${photos}/portfolio/theater`, { waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("data-guard", "strict");
  await page.goto(`${photos}/privacy`, { waitUntil: "networkidle" });
  await expect(page.locator("html")).not.toHaveAttribute("data-guard", /./);
});

test("the lightbox opens a protected copy", async ({ page }) => {
  await page.goto(`${photos}/portfolio/theater`, { waitUntil: "networkidle" });
  await page
    .getByRole("button", { name: /^Open / })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator("img[src^='blob:']")).toBeVisible({ timeout: 15_000 });
  await expect(dialog.locator("img:not([src^='blob:'])")).toHaveCount(0);
});

const MARKETING = [
  "/features",
  "/how-it-works",
  "/client-portal",
  "/galleries",
  "/prints",
  "/shop",
  "/faq",
  "/contact",
  "/terms",
  "/accessibility",
  "/licensing",
  "/packages",
];
test.describe("marketing pages", () => {
  for (const path of MARKETING)
    test(`${path} has no photograph file or image URL`, async ({ request }) => {
      const res = await request.get(`${photos}${path}`);
      expect(res.status()).toBe(200);
      const html = (await res.text()).replace(/data:image\/[a-z+]+;base64,[A-Za-z0-9+/=]+/g, "data:image");
      expect(html.match(FILE_URL)?.[0] ?? null).toBeNull();
    });
  test("/features never claims more than the spec: every row has a badge and the counts are shown", async ({
    page,
  }) => {
    await page.goto(`${photos}/features`, { waitUntil: "networkidle" });
    const rows = await page.locator("[data-feature]").count();
    expect(rows).toBeGreaterThan(80);
    expect(await page.locator("[data-feature] .mk-badge").count()).toBe(rows);
  });
  test("the open graph image is a text card (PNG), not a photograph", async ({ request }) => {
    const res = await request.get(`${photos}/opengraph-image`);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");
  });
  test("/api/health is public and reveals no configuration", async ({ request }) => {
    const res = await request.get(`${photos}/api/health`);
    expect(res.status()).toBe(200);
    expect(Object.keys(await res.json()).sort()).toEqual(["database", "ok"]);
  });
});
