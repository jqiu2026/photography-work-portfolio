import { expect, test } from "@playwright/test";
import { flying, hub, make, music, photos, routes } from "./routes";

/**
 * Cross-site rule (12-vision-v2.md): photography, music and flying reference nothing else in the family. The ONLY link
 * that leaves a world is the single footer button back to the hub (data-return-to-hub). No switcher, no "More from me".
 * Every site is its own deployment with its own origin, so "inside the world" means the site's own origin.
 */
const worlds = {
  photos: { origin: new URL(photos).origin, prefix: "" },
  music: { origin: new URL(music).origin, prefix: "" },
  flying: { origin: new URL(flying).origin, prefix: "" },
  make: { origin: new URL(make).origin, prefix: "" },
} as const;

for (const r of routes.filter((x) => x.site in worlds)) {
  test(`cross-site rule: ${r.site} ${r.path}`, async ({ page }) => {
    await page.goto(`${r.base}${r.path}`, { waitUntil: "domcontentloaded" });
    const w = worlds[r.site as keyof typeof worlds];
    const links = await page.$$eval("a[href]", (as) =>
      as.map((a) => ({
        href: (a as HTMLAnchorElement).href,
        back: a.hasAttribute("data-return-to-hub"),
      })),
    );
    const outside = links.filter((l) => {
      let u: URL;
      try {
        u = new URL(l.href);
      } catch {
        return false;
      }
      if (!/^https?:$/.test(u.protocol)) return false;
      if (u.origin !== w.origin) return /(^|\.)jerryqiu\.com$|^localhost$/.test(u.hostname);
      return w.prefix ? !(u.pathname === w.prefix || u.pathname.startsWith(`${w.prefix}/`)) : false;
    });
    // Everything that points at another family site must be the one return button.
    expect(outside.filter((l) => !l.back)).toEqual([]);
    expect(outside.filter((l) => l.back).length).toBeLessThanOrEqual(1);
    expect(await page.locator("[data-return-to-hub]").count()).toBeLessThanOrEqual(1);
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).not.toContain("more from me");
    expect(await page.locator("[class*='switcher']").count()).toBe(0);
    if (r.path !== "/nope" && !r.path.includes("/studio"))
      expect(await page.locator("[data-return-to-hub]").count()).toBe(1);
  });
}

test("hub /work URLs redirect (301) to the photography site", async ({ request }) => {
  for (const p of ["/work", "/work/stuy-sing-26"]) {
    const res = await request.get(`${hub}${p}`, { maxRedirects: 0 });
    expect(res.status(), p).toBe(301);
    expect(res.headers().location, p).toBe(`${photos}${p}`);
  }
});

test("hub /music and /flying URLs redirect (308) to their own sites", async ({ request }) => {
  for (const [base, p] of [
    [music, "/music"],
    [music, "/music/listen"],
    [flying, "/flying"],
    [flying, "/flying/log"],
  ] as const) {
    const res = await request.get(`${hub}${p}`, { maxRedirects: 0 });
    expect(res.status(), p).toBe(308);
    expect(res.headers().location, p).toBe(`${base}${p.replace(/^\/(music|flying)/, "") || "/"}`);
  }
});
