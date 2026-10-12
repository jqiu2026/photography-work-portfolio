import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, describe, expect, it } from "vitest";
import type { Database } from "../src/client";
import { exportAll, exportZip } from "../src/export";
import * as s from "../src/schema";

const here = path.dirname(fileURLToPath(import.meta.url));
let db: Database;
beforeAll(async () => {
  const client = await PGlite.create();
  const d = drizzle(client, { schema: s, casing: "snake_case" });
  await migrate(d, { migrationsFolder: path.join(here, "../drizzle") });
  db = d as unknown as Database;
  await db
    .insert(s.posts)
    .values({ slug: "hello/world", title: 'A "quoted" title', body: "# Hi\n\nBody", status: "published" });
  await db.insert(s.inboxMessages).values({ name: "Ada", email: "ada@example.com", message: "hello there" });
  await db.insert(s.externalConnections).values({ provider: "shootproof", data: "SECRET-CIPHERTEXT" });
});

describe("export", () => {
  it("writes JSON, Markdown with safe file names, and a media manifest", async () => {
    const files = await exportAll(db);
    expect(Object.keys(files)).toEqual(
      expect.arrayContaining(["data/posts.json", "media-manifest.json", "README.txt"]),
    );
    const md = Object.entries(files).find(([k]) => k.startsWith("posts/"));
    expect(md?.[0]).toBe("posts/hub-hello-world.md"); // slash in the slug cannot escape the folder
    expect(md?.[1]).toContain('title: "A \\"quoted\\" title"');
    expect(md?.[1]).toContain("# Hi");
  });
  it("never exports OAuth tokens", async () => {
    const all = Object.values(await exportAll(db)).join("\n");
    expect(all).not.toContain("SECRET-CIPHERTEXT");
  });
  it("produces a valid zip", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "zip-"));
    const file = path.join(dir, "b.zip");
    writeFileSync(file, await exportZip(db));
    const r = spawnSync("unzip", ["-t", file], { encoding: "utf8" });
    if (r.error) return; // unzip not installed: skip
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("No errors detected");
  });
});
