import { expect, test } from "@playwright/test";

/**
 * Clickable local mocks (Phase 2.5): score store and flight map (the studio and client portal are real as of Phase 3: studio.spec.ts). Everything is labelled MOCK, runs
 * against the dev servers (mocks are off in production builds: see e2e/mocks-prod.spec.ts) and uses the Stripe test card.
 */
const MUSIC = "http://localhost:3304";
const FLYING = "http://localhost:3305";
const uid = Date.now().toString(36);

test.describe("score store mock", () => {
  test("browse, preview, buy with the test card, download the placeholder file; listen and score stay separate", async ({
    page,
  }) => {
    await page.goto(`${MUSIC}/compositions`, { waitUntil: "networkidle" });
    await expect(page.getByRole("note", { name: "Mock notice" })).toContainText("MOCK");
    await page.getByRole("link", { name: /Halation Study/ }).click();
    // a piece with a recording but no score: listen path only
    await expect(page.getByRole("heading", { name: "Listen" })).toBeVisible();
    await expect(page.getByText("This score is not for sale.")).toBeVisible();
    await page.goto(`${MUSIC}/compositions/sample-nocturne-for-brass`, { waitUntil: "networkidle" });
    // a piece with a score but no recording: score path only
    await expect(page.getByText("No performance recording exists yet.")).toBeVisible();

    await page.goto(`${MUSIC}/scores`, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: /Window Music/ }).click();
    await expect(page.getByRole("img", { name: /Preview page 1 of 14, watermarked/ })).toBeVisible();
    await page.getByRole("button", { name: "Add score to cart" }).click();
    await expect(page.getByRole("status")).toContainText("Added to your cart");
    await page.getByRole("link", { name: "View cart" }).click();
    await expect(page.getByText("$15.00").first()).toBeVisible();
    await page.getByRole("link", { name: "Checkout" }).click();

    await page.getByLabel("Email for the receipt").fill("buyer@example.test");
    await page.getByLabel("Card number").fill("4242");
    await page.getByRole("button", { name: /^Pay/ }).click();
    await expect(page.locator("p[role=alert]")).toContainText("full card number");
    await page.getByLabel("Card number").fill("4242 4242 4242 4242");
    await page.getByLabel(/Expiry/).fill("12 / 34");
    await page.getByLabel("Security code").fill("123");
    await page.getByRole("button", { name: /^Pay/ }).click();
    await expect(page).toHaveURL(/\/scores\/library$/);
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page
        .getByRole("button", { name: /Download/ })
        .first()
        .click(),
    ]);
    expect(download.suggestedFilename()).toBe("sample-window-music-MOCK.txt");
  });
});

test.describe("flight map mock", () => {
  test("shows sample flights as a map and a table, with no tail numbers and the latest landing held back", async ({
    page,
  }) => {
    await page.goto(`${FLYING}/map`, { waitUntil: "networkidle" });
    await expect(page.getByRole("note", { name: "Mock notice" })).toContainText("SAMPLE");
    await expect(page.getByRole("img", { name: /sample flight routes/ })).toBeVisible();
    const rows = page.locator("table.fm__table tbody tr");
    await expect(rows).toHaveCount(7); // 8 sample flights, the one that landed 3 days ago is held back
    await expect(page.locator("body")).not.toContainText(/N000|tail number/i);
    await expect(page.getByText("landed 3 days ago")).toHaveCount(0);
    // keyboard: the map region takes focus and zooms
    await page.getByRole("img", { name: /sample flight routes/ }).focus();
    await page.keyboard.press("+");
    await page.keyboard.press("ArrowRight");
  });
  test("the instruction slot is hidden by default", async ({ request }) => {
    expect((await request.get(`${FLYING}/instruction`)).status()).toBe(404);
  });
});
