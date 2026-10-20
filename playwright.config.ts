import { defineConfig } from "@playwright/test";

/**
 * Runs against production builds on ports 4000 (hub), 4001 (docs), 4002 (photo), 4003 (music), 4004 (flying).
 * Build first with the test URLs: `pnpm test:e2e` does it. Sibling-site URLs point at these ports.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: true,
  workers: 4,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:4000" },
  webServer: [
    {
      command: "pnpm --filter @jerryqiu/web start",
      port: 4000,
      // DASHBOARD_OPEN_SIGNIN is set on purpose: production builds must ignore it (see e2e/auth.spec.ts).
      env: {
        PORT: "4000",
        MAINTENANCE_MODE: "0",
        AUTH_SECRET: "e2e-only-secret-0123456789abcdefghijklmnop",
        DASHBOARD_OPEN_SIGNIN: "true",
      },
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: "pnpm --filter @jerryqiu/docs start",
      port: 4001,
      env: { PORT: "4001" },
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: "pnpm --filter @jerryqiu/photos start",
      port: 4002,
      env: {
        PORT: "4002",
        MAINTENANCE_MODE: "0",
        AUTH_SECRET: "e2e-only-secret-0123456789abcdefghijklmnop",
        DASHBOARD_OPEN_SIGNIN: "true",
      },
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: "pnpm --filter @jerryqiu/music start",
      port: 4003,
      env: { PORT: "4003", MAINTENANCE_MODE: "0" },
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: "pnpm --filter @jerryqiu/flying start",
      port: 4004,
      env: { PORT: "4004", MAINTENANCE_MODE: "0" },
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
