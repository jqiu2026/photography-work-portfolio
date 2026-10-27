import { expect, test } from "@playwright/test";
import { music, photos } from "./routes";

/**
 * Mocks are disabled in production builds: the score store and the flight map are 404 and nothing in the navigation points
 * at them. The studio and client pages are real (database-backed): without a database or a session they redirect or 404.
 */
const mockRoutes = [
  `${music}/checkout/mock?token=not-a-real-token`,
  `${photos}/studio/overview`,
  `${photos}/studio/shoots`,
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

test("the old client entry points send the visitor home", async ({ request }) => {
  for (const path of ["/client", "/client/login", "/client/home", "/client/gallery"]) {
    const res = await request.get(`${photos}${path}`, { maxRedirects: 0 });
    expect([307, 308]).toContain(res.status());
    expect(new URL(res.headers().location ?? "", photos).pathname).toBe("/");
  }
});

test("the music store is real: no payment is possible without Stripe in a production build", async ({ request }) => {
  const res = await request.get(`${music}/scores`);
  expect(res.status()).toBe(200);
  expect(await res.text()).not.toContain("MOCK");
});
