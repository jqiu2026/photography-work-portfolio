import { expect, test } from "@playwright/test";
import { flying, music, photos } from "./routes";

/**
 * Mocks are disabled in production builds: the score store and the flight map are 404 and nothing in the navigation points
 * at them. The studio and client pages are real (database-backed): without a database or a session they redirect or 404.
 */
const mockRoutes = [
  `${music}/compositions`,
  `${music}/compositions/sample-window-music`,
  `${music}/scores`,
  `${music}/scores/cart`,
  `${music}/scores/checkout`,
  `${music}/scores/library`,
  `${music}/scores/sample-window-music`,
  `${flying}/map`,
  `${photos}/studio/overview`,
  `${photos}/studio/shoots`,
  `${photos}/client/gallery`,
  `${photos}/client/sign/not-a-real-token`,
  `${photos}/client/pay/not-a-real-token`,
];

for (const url of mockRoutes) {
  test(`mock route is absent in a production build: ${url.replace(/^https?:\/\/[^/]+/, "")}`, async ({ request }) => {
    const res = await request.get(url, { maxRedirects: 0 });
    // the studio routes may redirect an anonymous visitor to sign-in first; none may render the mock
    expect([302, 303, 307, 308, 404]).toContain(res.status());
    if (res.status() === 404) expect(await res.text()).not.toContain("MOCK");
  });
}

test("the client portal entry shows no passcode form without a database", async ({ page }) => {
  await page.goto(`${photos}/client`, { waitUntil: "networkidle" });
  await expect(page.getByRole("note", { name: "Mock notice" })).toHaveCount(0);
  await expect(page.getByLabel("Passcode", { exact: true })).toHaveCount(0);
});

test("music and flying homes link to no mock routes in production", async ({ page }) => {
  for (const url of [`${music}`, `${flying}`]) {
    await page.goto(url, { waitUntil: "networkidle" });
    const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => (a as HTMLAnchorElement).pathname));
    expect(hrefs.filter((h) => /\/(compositions|scores|map)(\/|$)/.test(h))).toEqual([]);
  }
});
