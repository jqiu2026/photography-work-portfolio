import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import type { Database } from "./client";
import { StudioError } from "./errors";
import * as s from "./schema";

/** Keys for the read-only owner API. A key looks like `jqk_` plus 43 random characters and is shown once. */
const hash = (key: string) => createHash("sha256").update(key).digest("hex");
export const looksLikeKey = (key: string) => /^jqk_[A-Za-z0-9_-]{43}$/.test(key);

export async function createApiKey(db: Database, name: string) {
  const clean = name.trim().slice(0, 60);
  if (!clean) throw new StudioError("Give the key a name, like the app that will use it.");
  const key = `jqk_${randomBytes(32).toString("base64url")}`;
  const [row] = await db
    .insert(s.studioApiKeys)
    .values({ name: clean, prefix: key.slice(0, 8), keyHash: hash(key) })
    .returning();
  return { key, row };
}

export const listApiKeys = (db: Database) => db.select().from(s.studioApiKeys).orderBy(desc(s.studioApiKeys.createdAt));

export async function revokeApiKey(db: Database, id: string) {
  await db
    .update(s.studioApiKeys)
    .set({ revokedAt: new Date() })
    .where(and(eq(s.studioApiKeys.id, id), isNull(s.studioApiKeys.revokedAt)));
}

/** True when the key exists and is not revoked; notes when it was last used. */
export async function checkApiKey(db: Database, key: string): Promise<boolean> {
  if (!looksLikeKey(key)) return false;
  const [row] = await db
    .select()
    .from(s.studioApiKeys)
    .where(and(eq(s.studioApiKeys.keyHash, hash(key)), isNull(s.studioApiKeys.revokedAt)));
  if (!row) return false;
  await db.update(s.studioApiKeys).set({ lastUsedAt: new Date() }).where(eq(s.studioApiKeys.id, row.id));
  return true;
}
