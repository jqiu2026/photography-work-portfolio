import "server-only";
import { getDb, hitRateLimit } from "@jerryqiu/db";
import { clientIpHash } from "@jerryqiu/protect";
import { headers } from "next/headers";

/** Per-visitor limiter for public forms: a window per action and address (hashed). Allows when there is no database. */
export async function allow(action: string, limit: number, windowSeconds: number): Promise<boolean> {
  const db = getDb();
  if (!db) return true;
  const h = await headers();
  return (await hitRateLimit(db, `flying:${action}:${clientIpHash(h)}`, limit, windowSeconds)).allowed;
}

export async function ipHash() {
  return clientIpHash(await headers());
}
