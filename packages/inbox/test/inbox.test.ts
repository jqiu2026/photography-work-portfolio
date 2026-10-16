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

describe("booking inquiries", () => {
  const base = {
    name: "Grace Hopper",
    email: "Grace@Example.com",
    shootType: "performance",
    eventDate: "2027-03-01",
    location: "Brooklyn",
    message: "A spring concert with about 120 people. Looking for coverage and a gallery.",
    consent: true,
  };
  it("stores a scored lead and logs a confirmation and an owner notification", async () => {
    const { submitInquiry } = await import("../src");
    const r = await submitInquiry(db, base, { ipHash: "iq1", baseUrl: "https://photo.test" });
    expect(r.ok).toBe(true);
    const leads = await db.select().from(schema.studioBookings);
    const lead = leads.find((l) => l.email === "grace@example.com");
    expect(lead).toMatchObject({ shootType: "performance", location: "Brooklyn", status: "new" });
    expect(lead?.score).toBeGreaterThan(30);
    const mails = await db.select().from(schema.emailLog);
    const mine = mails.filter((m) => m.relatedId === lead?.id);
    expect(mine.map((m) => m.kind).sort()).toEqual(["inquiry-owner", "inquiry-received"]);
    expect(mine.find((m) => m.kind === "inquiry-received")?.toEmail).toBe("grace@example.com");
    expect(mine.find((m) => m.kind === "inquiry-owner")?.bodyText).toContain("https://photo.test/studio/bookings");
  });
  it("needs consent and valid fields, ignores bots, and archives link spam without emailing", async () => {
    const { submitInquiry } = await import("../src");
    const bad = await submitInquiry(db, { ...base, consent: false }, { ipHash: "iq2" });
    expect(bad).toMatchObject({ ok: false, status: 400 });
    expect((bad as { fieldErrors?: Record<string, string> }).fieldErrors?.consent).toBeTruthy();
    const before = (await db.select().from(schema.studioBookings)).length;
    expect(await submitInquiry(db, { ...base, website: "http://bot" }, { ipHash: "iq3" })).toEqual({ ok: true });
    expect((await db.select().from(schema.studioBookings)).length).toBe(before);
    const spam = await submitInquiry(
      db,
      { ...base, email: "spam@example.com", message: "buy http://a.co http://b.co http://c.co now" },
      { ipHash: "iq4" },
    );
    expect(spam.ok).toBe(true);
    const row = (await db.select().from(schema.studioBookings)).find((l) => l.email === "spam@example.com");
    expect(row?.status).toBe("archived");
    expect((await db.select().from(schema.emailLog)).filter((m) => m.relatedId === row?.id)).toHaveLength(0);
  });
  it("rate limits per address", async () => {
    const { submitInquiry } = await import("../src");
    let last: Awaited<ReturnType<typeof submitInquiry>> = { ok: true };
    for (let i = 0; i < 7; i++)
      last = await submitInquiry(db, { ...base, email: `r${i}@example.com` }, { ipHash: "iq5" });
    expect(last).toMatchObject({ ok: false, status: 429 });
  });
});
