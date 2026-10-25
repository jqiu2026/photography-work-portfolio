import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, describe, expect, it } from "vitest";
import * as keys from "../src/api-keys";
import type { Database } from "../src/client";
import * as schema from "../src/schema";

const here = path.dirname(fileURLToPath(import.meta.url));
let db: Database;
beforeAll(async () => {
  const d = drizzle(await PGlite.create(), { schema, casing: "snake_case" });
  await migrate(d, { migrationsFolder: path.join(here, "../drizzle") });
  db = d as unknown as Database;
});

describe("api keys", () => {
  it("accepts a made key once, stores only its hash, and refuses it after it is revoked", async () => {
    const { key, row } = await keys.createApiKey(db, "Zapier");
    expect(keys.looksLikeKey(key)).toBe(true);
    expect(row.keyHash).not.toContain(key);
    expect(await keys.checkApiKey(db, key)).toBe(true);
    expect(await keys.checkApiKey(db, `${key.slice(0, -1)}x`)).toBe(false);
    expect(await keys.checkApiKey(db, "nope")).toBe(false);
    expect((await keys.listApiKeys(db))[0].lastUsedAt).not.toBeNull();
    await keys.revokeApiKey(db, row.id);
    expect(await keys.checkApiKey(db, key)).toBe(false);
    await expect(keys.createApiKey(db, "  ")).rejects.toThrow("name");
  });
});
