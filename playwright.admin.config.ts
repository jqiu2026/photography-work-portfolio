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
  NEXT_PUBLIC_PHOTOS_URL: "http://localhost:3302",
  NEXT_PUBLIC_MUSIC_URL: "http://localhost:3304",
  NEXT_PUBLIC_FLYING_URL: "http://localhost:3305",
  REVALIDATE_SECRET: "e2e-revalidate-secret-0123456789",
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
      // the data cache of earlier runs lives in .next-e2e and outlasts the wiped database, so start clean
      command: "rm -rf apps/web/.next-e2e && pnpm --filter @jerryqiu/web dev",
      port: 3300,
      env: { ...env, PORT: "3300", NEXT_DIST_DIR: ".next-e2e" },
      reuseExistingServer: false,
      timeout: 180_000,
    },
    {
      command: "pnpm --filter @jerryqiu/photos dev",
      port: 3302,
      env: {
        ...env,
        PORT: "3302",
        NEXT_DIST_DIR: ".next-e2e",
        STRIPE_WEBHOOK_SECRET: "whsec_e2e_secret",
        CRON_SECRET: "e2e-cron-secret-0123456789",
      },
      reuseExistingServer: false,
      timeout: 180_000,
    },
    {
      command: "pnpm --filter @jerryqiu/music dev",
      port: 3304,
      env: { ...env, PORT: "3304", NEXT_DIST_DIR: ".next-e2e" },
      reuseExistingServer: false,
      timeout: 180_000,
    },
    {
      command: "pnpm --filter @jerryqiu/flying dev",
      port: 3305,
      env: { ...env, PORT: "3305", NEXT_DIST_DIR: ".next-e2e" },
      reuseExistingServer: false,
      timeout: 180_000,
    },
  ],
});
