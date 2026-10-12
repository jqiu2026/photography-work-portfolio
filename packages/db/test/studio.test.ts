import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, describe, expect, it } from "vitest";
import type { Database } from "../src/client";
import * as s from "../src/schema";
import * as st from "../src/studio";
import { hashPasscode, hashToken, invoiceNumber, newToken, verifyPasscode } from "../src/studio-crypto";

const here = path.dirname(fileURLToPath(import.meta.url));
let db: Database;
const now = new Date("2026-10-12T12:00:00Z");

beforeAll(async () => {
  const client = await PGlite.create();
  const d = drizzle(client, { schema: s, casing: "snake_case" });
  await migrate(d, { migrationsFolder: path.join(here, "../drizzle") });
  db = d as unknown as Database;
});

async function seedJob(tag: string) {
  const c = await st.createClient(db, { name: `Client ${tag}`, email: `${tag}@example.test` });
  const j = await st.createJob(db, { clientId: c.id, title: `Job ${tag}`, date: "2026-11-01", feeCents: 50000 });
  return { c, j };
}

describe("crypto helpers", () => {
  it("tokens are random, only the hash is stored, and passcodes verify case- and space-insensitively", async () => {
    const a = newToken();
    const b = newToken();
    expect(a.token).not.toBe(b.token);
    expect(hashToken(a.token)).toBe(a.hash);
    const h = await hashPasscode("Sample Pass-1");
    expect(h).not.toContain("sample");
    expect(await verifyPasscode(" sample pass-1 ", h)).toBe(true);
    expect(await verifyPasscode("other", h)).toBe(false);
    expect(await verifyPasscode("x", null)).toBe(false);
    expect(invoiceNumber(2026, 7)).toBe("2026-0007");
  });
});

describe("clients, jobs, bookings", () => {
  it("validates, normalises email, and refuses a duplicate email", async () => {
    await expect(st.createClient(db, { name: "A", email: "x" })).rejects.toThrow(/name/);
    await expect(st.createClient(db, { name: "Ann", email: "bad" })).rejects.toThrow(/email/);
    const c = await st.createClient(db, { name: "Ann Example", email: "  Ann@Example.TEST " });
    expect(c.email).toBe("ann@example.test");
    await expect(st.createClient(db, { name: "Ann Two", email: "ann@example.test" })).rejects.toThrow(/already exists/);
  });
  it("walks a job through every step and stops at paid", async () => {
    const { j } = await seedJob("steps");
    let cur = j;
    for (let i = 1; i < st.JOB_STEPS.length; i++) cur = await st.advanceJob(db, j.id);
    expect(cur.status).toBe("paid");
    expect((await st.advanceJob(db, j.id)).status).toBe("paid");
  });
  it("job validation: client must exist, fee in whole cents", async () => {
    await expect(st.createJob(db, { clientId: "00000000-0000-0000-0000-000000000000", title: "x y" })).rejects.toThrow(
      /client/,
    );
    const { c } = await seedJob("fee");
    await expect(st.createJob(db, { clientId: c.id, title: "Bad fee", feeCents: 10.5 })).rejects.toThrow(/cents/);
  });
  it("converts a booking into a client once and reuses an existing client", async () => {
    const b = await st.addBooking(db, {
      name: "Visitor One",
      email: "visitor@example.test",
      message: "A small event next month",
    });
    const c1 = await st.convertBooking(db, b.id);
    const b2 = await st.addBooking(db, {
      name: "Visitor One",
      email: "Visitor@example.test",
      message: "One more question",
    });
    const c2 = await st.convertBooking(db, b2.id);
    expect(c2.id).toBe(c1.id);
    await expect(st.addBooking(db, { name: "V", email: "x", message: "hi" })).rejects.toThrow();
  });
});

describe("galleries and favourites", () => {
  it("passcodes are hashed, unique, length-checked, and open only published unexpired galleries", async () => {
    const { j } = await seedJob("gal");
    await expect(st.createGallery(db, { jobId: j.id, passcode: "short" })).rejects.toThrow(/6 characters/);
    const g = await st.createGallery(db, { jobId: j.id, passcode: "Gallery-Pass-1" });
    expect(g.passcodeHash).not.toMatch(/gallery/i);
    await expect(st.createGallery(db, { jobId: j.id, passcode: "gallery-pass-1" })).rejects.toThrow(/already used/);
    expect(await st.openGalleryWithPasscode(db, "gallery-pass-1")).toBeNull(); // still a draft
    await st.publishGallery(db, g.id);
    expect((await st.openGalleryWithPasscode(db, " GALLERY-PASS-1 "))?.id).toBe(g.id);
    expect(await st.openGalleryWithPasscode(db, "wrong-code")).toBeNull();
    await db
      .update(s.studioGalleries)
      .set({ expiresAt: new Date("2026-01-01") })
      .where(eq(s.studioGalleries.id, g.id));
    expect(await st.openGalleryWithPasscode(db, "gallery-pass-1", now)).toBeNull(); // expired
  });
  it("favourites toggle and only work for photographs in the gallery", async () => {
    const { j } = await seedJob("fav");
    const [m1] = await db
      .insert(s.media)
      .values({ filename: "a.jpg", mime: "image/jpeg", originalKey: "k/a" })
      .returning();
    const [m2] = await db
      .insert(s.media)
      .values({ filename: "b.jpg", mime: "image/jpeg", originalKey: "k/b" })
      .returning();
    const g = await st.createGallery(db, { jobId: j.id, passcode: "fav-pass-77", mediaIds: [m1.id] });
    expect(await st.toggleFavorite(db, g.id, m1.id)).toEqual([m1.id]);
    expect(await st.toggleFavorite(db, g.id, m1.id)).toEqual([]);
    await expect(st.toggleFavorite(db, g.id, m2.id)).rejects.toThrow(/not in this gallery/);
    expect((await st.galleryItems(db, g.id)).map((x) => x.mediaId)).toEqual([m1.id]);
  });
});

describe("contracts", () => {
  it("send, view, sign once with name and agreement, and record the document hash", async () => {
    const { j } = await seedJob("con");
    const k = await st.createContract(db, { jobId: j.id, title: "Agreement", body: "Terms. Terms." });
    expect(await st.contractByToken(db, "nope")).toBeNull();
    const { token } = await st.sendContract(db, k.id, now);
    expect((await st.contractByToken(db, token, now))?.status).toBe("viewed");
    await expect(st.signContract(db, token, { signerName: "A", agree: true })).rejects.toThrow(/full name/);
    await expect(st.signContract(db, token, { signerName: "Sample Client", agree: false })).rejects.toThrow(/agree/);
    const signed = await st.signContract(
      db,
      token,
      { signerName: "  Sample Client ", agree: true, ipHash: "h", userAgent: "UA" },
      now,
    );
    expect(signed).toMatchObject({ status: "signed", signerName: "Sample Client", signerIpHash: "h" });
    expect(signed.documentSha256).toMatch(/^[0-9a-f]{64}$/);
    await expect(st.signContract(db, token, { signerName: "Sample Client", agree: true })).rejects.toThrow(
      /already signed/,
    );
    await expect(st.sendContract(db, k.id)).rejects.toThrow(/already signed/);
  });
});

describe("invoices and payments", () => {
  it("numbers invoices per year, totals in cents, and only sends non-final invoices", async () => {
    const { j } = await seedJob("inv");
    await expect(st.createInvoice(db, { jobId: j.id, lines: [{ description: "", amountCents: 0 }] })).rejects.toThrow(
      /at least one/,
    );
    const a = await st.createInvoice(
      db,
      {
        jobId: j.id,
        lines: [
          { description: "Coverage", amountCents: 30000 },
          { description: "Prints", amountCents: 5000 },
        ],
      },
      undefined,
      now,
    );
    const b = await st.createInvoice(
      db,
      { jobId: j.id, lines: [{ description: "Extra", amountCents: 1000 }] },
      undefined,
      now,
    );
    expect(a.totalCents).toBe(35000);
    expect(a.number).toMatch(/^2026-\d{4}$/);
    expect(Number(b.number.split("-")[1])).toBe(Number(a.number.split("-")[1]) + 1);
    const { token } = await st.sendInvoice(db, a.id, now);
    expect((await st.invoiceByToken(db, token))?.id).toBe(a.id);
    expect(await st.invoiceByToken(db, "nope")).toBeNull();
  });
  it("records payments idempotently, moves the invoice to partial then paid, and the job to paid when all invoices are paid", async () => {
    const { j } = await seedJob("pay");
    const inv = await st.createInvoice(
      db,
      { jobId: j.id, lines: [{ description: "Coverage", amountCents: 20000 }] },
      undefined,
      now,
    );
    await st.sendInvoice(db, inv.id, now);
    const p1 = await st.recordPayment(
      db,
      { invoiceId: inv.id, provider: "mock", providerRef: "pi_1", amountCents: 5000, status: "succeeded" },
      now,
    );
    expect(p1.duplicate).toBe(false);
    expect((await db.select().from(s.studioInvoices).where(eq(s.studioInvoices.id, inv.id)))[0].status).toBe("partial");
    const dup = await st.recordPayment(
      db,
      { invoiceId: inv.id, provider: "mock", providerRef: "pi_1", amountCents: 5000, status: "succeeded" },
      now,
    );
    expect(dup.duplicate).toBe(true);
    await st.recordPayment(
      db,
      { invoiceId: inv.id, provider: "mock", providerRef: "pi_2", amountCents: 15000, status: "succeeded" },
      now,
    );
    const [paid] = await db.select().from(s.studioInvoices).where(eq(s.studioInvoices.id, inv.id));
    expect(paid.status).toBe("paid");
    expect((await db.select().from(s.studioJobs).where(eq(s.studioJobs.id, j.id)))[0].status).toBe("paid");
    // a failed payment changes nothing
    const f = await st.recordPayment(
      db,
      { invoiceId: inv.id, provider: "mock", providerRef: "pi_3", amountCents: 1, status: "failed" },
      now,
    );
    expect(f.duplicate).toBe(false);
  });
  it("webhook events are claimed once", async () => {
    expect(await st.claimWebhookEvent(db, "evt_1", "stripe", "payment_intent.succeeded")).toBe(true);
    expect(await st.claimWebhookEvent(db, "evt_1", "stripe", "payment_intent.succeeded")).toBe(false);
  });
});
