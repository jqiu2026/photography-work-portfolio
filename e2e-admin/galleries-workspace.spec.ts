import { expect, test } from "@playwright/test";
import { choose, pickDateTime, note } from "./ui";
import sharp from "sharp";
import { clientOpen, newGallery, publishOpenGallery, uploadPhotos } from "./gallery-helpers";

/** The gallery workspace: list, bulk photo tools, design, sharing, scheduled publishing, duplicate and delete. */
const PHOTOS = "http://localhost:3302";
const uid = Date.now().toString(36);
const email = `ws-${uid}@example.test`;
test.describe.configure({ mode: "serial" });
const slow = expect.configure({ timeout: 25_000 });

let pass = "";
let slug = "";
let url = "";
const jpeg = (color: string) =>
  sharp({ create: { width: 1601, height: 1000, channels: 3, background: color } })
    .jpeg()
    .toBuffer();
const localStamp = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

test("create a gallery from a job, upload inside it, and find it in the list", async ({ page }) => {
  await page.goto(`${PHOTOS}/studio/clients`, { waitUntil: "networkidle" });
  await page.getByLabel("Name").fill(`WS Client ${uid}`);
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Add client" }).click();
  await slow(note(page).last()).toContainText("Client added");
  await page.goto(`${PHOTOS}/studio/shoots`, { waitUntil: "networkidle" });
  await choose(page.getByLabel("Client"), `WS Client ${uid}`);
  await page.getByLabel("Title").fill(`WS job ${uid}`);
  await page.getByRole("button", { name: "Add job" }).click();
  await slow(page.getByRole("listitem").filter({ hasText: `WS job ${uid}` })).toBeVisible();

  // no media-library step: a job and a title are all it takes
  const made = await newGallery(page, PHOTOS, `WS job ${uid}`, `Workspace ${uid}`);
  pass = made.passcode;
  slug = made.slug;
  url = made.url;
  await uploadPhotos(page, [
    { name: "a-first.jpg", mimeType: "image/jpeg", buffer: await jpeg("#aa4433") },
    { name: "b-second.jpg", mimeType: "image/jpeg", buffer: await jpeg("#33aa66") },
    { name: "c-third.jpg", mimeType: "image/jpeg", buffer: await jpeg("#3344aa") },
  ]);
  await expect(page.locator(".gm-stats")).toContainText("Photos3");

  await page.goto(`${PHOTOS}/studio/galleries`, { waitUntil: "networkidle" });
  const card = page.getByRole("link", { name: new RegExp(`Workspace ${uid}`) });
  await expect(card).toContainText("3 photos");
  await expect(card).toContainText("Draft");
  await page.getByLabel("Search galleries").fill(`no-such-${uid}`);
  await expect(page.getByText("No galleries match.")).toBeVisible();
  await page.getByLabel("Search galleries").fill(`workspace ${uid}`);
  await expect(card).toBeVisible();
  await page.getByRole("button", { name: /^Live/ }).click();
  await expect(card).toHaveCount(0);
  await page.getByRole("button", { name: /^Drafts/ }).click();
  await expect(card).toBeVisible();
});

test("select several photographs: hide, show, make the cover; sort; open one and step through", async ({ page }) => {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Select", exact: true }).click();
  await page.getByRole("button", { name: "Select a-first.jpg" }).click();
  await page.getByRole("button", { name: "Select b-second.jpg" }).click();
  const bar = page.getByRole("toolbar", { name: "Selected photographs" });
  await expect(bar).toContainText("2 selected");
  await bar.getByRole("button", { name: "Hide", exact: true }).click();
  await slow(note(page).filter({ hasText: "Hid 2 photographs" }).first()).toBeVisible();
  await expect(page.locator("li[data-hidden]")).toHaveCount(2);
  await page.getByRole("button", { name: "Select a-first.jpg" }).click();
  await page.getByRole("button", { name: "Select b-second.jpg" }).click();
  await page
    .getByRole("toolbar", { name: "Selected photographs" })
    .getByRole("button", { name: "Show", exact: true })
    .click();
  await slow(note(page).filter({ hasText: "Showed 2 photographs" }).first()).toBeVisible();
  await expect(page.locator("li[data-hidden]")).toHaveCount(0);

  await page.getByRole("button", { name: "Select c-third.jpg" }).click();
  await page.getByRole("toolbar", { name: "Selected photographs" }).getByRole("button", { name: "Make cover" }).click();
  await slow(note(page).filter({ hasText: /cover/i }).first()).toBeVisible();
  await expect(page.locator("li[data-media-id]").filter({ hasText: "c-third.jpg" })).toContainText("Cover");
  await page.getByRole("button", { name: "Done" }).click();

  await choose(page.getByLabel("Sort photographs"), "Filename");
  await slow(note(page).filter({ hasText: "Sorted 3 photographs" }).first()).toBeVisible();
  await choose(page.getByLabel("Show", { exact: true }), "Hidden");
  await expect(page.getByText("No photographs match this filter.")).toBeVisible();
  await choose(page.getByLabel("Show", { exact: true }), "Everything");

  await page.getByRole("button", { name: "Open a-first.jpg" }).click();
  const view = page.getByRole("dialog", { name: "Photograph" });
  await expect(view).toContainText("a-first.jpg");
  await expect(view).toContainText("1 / 3");
  await page.keyboard.press("ArrowRight");
  await expect(view).toContainText("b-second.jpg");
  await view.getByRole("button", { name: "Close" }).click();
});

test("design: rows and light; the client sees them after the gallery is published", async ({ page, browser }) => {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Branding" }).click();
  await page.getByRole("radio", { name: "Rows" }).click();
  await choose(page.getByLabel("Theme"), "Light");
  await page.getByLabel(/Shown above the photographs/).fill(`Welcome ${uid}`);
  await page.getByRole("button", { name: "Save design" }).click();
  await slow(note(page).filter({ hasText: "Design saved" }).first()).toBeVisible();
  await publishOpenGallery(page);

  const ctx = await browser.newContext();
  const c = await ctx.newPage();
  await clientOpen(c, PHOTOS, slug, pass);
  await expect(c.locator(".gx")).toHaveAttribute("data-layout", "rows");
  await expect(c.locator(".gx")).toHaveAttribute("data-theme", "light");
  await expect(c.getByText(`Welcome ${uid}`)).toBeVisible();
  await ctx.close();
});

test("a new passcode locks out the old one; the email goes to the client's address", async ({ page, browser }) => {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Share" }).click();
  await page.getByRole("button", { name: "Generate a new passcode" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Make a new passcode" }).click();
  const fresh = page.getByLabel("New passcode", { exact: true });
  await expect(fresh).toBeVisible({ timeout: 25_000 });
  const next = ((await fresh.textContent()) ?? "").trim();
  expect(next).not.toBe(pass);
  await page.getByRole("button", { name: /^Email WS Client/ }).click();
  await slow(note(page).filter({ hasText: "Email sent to the client" }).first()).toBeVisible();
  await expect(page.getByText(`Goes to ${email}`)).toBeVisible();

  const ctx = await browser.newContext();
  const c = await ctx.newPage();
  await c.goto(`${PHOTOS}/g/${slug}`, { waitUntil: "networkidle" });
  await c.getByLabel("Passcode").fill(pass);
  await c.getByRole("button", { name: "Open my gallery" }).click();
  await expect(c.locator("p[role=alert]")).toContainText("doesn't match", { timeout: 25_000 });
  await c.getByLabel("Passcode").fill(next);
  await c.getByRole("button", { name: "Open my gallery" }).click();
  await expect(
    c.getByRole("navigation", { name: "Gallery" }).or(c.getByRole("button", { name: "View Gallery" })),
  ).toBeVisible({
    timeout: 25_000,
  });
  await ctx.close();
  pass = next;
});

test("duplicate as a draft, schedule it for the past, and the hourly job publishes it; then delete it", async ({
  page,
  request,
}) => {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Settings" }).click();
  await page.getByRole("button", { name: "Duplicate as a draft" }).click();
  await page.waitForURL((u) => /\/studio\/gallery\//.test(u.pathname) && u.href.split("#")[0] !== url, {
    timeout: 25_000,
  });
  await expect(page.getByRole("heading", { level: 1 })).toContainText("(copy)");
  await expect(page.locator(".gm-meta")).toContainText("Draft");
  await expect(page.locator(".gm-stats")).toContainText("Photos3");

  await page.getByRole("tab", { name: "Settings" }).click();
  await pickDateTime(page, "Publish automatically at", new Date(Date.now() - 3 * 3_600_000));
  await page.getByRole("button", { name: "Save", exact: true }).first().click();
  await slow(note(page).filter({ hasText: "Publishing saved" }).first()).toBeVisible();

  const r = await request.get(`${PHOTOS}/api/cron/run`, {
    headers: { authorization: "Bearer e2e-cron-secret-0123456789" },
  });
  expect(r.status()).toBe(200);
  expect(((await r.json()) as { galleriesPublished: number }).galleriesPublished).toBeGreaterThanOrEqual(1);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".gm-meta")).toContainText("Live");

  await page.getByRole("tab", { name: "Settings" }).click();
  await page.getByRole("button", { name: "Delete gallery" }).click();
  // deleting asks first, in the studio's own confirmation dialog
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete gallery" }).click();
  await expect(page).toHaveURL(/\/studio\/galleries$/, { timeout: 25_000 });
  await expect(page.getByRole("link", { name: /\(copy\)/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: new RegExp(`Workspace ${uid}`) }).first()).toBeVisible();
});
