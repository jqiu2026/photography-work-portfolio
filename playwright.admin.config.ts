import os from "node:os";
import path from "node:path";
import { defineConfig } from "@playwright/test";

const DATA = path.join(os.homedir(), ".jerryqiu-dev", "e2e");

/**
 * Admin flows run against a DEV server (development-only open sign-in) wired to a throwaway PGlite database on its own
 * port and data directory, so tests never touch your real dev data. Production-mode gates are covered by e2e/auth.spec.ts.
 *   pnpm test:admin
 */
const DB_PORT = 54339;
const env = {
  DATABASE_URL: `postgres://postgres:postgres@127.0.0.1:${DB_PORT}/postgres`,
  PGLITE_PORT: String(DB_PORT),
  PGLITE_DIR: path.join(DATA, "pglite"),
  STORAGE_DIR: path.join(DATA, "storage"),
  NEXT_PUBLIC_HUB_URL: "http://localhost:3300",
};

export default defineConfig({
  testDir: "./e2e-admin",
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3300" },
  webServer: [
    {
      command: `rm -rf "${DATA}" && pnpm --filter @jerryqiu/db dev`,
      url: undefined,
      port: DB_PORT,
      env,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: "pnpm --filter @jerryqiu/web dev",
      port: 3300,
      env: { ...env, PORT: "3300", NEXT_DIST_DIR: ".next-e2e" },
      reuseExistingServer: false,
      timeout: 180_000,
    },
  ],
});
