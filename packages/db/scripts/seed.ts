// Imports repo content into DATABASE_URL (idempotent). Usage: pnpm --filter @jerryqiu/db seed
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDb } from "../src/client";
import { seed } from "../src/seed";

const db = getDb();
if (!db) throw new Error("DATABASE_URL is not set");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const result = await seed(db, {
  webRoot: path.join(root, "apps/web"),
  adminEmails: (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean),
});
console.log("seeded", result);
process.exit(0);
