# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> music /music/performances dark 390
- Location: e2e/smoke.spec.ts:16:9

# Error details

```
Error: no horizontal scroll

expect(received).toBeLessThanOrEqual(expected)

Expected: <= 1
Received:    3
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to content" [ref=e2] [cursor=pointer]:
    - /url: "#main"
  - banner [ref=e3]:
    - generic [ref=e4]:
      - button "Jerry Qiu Switch site" [ref=e6] [cursor=pointer]:
        - generic [ref=e7]: Jerry Qiu
        - generic [ref=e10]: Switch site
      - generic [ref=e11]:
        - button "Switch to light theme" [ref=e12] [cursor=pointer]
        - button "Open menu" [ref=e20] [cursor=pointer]
  - main [ref=e23]:
    - generic [ref=e24]:
      - paragraph [ref=e25]: Music
      - heading "Performances" [level=1] [ref=e26]
    - paragraph [ref=e29]: No performances listed yet.
  - contentinfo [ref=e30]:
    - generic [ref=e31]:
      - navigation "More from me" [ref=e32]:
        - heading "More from me" [level=2] [ref=e33]
        - list [ref=e34]:
          - listitem [ref=e35]:
            - link "Jerry Qiu About me, my work and writing" [ref=e36] [cursor=pointer]:
              - /url: http://localhost:4000
              - strong [ref=e37]: Jerry Qiu
              - generic [ref=e38]: About me, my work and writing
          - listitem [ref=e39]:
            - link "Photography Portfolio and galleries" [ref=e40] [cursor=pointer]:
              - /url: http://localhost:4002
              - strong [ref=e41]: Photography
              - generic [ref=e42]: Portfolio and galleries
          - listitem [ref=e43]:
            - link "Flying Notes and photos about flying" [ref=e44] [cursor=pointer]:
              - /url: http://localhost:4000/flying
              - strong [ref=e45]: Flying
              - generic [ref=e46]: Notes and photos about flying
      - list [ref=e47]:
        - listitem [ref=e48]:
          - link "LinkedIn" [ref=e49] [cursor=pointer]:
            - /url: https://www.linkedin.com/in/jqiu2026/
        - listitem [ref=e52]:
          - link "Instagram" [ref=e53] [cursor=pointer]:
            - /url: https://ig.jerryqiu.com
        - listitem [ref=e56]:
          - link "YouTube" [ref=e57] [cursor=pointer]:
            - /url: https://www.youtube.com/@jqiu2026
        - listitem [ref=e60]:
          - link "Email" [ref=e61] [cursor=pointer]:
            - /url: mailto:hello@jerryqiu.com
      - generic [ref=e65]:
        - paragraph [ref=e66]: © 2026 Jerry Qiu. All photographs and writing are © Jerry Qiu unless stated.
        - navigation "Legal" [ref=e67]:
          - list [ref=e68]:
            - listitem [ref=e69]:
              - link "Privacy" [ref=e70] [cursor=pointer]:
                - /url: http://localhost:4000/privacy
            - listitem [ref=e71]:
              - link "Terms" [ref=e72] [cursor=pointer]:
                - /url: http://localhost:4000/terms
            - listitem [ref=e73]:
              - link "Licensing" [ref=e74] [cursor=pointer]:
                - /url: http://localhost:4000/licensing
            - listitem [ref=e75]:
              - link "Accessibility" [ref=e76] [cursor=pointer]:
                - /url: http://localhost:4000/accessibility
  - alert [ref=e77]
```

# Test source

```ts
  1  | import AxeBuilder from "@axe-core/playwright";
  2  | import { expect, test } from "@playwright/test";
  3  | import path from "node:path";
  4  | import { routes } from "./routes";
  5  | 
  6  | const shots = path.resolve("docs/project/screenshots/phase-1");
  7  | const variants = [
  8  |   { scheme: "light", width: 1440, height: 900 },
  9  |   { scheme: "dark", width: 1440, height: 900 },
  10 |   { scheme: "light", width: 390, height: 844 },
  11 |   { scheme: "dark", width: 390, height: 844 },
  12 | ] as const;
  13 | 
  14 | for (const r of routes) {
  15 |   for (const v of variants) {
  16 |     test(`${r.site} ${r.path} ${v.scheme} ${v.width}`, async ({ browser }) => {
  17 |       const ctx = await browser.newContext({ colorScheme: v.scheme, viewport: { width: v.width, height: v.height } });
  18 |       const page = await ctx.newPage();
  19 |       const errors: string[] = [];
  20 |       page.on("pageerror", (e) => errors.push(String(e)));
  21 |       page.on(
  22 |         "console",
  23 |         (m) =>
  24 |           m.type() === "error" &&
  25 |           !/Failed to load resource.*(404|youtube|google)/i.test(m.text()) &&
  26 |           errors.push(m.text()),
  27 |       );
  28 |       const res = await page.goto(`${r.base}${r.path}`, { waitUntil: "networkidle" });
  29 |       expect(res?.status(), "status").toBe(r.path === "/nope" ? 404 : 200);
  30 |       // Fire reveal animations before measuring.
  31 |       const h = await page.evaluate(() => document.documentElement.scrollHeight);
  32 |       for (let y = 0; y < Math.min(h, 12000); y += 700) {
  33 |         await page.evaluate((yy) => window.scrollTo(0, yy), y);
  34 |         await page.waitForTimeout(60);
  35 |       }
  36 |       await page.evaluate(() => window.scrollTo(0, 0));
  37 |       await page.waitForTimeout(400);
  38 |       const overflow = await page.evaluate(
  39 |         () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  40 |       );
> 41 |       expect(overflow, "no horizontal scroll").toBeLessThanOrEqual(1);
     |                                                ^ Error: no horizontal scroll
  42 |       expect(errors, "console/page errors").toEqual([]);
  43 |       const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  44 |       const bad = results.violations.filter((x) => x.impact === "serious" || x.impact === "critical");
  45 |       expect(
  46 |         bad.map(
  47 |           (x) =>
  48 |             `${x.id}: ${x.nodes
  49 |               .map((n) => n.target.join(" "))
  50 |               .slice(0, 3)
  51 |               .join(" | ")}`,
  52 |         ),
  53 |         "axe serious/critical",
  54 |       ).toEqual([]);
  55 |       const name = `${r.site}${r.path === "/" ? "-home" : r.path.replace(/\//g, "-")}-${v.scheme}-${v.width}.png`;
  56 |       await page.screenshot({ path: path.join(shots, r.site, name), fullPage: false });
  57 |       await ctx.close();
  58 |     });
  59 |   }
  60 | }
  61 | 
```