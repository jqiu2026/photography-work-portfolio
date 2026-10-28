import { expect, test } from "@playwright/test";

const uid = Date.now().toString(36);
const card = (page: import("@playwright/test").Page, k: string) => page.locator(`section[aria-labelledby="g-${k}"]`);

test.describe("inbox", () => {
  test("a visitor message is stored, shown in the inbox, triaged, and erased on request", async ({ page, request }) => {
    await page.goto("/connect", { waitUntil: "networkidle" });
    await page.getByLabel(/Your name/).fill(`Visitor ${uid}`);
    await page.getByRole("textbox", { name: /^Email/ }).fill(`visitor-${uid}@example.com`);
    await page.getByLabel(/^Message/).fill("Hello, I would like to ask about prints.");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText("Thanks, your message is on its way.")).toBeVisible();

    await page.goto("/admin/inbox", { waitUntil: "networkidle" });
    await page.getByRole("link", { name: `Visitor ${uid}` }).click();
    await expect(page.getByText("about prints")).toBeVisible();
    await expect(page.getByRole("link", { name: "Reply by email" })).toHaveAttribute("href", /^mailto:visitor-/);
    await page.getByLabel("Status").selectOption("replied");
    await page.getByLabel("Private notes").fill("Sent the price list");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText("Saved").first()).toBeVisible();

    await page.goto("/admin/inbox?status=replied", { waitUntil: "networkidle" });
    await expect(page.getByRole("link", { name: `Visitor ${uid}` })).toBeVisible();

    // privacy tool removes it for good
    await page.getByLabel("Email address").fill(`visitor-${uid}@example.com`);
    await page.getByRole("button", { name: "Delete permanently" }).click();
    await expect(page.getByText(/Deleted 1 message/)).toBeVisible();
    await page.goto("/admin/inbox", { waitUntil: "networkidle" });
    await expect(page.getByRole("link", { name: `Visitor ${uid}` })).toHaveCount(0);
    void request;
  });
  test("a honeypot submission is accepted but never stored, and bad input is refused", async ({ page, request }) => {
    const bot = await request.post("/api/contact", {
      data: { name: `Bot ${uid}`, email: "bot@example.com", message: "buy now please", website: "http://spam.example" },
    });
    expect(bot.ok()).toBe(true);
    const bad = await request.post("/api/contact", { data: { name: "", email: "nope", message: "x" } });
    expect(bad.status()).toBe(400);
    const wrongType = await request.post("/api/contact", { data: "plain", headers: { "Content-Type": "text/plain" } });
    expect(wrongType.status()).toBe(415);
    const crossSite = await request.post("/api/contact", {
      data: { name: "x", email: "x@example.com", message: "hello world" },
      headers: { Origin: "https://evil.example" },
    });
    expect(crossSite.status()).toBe(403);
    await page.goto("/admin/inbox", { waitUntil: "networkidle" });
    await expect(page.getByText(`Bot ${uid}`)).toHaveCount(0);
  });
});

test.describe("settings and legal pages", () => {
  test("settings save, show server errors, and persist", async ({ page }) => {
    await page.goto("/admin/settings", { waitUntil: "networkidle" });
    const g = card(page, "general");
    await g.getByLabel("Contact email shown on the site").fill("not-an-email");
    await g.getByRole("button", { name: "Save", exact: true }).click();
    await expect(g.getByText("Not an email address")).toBeVisible();
    await g.getByLabel("Site name").fill(`Hub ${uid}`);
    await g.getByLabel("Contact email shown on the site").fill("hello@jerryqiu.com");
    await g.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText("Saved").first()).toBeVisible();
    await page.reload({ waitUntil: "networkidle" });
    await expect(card(page, "general").getByLabel("Site name")).toHaveValue(`Hub ${uid}`);

    const nav = card(page, "nav");
    await nav.getByLabel("Links").fill("About | javascript:alert(1)");
    await nav.getByRole("button", { name: "Save", exact: true }).click();
    await expect(nav.getByText(/Label \| \/path/)).toBeVisible();
  });
  test("a legal page can be saved as a draft and then published", async ({ page }) => {
    await page.goto("/admin/settings/legal/terms", { waitUntil: "networkidle" });
    await page.getByLabel(/Page text/).fill(`## Terms ${uid}\n\nBe kind.`);
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText("Saved as draft")).toBeVisible();
    await page.getByLabel("Status").selectOption("published");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText("Saved and published")).toBeVisible();
    await page.goto("/admin/settings", { waitUntil: "networkidle" });
    await expect(page.getByRole("row", { name: /Terms of use/ })).toContainText("published");
  });
});

test.describe("redirects", () => {
  test("rules are validated, de-duplicated and removable", async ({ page }) => {
    await page.goto("/admin/redirects", { waitUntil: "networkidle" });
    const add = async (from: string, to: string) => {
      await page.getByLabel("From path").fill(from);
      await page.getByLabel(/^To/).fill(to);
      await page.getByRole("button", { name: "Add redirect" }).click();
    };
    await add("/old-wrong", "//evil.example");
    await expect(page.getByText(/Use a path like/)).toBeVisible();
    await add(`/old-${uid}`, "/about");
    await expect(page.getByRole("cell", { name: `/old-${uid}` })).toBeVisible();
    await add(`/old-${uid}`, "/work");
    await expect(page.getByText("A redirect from that path already exists.")).toBeVisible();
    page.once("dialog", (d) => d.accept());
    await page
      .getByRole("row", { name: new RegExp(`/old-${uid}`) })
      .getByRole("button", { name: "Remove" })
      .click();
    await expect(page.getByRole("cell", { name: `/old-${uid}` })).toHaveCount(0);
  });
});

test.describe("users", () => {
  test("only the company domain can be invited; roles and access can change", async ({ page }) => {
    await page.goto("/admin/users", { waitUntil: "networkidle" });
    await page.getByLabel("Email").fill(`friend-${uid}@gmail.com`);
    await page.getByRole("button", { name: "Allow sign-in" }).click();
    await expect(page.getByText(/Only @jerryqiu.com addresses/)).toBeVisible();

    const email = `ed-${uid}@jerryqiu.com`;
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Allow sign-in" }).click();
    await expect(page.getByRole("row", { name: new RegExp(email) })).toContainText("editor");

    // roles can be changed, and access can be removed and restored
    const row = page.getByRole("row", { name: new RegExp(email) });
    await row.getByLabel("Role").selectOption("owner");
    await expect(page.getByText(/Role changed/)).toBeVisible();
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByRole("row", { name: new RegExp(email) })).toContainText("owner");
    page.once("dialog", (d) => d.accept());
    await page
      .getByRole("row", { name: new RegExp(email) })
      .getByRole("button", { name: "Remove access" })
      .click();
    await expect(
      page.getByRole("row", { name: new RegExp(email) }).getByRole("button", { name: "Restore access" }),
    ).toBeVisible();
  });
});

test.describe("trash, audit and export", () => {
  test("a deleted item can be restored from the trash, and the audit log records it", async ({ page }) => {
    await page.goto("/admin/flying", { waitUntil: "networkidle" });
    const blank = page.locator(".adm-card").last();
    await blank.locator('input[name="name"]').fill(`Trash plane ${uid}`);
    await blank.getByRole("button", { name: "Add aircraft" }).click();
    await expect(page.getByText("Added")).toBeVisible();
    await page.reload({ waitUntil: "networkidle" });
    const mine = page.locator(".adm-card", { has: page.locator(`input[value="Trash plane ${uid}"]`) });
    page.once("dialog", (d) => d.accept());
    await mine.getByRole("button", { name: "Delete" }).click();
    await expect(page.locator(`input[value="Trash plane ${uid}"]`)).toHaveCount(0);

    await page.goto("/admin/trash", { waitUntil: "networkidle" });
    const trashed = page.getByRole("row", { name: new RegExp(`Trash plane ${uid}`) });
    await expect(trashed).toContainText("Aircraft");
    page.once("dialog", (d) => d.accept());
    await trashed.getByRole("button", { name: "Restore" }).click();
    await expect(page.getByRole("row", { name: new RegExp(`Trash plane ${uid}`) })).toHaveCount(0);

    await page.goto("/admin/audit", { waitUntil: "networkidle" });
    await expect(page.getByRole("cell", { name: "trash.restore" }).first()).toBeVisible();
  });
  test("the export is a zip and never needs a signed-out visitor to be allowed", async ({ page, request }) => {
    const res = await request.get("/api/admin/export");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("application/zip");
    const body = await res.body();
    expect(body.subarray(0, 2).toString()).toBe("PK");
    await page.goto("/admin/settings", { waitUntil: "networkidle" });
    await expect(page.getByRole("link", { name: "Download a full export" })).toBeVisible();
  });
});
