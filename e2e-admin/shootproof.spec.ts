import { expect, test } from "@playwright/test";

const MOCK = "http://localhost:3302";
const BARE = "http://localhost:3303";

test.describe("studio and the ShootProof bridge (sample mode)", () => {
  test("connect, list events, import for a day, view protected, remove, disconnect", async ({ page, request }) => {
    await page.goto(`${MOCK}/studio`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: /^Hello/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Coming in Phase 3" })).toBeVisible();
    await page.getByRole("link", { name: "Open ShootProof bridge" }).click();

    await expect(page.getByTestId("mock-banner")).toBeVisible();
    await expect(page.getByTestId("not-authorized")).toBeVisible();
    await page.getByRole("link", { name: "Connect ShootProof" }).click();
    await expect(page.getByText("Connected.")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Spring recital (sample)")).toBeVisible();

    await page.getByRole("button", { name: "Import Spring recital (sample)" }).click();
    await expect(page.getByText("Imported 3 photos.")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole("heading", { name: "Imported (3)" })).toBeVisible();
    const shown = page.locator("[data-testid='imported'] img[src^='blob:']");
    await expect(shown.first()).toBeVisible({ timeout: 20_000 });

    // protected: no file URL in the page source, and the file route needs a token
    const source = await page.content();
    expect(source).not.toMatch(/\/api\/ext\/[0-9a-f-]{36}\?/);
    const id = (await page.locator("[data-protected='strict'][data-pid]").first().getAttribute("data-pid")) as string;
    expect((await request.get(`${MOCK}/api/ext/${id}?w=960`)).status()).toBe(403);

    // each photo shows when it goes away, and can be removed early
    await expect(page.getByText(/expires \d{4}-\d{2}-\d{2}/).first()).toBeVisible();
    await page.getByRole("button", { name: "Remove Sample 1" }).click();
    await expect(page.getByRole("heading", { name: "Imported (2)" })).toBeVisible();

    await page.getByRole("button", { name: "Disconnect" }).click();
    await expect(page.getByTestId("not-authorized")).toBeVisible();
  });

  test("the OAuth return is refused without the matching state", async ({ page }) => {
    await page.goto(`${MOCK}/studio/shootproof/callback?code=mock-code&state=forged`);
    await expect(page.getByText("Sign-in link expired. Try Connect again.")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("not-authorized")).toBeVisible();
  });

  test("the cron purge route needs the secret", async ({ request }) => {
    expect((await request.get(`${MOCK}/api/cron/purge-external`)).status()).toBe(401);
    expect(
      (await request.get(`${MOCK}/api/cron/purge-external`, { headers: { Authorization: "Bearer wrong" } })).status(),
    ).toBe(401);
  });
});

test.describe("without ShootProof credentials", () => {
  test("shows a clear Not connected state with setup steps and no Connect button", async ({ page }) => {
    await page.goto(`${BARE}/studio/shootproof`, { waitUntil: "networkidle" });
    const box = page.getByTestId("not-connected");
    await expect(box).toBeVisible();
    await expect(box).toContainText("support@shootproof.com");
    await expect(box).toContainText("SHOOTPROOF_CLIENT_ID");
    await expect(box).toContainText("/studio/shootproof/callback");
    await expect(page.getByRole("link", { name: /Connect ShootProof/ })).toHaveCount(0);
    await page.goto(`${BARE}/studio`);
    await expect(page.getByText(/Not connected\. It needs an API client ID/)).toBeVisible();
  });
});
