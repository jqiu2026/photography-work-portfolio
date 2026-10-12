// Applies committed migrations to DATABASE_URL (Neon or any Postgres). Usage: pnpm --filter @jerryqiu/db migrate
import path from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";
import { drizzle as neonDrizzle } from "drizzle-orm/neon-http";
import { migrate as neonMigrate } from "drizzle-orm/neon-http/migrator";
import { drizzle as pgDrizzle } from "drizzle-orm/node-postgres";
import { migrate as pgMigrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const folder = path.join(path.dirname(fileURLToPath(import.meta.url)), "../drizzle");
if (/neon\.tech|neon\.build/.test(url)) {
  await neonMigrate(neonDrizzle({ client: neon(url) }), { migrationsFolder: folder });
} else {
  const pool = new pg.Pool({ connectionString: url, ssl: false });
  await pgMigrate(pgDrizzle({ client: pool }), { migrationsFolder: folder });
  await pool.end();
}
console.log("migrations applied");
