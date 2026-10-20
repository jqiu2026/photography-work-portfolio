import { defineConfig } from "@playwright/test";

/**
 * Maintenance mode, per app: each app's dev server on its own port with MAINTENANCE_MODE=1 (the proxy answers before any
 * page, layout or database is reached, so nothing else has to be running). `pnpm test:maintenance`.
 */
export const apps = [
  { name: "web", filter: "@jerryqiu/web", port: 4100, open: "/api/cron/purge", sitemap: true },
  { name: "photos", filter: "@jerryqiu/photos", port: 4101, open: "/api/health", sitemap: true },
  { name: "music", filter: "@jerryqiu/music", port: 4102, open: "/api/revalidate", sitemap: true },
  { name: "flying", filter: "@jerryqiu/flying", port: 4103, open: "/api/revalidate", sitemap: true },
  { name: "make", filter: "@jerryqiu/make", port: 4104, open: undefined, sitemap: false },
] as const;

export default defineConfig({
  testDir: "./e2e-maintenance",
  timeout: 60_000,
  fullyParallel: true,
  workers: 4,
  reporter: [["list"]],
  webServer: apps.map((a) => ({
    command: `pnpm --filter ${a.filter} dev`,
    port: a.port,
    env: {
      PORT: String(a.port),
      MAINTENANCE_MODE: "1",
      NEXT_DIST_DIR: ".next-maintenance",
      AUTH_SECRET: "e2e-only-secret-0123456789abcdefghijklmnop",
    },
    reuseExistingServer: false,
    timeout: 120_000,
  })),
});
