import { afterEach, describe, expect, it, vi } from "vitest";

async function load() {
  vi.resetModules();
  return import("../src/index");
}
afterEach(() => vi.unstubAllEnvs());

describe("site registry", () => {
  it("defaults to localhost in development: every site has its own port", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { getSite, sitePath } = await load();
    expect(getSite("hub").url).toBe("http://localhost:3000");
    expect(getSite("photos").url).toBe("http://localhost:3002");
    expect(getSite("music").url).toBe("http://localhost:3003");
    expect(getSite("flying").url).toBe("http://localhost:3004");
    expect(sitePath("music", "/listen")).toBe("/listen");
    expect(sitePath("flying")).toBe("/");
    expect(sitePath("hub", "/about")).toBe("/about");
  });
  it("uses the real subdomains in production and root-relative paths", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { getSite, sitePath } = await load();
    expect(getSite("photos").url).toBe("https://photo.jerryqiu.com");
    expect(getSite("music").url).toBe("https://music.jerryqiu.com");
    expect(sitePath("music", "/listen")).toBe("/listen");
    expect(sitePath("music")).toBe("/");
  });
  it("env overrides win and strip trailing slashes", async () => {
    vi.stubEnv("NEXT_PUBLIC_PHOTOS_URL", "https://example.test/");
    const { getSite } = await load();
    expect(getSite("photos").url).toBe("https://example.test");
  });
  it("every site has a unique accent colour and its own preset", async () => {
    const { getSites } = await load();
    const sites = getSites();
    expect(new Set(sites.map((s) => s.color)).size).toBe(sites.length);
    for (const s of sites) expect(s.preset).toBe(s.id);
  });
  it("dev-only placeholders vanish in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.resetModules();
    const { todo } = await import("../src/profile");
    expect(todo("anything")).toBeUndefined();
    vi.stubEnv("NODE_ENV", "development");
    vi.resetModules();
    const dev = await import("../src/profile");
    expect(dev.todo("a thing")).toBe("TODO(owner): a thing");
  });
});
