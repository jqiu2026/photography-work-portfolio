// Local development database: PGlite (real Postgres compiled to WASM) persisted in .data/pglite and served on a
// Postgres wire-protocol socket, so `apps/web` and `apps/photos` can share one database offline. Not for production.
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { seed } from "../src/seed";
import * as schema from "../src/schema";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const dataDir = process.env.PGLITE_DIR ?? path.join(root, ".data/pglite");
const port = Number(process.env.PGLITE_PORT ?? 54329);

mkdirSync(path.dirname(dataDir), { recursive: true });
const client = await PGlite.create(dataDir);
const db = drizzle(client, { schema, casing: "snake_case" });
await migrate(db, { migrationsFolder: path.join(here, "../drizzle") });
const seeded = await seed(db as never, {
  webRoot: path.join(root, "apps/web"),
  adminEmails: (process.env.ADMIN_EMAILS ?? "local-dev@localhost")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean),
});

const server = new PGLiteSocketServer({ db: client, port, host: "127.0.0.1", maxConnections: 10 });
await server.start();
console.log(
  `[db] local Postgres (PGlite) on postgres://postgres:postgres@127.0.0.1:${port}/postgres  data: ${path.relative(root, dataDir)}  seeded: ${JSON.stringify(seeded)}`,
);
const stop = async () => {
  await server.stop();
  await client.close();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
