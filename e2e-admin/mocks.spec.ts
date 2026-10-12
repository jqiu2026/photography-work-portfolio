import { expect, test } from "@playwright/test";

/**
 * Clickable local mocks (Phase 2.5): studio, client portal, score store, flight map. Everything is labelled MOCK, runs
 * against the dev servers (mocks are off in production builds: see e2e/mocks-prod.spec.ts) and uses the Stripe test card.
 */
const HUB = "http://localhost:3300";
const PHOTOS = "http://localhost:3302";
const uid = Date.now().toString(36);

test.describe("studio and client portal mock", () => {
  test("shoot to gallery to contract to invoice to paid, all labelled MOCK", async ({ page }) => {
    await page.goto(`${PHOTOS}/studio/shoots`, { waitUntil: "networkidle" });
    await expect(page.getByRole("note", { name: "Mock notice" })).toContainText("MOCK");
    // new shoot
    await page.getByLabel("Title").fill(`E2E shoot ${uid}`);
    await page.getByLabel("Date").fill("2026-12-01");
    await page.getByRole("button", { name: "Add shoot" }).click();
    const row = page.getByRole("listitem").filter({ hasText: `E2E shoot ${uid}` });
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: "Advance" }).click();
    await expect(row.getByRole("list", { name: "Progress: booked" })).toBeVisible();

    // gallery with a passcode
    await page.goto(`${PHOTOS}/studio/galleries`, { waitUntil: "networkidle" });
    await page.getByLabel("Shoot").selectOption({ label: `E2E shoot ${uid}` });
    await page.getByLabel(/Passcode/).fill("a");
    await page.getByRole("button", { name: "Create gallery" }).click();
    await expect(page.locator("p[role=alert]")).toContainText("at least 6 characters");
    await page.getByLabel(/Passcode/).fill(`pass-${uid}`);
    await page.getByRole("button", { name: "Create gallery" }).click();
    await expect(page.getByText(`pass-${uid}`)).toBeVisible();

    // contract: create, send, sign
    await page.goto(`${PHOTOS}/studio/shoots`, { waitUntil: "networkidle" });
    await page
      .getByRole("listitem")
      .filter({ hasText: `E2E shoot ${uid}` })
      .getByRole("button", { name: "New contract" })
      .click();
    await page
      .getByRole("listitem")
      .filter({ hasText: `E2E shoot ${uid}` })
      .getByRole("button", { name: "New invoice" })
      .click();
    await page.goto(`${PHOTOS}/studio/contracts`, { waitUntil: "networkidle" });
    const k = page.getByRole("listitem").filter({ hasText: `E2E shoot ${uid}` });
    await k.getByRole("button", { name: "Send for signature" }).click();
    await expect(k.getByText(/never emailed/)).toBeVisible();
    await k.getByRole("link", { name: "Open signing page" }).click();
    await expect(page.getByRole("note", { name: "Mock notice" })).toBeVisible();
    await page.getByRole("button", { name: "Sign contract" }).click();
    await expect(page.locator("p[role=alert]")).toContainText("full name");
    await page.getByLabel("Type your full name to sign").fill("Sample Client");
    await page.getByRole("button", { name: "Sign contract" }).click();
    await expect(page.locator("p[role=alert]")).toContainText("agree");
    await page.getByLabel(/I agree/).check();
    await page.getByRole("button", { name: "Sign contract" }).click();
    await expect(page.getByRole("status")).toContainText("Signed by Sample Client");

    // invoice: send, pay (declined first, then the success test card)
    await page.goto(`${PHOTOS}/studio/invoices`, { waitUntil: "networkidle" });
    const inv = page.getByRole("listitem").filter({ hasText: `E2E shoot ${uid}` });
    await inv.getByRole("button", { name: "Send" }).click();
    await inv.getByRole("link", { name: "Open payment page" }).click();
    await expect(page.getByRole("note", { name: "Mock notice" })).toContainText("no card is charged");
    await page.getByLabel("Card number").fill("4000 0000 0000 0002");
    await page.getByLabel(/Expiry/).fill("12 / 34");
    await page.getByLabel("Security code").fill("123");
    await page.getByRole("button", { name: /^Pay/ }).click();
    await expect(page.locator("p[role=alert]")).toContainText("declined");
    await page.getByLabel("Card number").fill("4242 4242 4242 4242");
    await page.getByRole("button", { name: /^Pay/ }).click();
    await expect(page.getByRole("status")).toContainText("Receipt rcpt_mock_");
  });

  test("client portal: wrong passcode is refused, the right one opens the gallery, favourites persist; magic link shows on screen", async ({
    page,
  }) => {
    await page.goto(`${PHOTOS}/client`, { waitUntil: "networkidle" });
    await page.getByLabel("Passcode", { exact: true }).fill("wrong-code");
    await page.getByRole("button", { name: "Open my gallery" }).click();
    await expect(page.locator("p[role=alert]")).toContainText("doesn't match");
    await page.getByLabel("Passcode", { exact: true }).fill("SAMPLE-1234");
    await page.getByRole("button", { name: "Open my gallery" }).click();
    await expect(page).toHaveURL(/\/client\/g\/g1$/);
    const heart = page.getByRole("button", { name: /Add Sample frame 3 to favourites/ });
    await heart.click();
    await expect(page.getByRole("button", { name: /Remove Sample frame 3 from favourites/ })).toBeVisible();
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: /Remove Sample frame 3 from favourites/ })).toBeVisible();
    await page.getByRole("button", { name: /Remove Sample frame 3 from favourites/ }).click();

    await page.goto(`${PHOTOS}/client`, { waitUntil: "networkidle" });
    await page.getByLabel("Email").fill("nobody@example.test");
    await page.getByRole("button", { name: "Send me a link" }).click();
    await expect(page.locator("p[role=alert]")).toContainText("No gallery");
    await page.getByLabel("Email").fill("client.a@example.test");
    await page.getByRole("button", { name: "Send me a link" }).click();
    await expect(page.getByRole("status")).toContainText("no email is sent");
    await page.getByRole("status").getByRole("link").click();
    await expect(page).toHaveURL(/\/client\/g\/g1\?ml=/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("SAMPLE");
  });

  test("a gallery cannot be opened without the passcode", async ({ page }) => {
    await page.goto(`${PHOTOS}/client/g/g1`, { waitUntil: "networkidle" });
    await expect(page.getByText(/Enter your passcode/)).toBeVisible();
  });
});

test.describe("score store mock", () => {
  test("browse, preview, buy with the test card, download the placeholder file; listen and score stay separate", async ({
    page,
  }) => {
    await page.goto(`${HUB}/music/compositions`, { waitUntil: "networkidle" });
    await expect(page.getByRole("note", { name: "Mock notice" })).toContainText("MOCK");
    await page.getByRole("link", { name: /Halation Study/ }).click();
    // a piece with a recording but no score: listen path only
    await expect(page.getByRole("heading", { name: "Listen" })).toBeVisible();
    await expect(page.getByText("This score is not for sale.")).toBeVisible();
    await page.goto(`${HUB}/music/compositions/sample-nocturne-for-brass`, { waitUntil: "networkidle" });
    // a piece with a score but no recording: score path only
    await expect(page.getByText("No performance recording exists yet.")).toBeVisible();

    await page.goto(`${HUB}/music/scores`, { waitUntil: "networkidle" });
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
    await expect(page).toHaveURL(/\/music\/scores\/library$/);
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
    await page.goto(`${HUB}/flying/map`, { waitUntil: "networkidle" });
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
    expect((await request.get(`${HUB}/flying/instruction`)).status()).toBe(404);
  });
});
