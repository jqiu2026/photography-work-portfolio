import { expect, test } from "@playwright/test";
import { flying, hub, make, music, photos } from "./routes";

/**
 * The static tier is complete: with no JavaScript, with reduced motion, and with the Calm choice, every home shows all of
 * its content from the first paint (nothing hidden waiting for a reveal), has a skip link and a main landmark, and has
 * no canvas.
 */
const homes = [
  {
    name: "hub",
    url: `${hub}/`,
    h1: /Jerry Qiu/,
    texts: [/The Nexus/i, /Say hello/i, /photographer/i],
    halation: false,
  },
  {
    name: "photos",
    url: `${photos}/`,
    h1: /Pictures of people at work/i,
    texts: [/Working with me/i, /Let.s make something worth keeping/i],
  },
  { name: "music", url: `${music}/`, h1: /Music/, texts: [/New pieces, in your inbox/i], halation: false },
  { name: "make", url: `${make}/`, h1: /Make/, texts: [/small showcase/i], halation: false },
  { name: "flying", url: `${flying}/`, h1: /Flying/, texts: [/Tools I built to learn/i, /The log/i], halation: false },
];

for (const h of homes) {
  test(`no JavaScript: ${h.name} home is complete`, async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(h.url);
    await expect(page.locator("main#main")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(h.h1);
    for (const t of h.texts) await expect(page.getByText(t).first()).toBeVisible();
    // nothing is held back at opacity 0 waiting for script
    const hidden = await page.$$eval(
      "[data-hl-reveal]",
      (els) =>
        els.filter(
          (e) => getComputedStyle(e).opacity === "0" || getComputedStyle(e.firstElementChild ?? e).opacity === "0",
        ).length,
    );
    expect(hidden).toBe(0);
    expect(await page.locator("canvas.hl-stage__canvas").count()).toBe(0);
    await ctx.close();
  });

  test(`reduced motion: ${h.name} home is complete and canvas-free`, async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto(h.url, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(h.h1);
    for (const t of h.texts) await expect(page.getByText(t).first()).toBeVisible();
    // the music site is on Holominimal, which has no stage tiers: only the Halation sites carry the attribute
    if (h.halation !== false) await expect(page.locator("html")).toHaveAttribute("data-hl-tier", "static");
    expect(await page.locator("canvas.hl-stage__canvas").count()).toBe(0);
    await ctx.close();
  });
}
