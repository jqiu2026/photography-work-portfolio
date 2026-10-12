import { sql } from "drizzle-orm";
import type { Database } from "./client";

export type RateLimitResult = { allowed: boolean; count: number };

/** Fixed-window counter in Postgres (no Redis): one atomic upsert that starts a new window when the old one expired. */
export async function hitRateLimit(
  db: Database,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const window = `${windowSeconds} seconds`;
  const result = await db.execute<{ count: number }>(sql`
    insert into rate_limits (key, count, window_start) values (${key}, 1, now())
    on conflict (key) do update set
      count = case when rate_limits.window_start < now() - ${window}::interval then 1 else rate_limits.count + 1 end,
      window_start = case when rate_limits.window_start < now() - ${window}::interval then now() else rate_limits.window_start end
    returning count
  `);
  const rows = (Array.isArray(result) ? result : (result as { rows: unknown[] }).rows) as Array<{
    count: number | string;
  }>;
  const count = Number(rows[0]?.count ?? limit + 1);
  return { allowed: count <= limit, count };
}
