import path from "node:path";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

// One env file for the whole monorepo: load <repo>/.env.development, .env.local, ... before Next reads its own.
loadEnvConfig(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.."),
  process.env.NODE_ENV !== "production",
);

/** @type {import('next').NextConfig} */
export default {
  transpilePackages: ["@placeholder/ui", "@jerryqiu/sites"],
};
