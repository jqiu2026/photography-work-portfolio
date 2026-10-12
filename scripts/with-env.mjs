// Runs a command with the monorepo's root env files loaded (<repo>/.env.development | .env.production, .env.local, .env).
// usage: node scripts/with-env.mjs <dev|prod> <command> [args...]
// Existing environment variables always win (so Vercel / CI settings are never overridden by a file).
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";

const [mode, cmd, ...args] = process.argv.slice(2);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dev = mode === "dev";
if (!process.env.NODE_ENV) process.env.NODE_ENV = dev ? "development" : "production";
nextEnv.loadEnvConfig(root, dev, { info: () => {}, error: console.error });

const child = spawn(cmd, args, { stdio: "inherit", env: process.env, shell: process.platform === "win32" });
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child.kill(sig));
child.on("exit", (code, signal) => process.exit(signal ? 1 : (code ?? 0)));
