import { expect, test } from "@playwright/test";

/**
 * Clickable local mocks (Phase 2.5): flight map (the studio and client portal are real as of Phase 3: studio.spec.ts). Everything is labelled MOCK, runs
 * against the dev servers (mocks are off in production builds: see e2e/mocks-prod.spec.ts) and uses the Stripe test card.
 */
const FLYING = "http://localhost:3305";

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
