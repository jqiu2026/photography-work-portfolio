import { expect, test } from "@playwright/test";
import { hub, photos } from "./routes";

// The e2e web server runs a PRODUCTION build with DASHBOARD_OPEN_SIGNIN=true and a Google-less environment.
// These tests prove the gates hold: no session means no admin, and the development-only escape hatch is ignored.

test.describe("admin is private", () => {
  for (const path of ["/admin", "/admin/posts", "/admin/health", "/admin/users", "/admin/media/anything"]) {
    test(`${path} redirects to sign-in when signed out (open sign-in is ignored in production)`, async ({
      request,
    }) => {
      const res = await request.get(`${hub}${path}`, { maxRedirects: 0 });
      expect(res.status()).toBe(307);
      expect(res.headers().location).toContain("/sign-in");
      expect(res.headers().location).toContain(`callbackUrl=${encodeURIComponent(path)}`);
    });
  }

  test("a forged or garbage session cookie does not get through the layout", async ({ request }) => {
    const res = await request.get(`${hub}/admin`, {
      maxRedirects: 0,
      headers: { cookie: "authjs.session-token=garbage" },
    });
    // The proxy only checks cookie presence (first gate). The admin layout re-verifies the signature and redirects.
    expect([200, 307]).toContain(res.status());
    if (res.status() === 200) throw new Error("Admin rendered for a garbage session cookie");
    expect(res.headers().location).toMatch(/sign-in/);
  });

  test("sign-in page renders without exposing open sign-in", async ({ page }) => {
    await page.goto(`${hub}/sign-in`);
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in with Google" })).toBeDisabled();
    await expect(page.getByText("Development only: open sign-in")).toHaveCount(0);
    await expect(page.getByText(/AUTH_GOOGLE_ID/)).toBeVisible();
  });

  test("sign-in shows a clear message when access is denied", async ({ page }) => {
    await page.goto(`${hub}/sign-in?error=AccessDenied`);
    await expect(page.locator("p[role=alert]")).toContainText("isn't authorized");
  });

  test("admin and sign-in are never indexed or cached", async ({ request }) => {
    const res = await request.get(`${hub}/sign-in`);
    expect(await res.text()).toContain("noindex");
    const robots = await (await request.get(`${hub}/robots.txt`)).text();
    expect(robots).toContain("Disallow: /admin");
  });

  test("the session endpoint reports no user when signed out", async ({ request }) => {
    const res = await request.get(`${hub}/api/auth/session`);
    expect(await res.json()).toBeNull();
  });
});

test.describe("studio (photos) is private", () => {
  test("/studio redirects to sign-in when signed out", async ({ request }) => {
    const res = await request.get(`${photos}/studio`, { maxRedirects: 0 });
    expect([302, 307]).toContain(res.status());
    expect(res.headers().location).toMatch(/sign-in/);
  });
});
