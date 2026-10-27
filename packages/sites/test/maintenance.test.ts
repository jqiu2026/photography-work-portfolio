import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { maintenance, maintenanceOn, RETRY_AFTER } from "../src/maintenance";
import { maintenanceHtml } from "../src/maintenance-html";
// @ts-expect-error: the generator is plain JavaScript
import { renderMaintenancePage } from "../scripts/maintenance-page.mjs";

const req = (path: string, method = "GET") => new NextRequest(`https://jerryqiu.com${path}`, { method });

afterEach(() => vi.unstubAllEnvs());

describe("the mode", () => {
  it("is on in a production build and off in development when MAINTENANCE_MODE is unset", () => {
    expect(maintenanceOn({ NODE_ENV: "production" })).toBe(true);
    expect(maintenanceOn({ NODE_ENV: "development" })).toBe(false);
    expect(maintenanceOn({})).toBe(false);
  });
  it("is set by MAINTENANCE_MODE either way", () => {
    for (const v of ["1", "true", "on", "yes", " ON "])
      expect(maintenanceOn({ NODE_ENV: "development", MAINTENANCE_MODE: v })).toBe(true);
    for (const v of ["0", "false", "off", "no"])
      expect(maintenanceOn({ NODE_ENV: "production", MAINTENANCE_MODE: v })).toBe(false);
  });
});

describe("with the mode on", () => {
  const on = () => vi.stubEnv("MAINTENANCE_MODE", "1");

  it("answers a page request with the page, 503, Retry-After and noindex", async () => {
    on();
    const res = maintenance(req("/portfolio"));
    expect(res?.status).toBe(503);
    expect(res?.headers.get("retry-after")).toBe(RETRY_AFTER);
    expect(res?.headers.get("x-robots-tag")).toContain("noindex");
    expect(res?.headers.get("content-type")).toContain("text/html");
    const html = await res?.text();
    expect(html).toContain("<title>Back soon · Jerry Qiu</title>");
    expect(html).toContain('name="robots" content="noindex, nofollow"');
    expect(html).toContain(`© ${new Date().getFullYear()} Jerry Qiu.`);
    expect(html).not.toContain("%YEAR%");
  });

  it("answers the home page, a made-up URL and a POST the same way", () => {
    on();
    for (const [path, method] of [
      ["/", "GET"],
      ["/no/such/page", "GET"],
      ["/book", "POST"],
    ] as const)
      expect(maintenance(req(path, method))?.status).toBe(503);
  });

  it("answers HEAD without a body, and the API with JSON", async () => {
    on();
    expect(await maintenance(req("/", "HEAD"))?.text()).toBe("");
    const api = maintenance(req("/api/contact", "POST"));
    expect(api?.status).toBe(503);
    expect(api?.headers.get("content-type")).toContain("application/json");
  });

  it("keeps crawlers out: robots.txt disallows all, the sitemap is gone", async () => {
    on();
    expect(await maintenance(req("/robots.txt"))?.text()).toContain("Disallow: /");
    expect(maintenance(req("/sitemap.xml"))?.status).toBe(404);
  });

  it("lets the always-open paths and an app's own through", () => {
    on();
    for (const p of [
      "/api/cron/run",
      "/api/webhooks/stripe",
      "/api/auth/session",
      "/api/health",
      "/api/revalidate",
      "/.well-known/security.txt",
    ])
      expect(maintenance(req(p))).toBeNull();
    expect(maintenance(req("/studio/inbox"), ["/studio"])).toBeNull();
    expect(maintenance(req("/studio"), ["/studio"])).toBeNull();
    // a prefix is a whole path segment, not a string prefix
    expect(maintenance(req("/studios"), ["/studio"])?.status).toBe(503);
  });
});

it("does nothing with the mode off", () => {
  vi.stubEnv("MAINTENANCE_MODE", "0");
  expect(maintenance(req("/"))).toBeNull();
  expect(maintenance(req("/api/contact", "POST"))).toBeNull();
});

describe("the page", () => {
  it("is current: src/maintenance-html.ts matches scripts/maintenance-page.mjs (run `pnpm --filter @jerryqiu/sites maintenance:build`)", () => {
    expect(maintenanceHtml).toBe(renderMaintenancePage());
  });
  it("is self-contained: no script and no external request", () => {
    expect(maintenanceHtml).not.toMatch(/<script|<link|src="http|url\(http/i);
    expect(maintenanceHtml.length).toBeLessThan(100_000);
  });
  it("has a lang, a viewport and one h1", () => {
    expect(maintenanceHtml).toContain('<html lang="en"');
    expect(maintenanceHtml).toContain('name="viewport"');
    expect(maintenanceHtml.match(/<h1/g)).toHaveLength(1);
  });
});
