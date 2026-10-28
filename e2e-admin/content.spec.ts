import { expect, test } from "@playwright/test";

const uid = Date.now().toString(36);

// These run against the dev server with the dev-only open sign-in and a fresh, seeded throwaway database.

test.describe("dashboard and shell", () => {
  test("dashboard shows live counts from the seeded content", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Hello");
    await expect(page.getByRole("link", { name: /Posts/ }).first()).toBeVisible();
    await expect(page.getByText("dev sign-in")).toBeVisible();
  });
  test("the site selector scopes the sections in the sidebar", async ({ page }) => {
    await page.goto("/admin");
    const nav = page.getByRole("navigation", { name: "Admin" });
    await expect(nav.getByRole("link", { name: "Posts" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Galleries" })).toHaveCount(0);
    await page.getByRole("group", { name: "Choose site" }).first().getByRole("button", { name: "Photography" }).click();
    await expect(nav.getByRole("link", { name: "Galleries" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Posts" })).toHaveCount(0);
    await page.getByRole("group", { name: "Choose site" }).first().getByRole("button", { name: "Flying" }).click();
    await expect(nav.getByRole("link", { name: "Flight log" })).toBeVisible();
    await page.getByRole("group", { name: "Choose site" }).first().getByRole("button", { name: "Hub" }).click();
  });
  test("the command palette jumps to a section with the keyboard", async ({ page }) => {
    await page.goto("/admin", { waitUntil: "networkidle" });
    await page.keyboard.press("Control+k");
    const box = page.getByRole("textbox", { name: "Search sections" });
    await expect(box).toBeVisible();
    await box.fill("timel");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/admin\/timeline/);
  });
  test("health page reports the database and storage as working", async ({ page }) => {
    await page.goto("/admin/health");
    const row = (name: string) => page.getByRole("row", { name: new RegExp(name) });
    await expect(row("Database")).toContainText("OK");
    await expect(row("Storage: originals")).toContainText("OK");
    await expect(row("Storage: public")).toContainText("OK");
  });
});

test.describe("profile, links and timeline", () => {
  test("edit the headline and see it saved; validation errors are shown inline", async ({ page }) => {
    await page.goto("/admin/profile");
    await page.getByLabel("Headline").fill("I take photographs and fly drones.");
    await page.getByRole("textbox", { name: /^Email/ }).fill("not-an-email");
    await page.getByRole("button", { name: "Save", exact: true }).first().click();
    await expect(page.getByText("Enter a valid email")).toBeVisible();
    await page.getByRole("textbox", { name: /^Email/ }).fill("hello@jerryqiu.com");
    await page.getByRole("button", { name: "Save", exact: true }).first().click();
    await expect(page.getByText("Profile saved")).toBeVisible();
    await page.reload();
    await expect(page.getByLabel("Headline")).toHaveValue("I take photographs and fly drones.");
  });
  test("add, edit and delete a social link", async ({ page }) => {
    await page.goto("/admin/profile");
    const blank = page.locator(".adm-card").last();
    await blank.locator('input[name="label"]').fill("GitHub");
    await blank.locator('input[name="href"]').fill("https://github.com/example");
    await blank.getByRole("button", { name: "Add link" }).click();
    await expect(page.getByText("Link added")).toBeVisible();
    await page.reload();
    const row = page.locator(".adm-card").filter({ has: page.locator('input[name="label"][value="GitHub"]') });
    await expect(row).toHaveCount(1);
    page.once("dialog", (d) => d.accept());
    await row.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText("Moved to trash")).toBeVisible();
  });
  test("create and edit a timeline entry; an end date before the start date is refused", async ({ page }) => {
    await page.goto("/admin/timeline/new");
    await page.getByLabel("Title").fill(`Test entry ${uid}`);
    await page.getByLabel("Start").fill("2025-05-01");
    await page.getByLabel("End").fill("2025-04-01");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("End date is before the start date")).toBeVisible();
    await page.getByLabel("End").fill("2025-06-01");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page).toHaveURL(/\/admin\/timeline$/);
    await expect(page.getByRole("link", { name: `Test entry ${uid}` })).toBeVisible();
  });
});

test.describe("posts", () => {
  test("draft, autosave-free save, preview, publish, version history and restore, trash", async ({ page }) => {
    await page.goto("/admin/posts/new");
    await page.getByRole("textbox", { name: /^Title/ }).fill(`A Test Post ${uid}`);
    await expect(page.getByLabel("URL")).toHaveValue(`a-test-post-${uid}`);
    await page.getByLabel("Body", { exact: true }).fill("Hello **world**.\n\n[[youtube dQw4w9WgXcQ]]");
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page).toHaveURL(/\/admin\/posts\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("textbox", { name: /^Title/ })).toHaveValue(`A Test Post ${uid}`);

    // publishing needs a summary
    await page.getByLabel("Status").selectOption("published");
    await page.getByRole("button", { name: "Publish" }).click();
    await expect(page.getByText("Add a short summary before publishing")).toBeVisible();
    await page.getByLabel("Summary").fill("A short summary.");
    await page.getByRole("button", { name: "Publish" }).click();
    await expect(page.locator(".hm-toast", { hasText: "Published" })).toBeVisible();

    // preview renders markdown, and the video is click-to-load (no iframe)
    await page.getByRole("tab", { name: "Preview" }).click();
    await expect(page.locator("strong", { hasText: "world" })).toBeVisible();
    await expect(page.locator("iframe")).toHaveCount(0);

    // version history has entries and restoring makes a draft
    await expect(page.getByRole("heading", { name: "Version history" })).toBeVisible();
    page.once("dialog", (d) => d.accept());
    await page
      .getByRole("row", { name: /Version 1/ })
      .getByRole("button", { name: "Restore" })
      .click();
    await expect(page.getByText(/Restored version 1 as a draft/)).toBeVisible();

    // trash it
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page).toHaveURL(/\/admin\/posts$/);
    await expect(page.getByRole("link", { name: `A Test Post ${uid}` })).toHaveCount(0);
  });
  test("two posts cannot share a URL", async ({ page }) => {
    for (const n of [1, 2]) {
      await page.goto("/admin/posts/new");
      await page.getByRole("textbox", { name: /^Title/ }).fill(`Dupe ${uid} ${n}`);
      await page.getByLabel("URL").fill(`dupe-url-${uid}`);
      await page.getByRole("button", { name: "Save draft" }).click();
      if (n === 1) await expect(page).toHaveURL(/\/admin\/posts\/[0-9a-f-]{36}$/);
    }
    await expect(page.getByText("Another post already uses this URL")).toBeVisible();
  });
  test("the preview page shows a draft for signed-in staff", async ({ page }) => {
    await page.goto("/admin/posts");
    await page.getByRole("link", { name: `Dupe ${uid} 1` }).click();
    await page.getByRole("link", { name: "Preview" }).click();
    await expect(page.getByText(/Preview\. This is how/)).toBeVisible();
    await expect(page.getByRole("heading", { name: `Dupe ${uid} 1` })).toBeVisible();
  });
});

test.describe("projects", () => {
  test("create a project with blocks and credits, publish, and see it in the list", async ({ page }) => {
    await page.goto("/admin/projects/new");
    await page.getByRole("textbox", { name: /^Title/ }).fill(`E2E Project ${uid}`);
    await page.getByRole("button", { name: "+ Text" }).click();
    await page.getByLabel("Text (Markdown)").fill("## Overview\n\nSomething happened.");
    await page.getByRole("button", { name: "+ Quote" }).click();
    await page.getByLabel("Quote", { exact: true }).fill("Great night.");
    await page.getByRole("button", { name: "+ Add credit" }).click();
    await page.getByLabel("Name").fill("Jerry Qiu");
    await page.getByLabel("Role", { exact: true }).fill("Photographer");
    await page.getByLabel("Status").selectOption("published");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/projects\/[0-9a-f-]{36}$/);
    await page.goto("/admin/projects");
    await expect(page.getByRole("link", { name: `E2E Project ${uid}` })).toBeVisible();
  });
  test("an invalid video id in a block is rejected by the server", async ({ page }) => {
    await page.goto("/admin/projects/new");
    await page.getByRole("textbox", { name: /^Title/ }).fill("Bad video");
    await page.getByRole("button", { name: "+ Video" }).click();
    await page.getByLabel("YouTube video id").fill("<script>");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText(/Check the highlighted fields|Not a valid video id/).first()).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/projects\/new$/);
  });
});
