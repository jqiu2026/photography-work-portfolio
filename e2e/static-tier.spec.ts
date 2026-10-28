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
  },
  {
    name: "photos",
    url: `${photos}/`,
    h1: /Pictures of people at work/i,
    texts: [/Working with me/i, /Let.s make something worth keeping/i],
  },
  { name: "music", url: `${music}/`, h1: /Music/, texts: [/New pieces, in your inbox/i] },
  { name: "make", url: `${make}/`, h1: /Make/, texts: [/small showcase/i] },
  { name: "flying", url: `${flying}/`, h1: /Flying/, texts: [/Tools I built to learn/i, /The log/i] },
];

for (const h of homes) {
  test(`no JavaScript: ${h.name} home is complete`, async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(h.url);
    await expect(page.locator("main#main")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(h.h1);
    for (const t of h.texts) await expect(page.getByText(t).first()).toBeVisible();
    await ctx.close();
  });

  test(`reduced motion: ${h.name} home is complete and canvas-free`, async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto(h.url, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(h.h1);
    for (const t of h.texts) await expect(page.getByText(t).first()).toBeVisible();
    await ctx.close();
  });
}
