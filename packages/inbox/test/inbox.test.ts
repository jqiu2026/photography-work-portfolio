import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { schema } from "@jerryqiu/db";
import type { Database } from "@jerryqiu/db";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, describe, expect, it } from "vitest";
import { deleteContactData, looksLikeSpam, oneLine, submitContact } from "../src";

const here = path.dirname(fileURLToPath(import.meta.url));
let db: Database;
beforeAll(async () => {
  const client = await PGlite.create();
  const d = drizzle(client, { schema, casing: "snake_case" });
  await migrate(d, { migrationsFolder: path.join(here, "../../db/drizzle") });
  db = d as unknown as Database;
});

const good = { name: "Ada", email: "Ada@Example.com", topic: "General", message: "Hello there, a real question." };

describe("contact submissions", () => {
  it("stores a valid message with a lowercased email", async () => {
    expect(await submitContact(db, good, { site: "hub", ipHash: "ip1" })).toEqual({ ok: true });
    const rows = await db.select().from(schema.inboxMessages);
    expect(rows[0].email).toBe("ada@example.com");
    expect(rows[0].status).toBe("new");
  });
  it("silently drops honeypot hits without storing", async () => {
    const before = (await db.select().from(schema.inboxMessages)).length;
    expect(await submitContact(db, { ...good, website: "http://spam" }, { site: "hub", ipHash: "ip2" })).toEqual({
      ok: true,
    });
    expect((await db.select().from(schema.inboxMessages)).length).toBe(before);
  });
  it("reports field errors", async () => {
    const r = await submitContact(db, { ...good, email: "nope", message: "x" }, { site: "hub", ipHash: "ip3" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.fieldErrors ?? {})).toEqual(expect.arrayContaining(["email", "message"]));
  });
  it("rate limits one visitor after five messages", async () => {
    let last: Awaited<ReturnType<typeof submitContact>> = { ok: true };
    for (let i = 0; i < 6; i++) last = await submitContact(db, good, { site: "hub", ipHash: "flood" });
    expect(last).toMatchObject({ ok: false, status: 429 });
  });
  it("stores link-heavy messages as spam", async () => {
    const msg = "buy http://a.com http://b.com http://c.com now";
    expect(looksLikeSpam({ message: msg, name: "x" })).toBe(true);
    await submitContact(db, { ...good, message: msg }, { site: "hub", ipHash: "ip5" });
    const spam = (await db.select().from(schema.inboxMessages)).filter((m) => m.status === "spam");
    expect(spam.length).toBe(1);
  });
  it("strips newlines so mail headers cannot be injected", () => {
    expect(oneLine("a\r\nBcc: evil@x.com")).toBe("a Bcc: evil@x.com");
  });
  it("deletes all data for an address, case-insensitively", async () => {
    expect(await deleteContactData(db, "ADA@example.com")).toBeGreaterThan(0);
    const left = (await db.select().from(schema.inboxMessages)).filter((m) => m.email === "ada@example.com");
    expect(left.length).toBe(0);
  });
});
