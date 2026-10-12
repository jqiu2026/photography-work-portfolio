import { expect, test } from "@playwright/test";
import { hub, photos } from "./routes";

/** Mocks are disabled in production builds: every mock route is a 404 and nothing in the navigation points at them. */
const mockRoutes = [
  `${hub}/music/compositions`,
  `${hub}/music/compositions/sample-window-music`,
  `${hub}/music/scores`,
  `${hub}/music/scores/cart`,
  `${hub}/music/scores/checkout`,
  `${hub}/music/scores/library`,
  `${hub}/music/scores/sample-window-music`,
  `${hub}/flying/map`,
  `${photos}/studio/overview`,
  `${photos}/studio/shoots`,
  `${photos}/client/g/g1`,
  `${photos}/client/sign/env_mock_seed`,
  `${photos}/client/pay/i1`,
];

for (const url of mockRoutes) {
  test(`mock route is absent in a production build: ${url.replace(/^https?:\/\/[^/]+/, "")}`, async ({ request }) => {
    const res = await request.get(url, { maxRedirects: 0 });
    // the studio routes may redirect an anonymous visitor to sign-in first; none may render the mock
    expect([302, 303, 307, 308, 404]).toContain(res.status());
    if (res.status() === 404) expect(await res.text()).not.toContain("MOCK");
  });
}

test("the client portal entry shows no mock forms in production", async ({ page }) => {
  await page.goto(`${photos}/client`, { waitUntil: "networkidle" });
  await expect(page.getByRole("note", { name: "Mock notice" })).toHaveCount(0);
  await expect(page.getByLabel("Passcode", { exact: true })).toHaveCount(0);
});

test("music and flying homes link to no mock routes in production", async ({ page }) => {
  for (const url of [`${hub}/music`, `${hub}/flying`]) {
    await page.goto(url, { waitUntil: "networkidle" });
    const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => (a as HTMLAnchorElement).pathname));
    expect(hrefs.filter((h) => /\/(compositions|scores|map)(\/|$)/.test(h))).toEqual([]);
  }
});
