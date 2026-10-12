import { type Database, getDb } from "@jerryqiu/db";

/** Runs `fn` with the database, or returns undefined when none is configured (pages then show a setup note). */
export async function withDb<T>(fn: (db: Database) => Promise<T>): Promise<T | undefined> {
  const db = getDb();
  if (!db) return undefined;
  return fn(db);
}
