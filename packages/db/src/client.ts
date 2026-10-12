import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import pg from "pg";
import * as schema from "./schema";

export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

/** The Vercel + Neon integration may prefix the variable; DATABASE_URL always wins. */
export function databaseUrl(): string | undefined {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || undefined;
}

/** True when a database is configured. Pages and actions degrade gracefully when it is not (see docs/owner-guide.md). */
export function hasDatabase(): boolean {
  return Boolean(databaseUrl());
}

const g = globalThis as unknown as { __jqDb?: { url: string; db: Database } };

/**
 * Returns undefined when no database is configured. Neon URLs use the stateless HTTP driver (right for serverless);
 * anything else (the local PGlite server from `pnpm db:dev`, or any Postgres) uses node-postgres with a small pool.
 */
export function getDb(): Database | undefined {
  const url = databaseUrl();
  if (!url) return undefined;
  if (g.__jqDb?.url === url) return g.__jqDb.db;
  const isNeon = /neon\.tech|neon\.build/.test(url);
  const db = isNeon
    ? (drizzleNeon({ client: neon(url), schema, casing: "snake_case" }) as unknown as Database)
    : (drizzlePg({
        client: new pg.Pool({ connectionString: url, max: 4, ssl: false }),
        schema,
        casing: "snake_case",
      }) as unknown as Database);
  g.__jqDb = { url, db };
  return db;
}

export { schema };
