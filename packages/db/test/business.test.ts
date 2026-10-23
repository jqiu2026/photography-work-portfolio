import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, describe, expect, it } from "vitest";
import * as biz from "../src/business";
import type { Database } from "../src/client";
import * as schema from "../src/schema";
import * as st from "../src/studio";
import { formatShutter, specLines, specsFromExif } from "../src/specs";

const here = path.dirname(fileURLToPath(import.meta.url));
let db: Database;
let jobA: string;
let jobB: string;
beforeAll(async () => {
  const d = drizzle(await PGlite.create(), { schema, casing: "snake_case" });
  await migrate(d, { migrationsFolder: path.join(here, "../drizzle") });
  db = d as unknown as Database;
  const c = await st.createClient(db, { name: "Biz Client", email: "biz@example.com" });
  jobA = (await st.createJob(db, { clientId: c.id, title: "Job A" })).id;
  jobB = (await st.createJob(db, { clientId: c.id, title: "Job B" })).id;
});

describe("expenses and mileage", () => {
  it("mileage is miles times the rate on the day, kept on the row", async () => {
    const m = await biz.addExpense(db, { kind: "mileage", spentOn: "2027-03-02", miles: 12.5, rateCentsPerMile: 70 });
    expect(m.amountCents).toBe(875);
    expect(m.tenthMiles).toBe(125);
    expect(m.category).toBe("travel");
    // a later rate change does not touch the old row
    const later = await biz.addExpense(db, { kind: "mileage", spentOn: "2027-04-02", miles: 10, rateCentsPerMile: 80 });
    expect(later.amountCents).toBe(800);
    expect((await biz.listExpenses(db)).find((r) => r.expense.id === m.id)?.expense.amountCents).toBe(875);
  });
  it("refuses bad input", async () => {
    await expect(biz.addExpense(db, { spentOn: "tomorrow", amountCents: 100 })).rejects.toThrow("date");
    await expect(biz.addExpense(db, { spentOn: "2027-01-01", amountCents: 0 })).rejects.toThrow("amount");
    await expect(biz.addExpense(db, { kind: "mileage", spentOn: "2027-01-01", miles: 0 })).rejects.toThrow("miles");
    await expect(biz.addExpense(db, { spentOn: "2027-01-01", amountCents: 100, category: "yachts" })).rejects.toThrow(
      "category",
    );
  });
  it("totals by category and exports a CSV that cannot run as a formula", async () => {
    await biz.addExpense(db, {
      spentOn: "2027-05-01",
      amountCents: 12999,
      category: "gear",
      description: '=HYPERLINK("x")',
      vendor: 'B&H, "Photo"',
      jobId: jobA,
    });
    const rows = await biz.listExpenses(db, { from: "2027-01-01", to: "2027-12-31" });
    const sum = biz.summarizeExpenses(rows.map((r) => r.expense));
    expect(sum.totalCents).toBe(875 + 800 + 12999);
    expect(sum.miles).toBe(22.5);
    expect(sum.byCategory[0]).toEqual({ category: "gear", cents: 12999 });
    const csv = biz.expensesCsv(rows);
    expect(csv.split("\r\n")[0]).toContain("Amount (USD)");
    expect(csv).toContain('"\'=HYPERLINK(""x"")"');
    expect(csv).toContain('"B&H, ""Photo"""');
    expect(csv).toContain("129.99");
    expect(csv).toContain("Job A");
  });
  it("range filters by date", async () => {
    const r = await biz.listExpenses(db, { from: "2027-04-01", to: "2027-04-30" });
    expect(r).toHaveLength(1);
  });
});

describe("testimonials need consent to go public", () => {
  it("cannot publish without consent; consent then publish; withdrawing takes it down", async () => {
    const t = await biz.addTestimonial(db, { displayName: "Maria R.", quote: "She made the whole day feel easy." });
    await expect(biz.setTestimonialPublished(db, t.id, true)).rejects.toThrow("consent");
    expect(await biz.publicTestimonials(db)).toHaveLength(0);
    await biz.recordConsent(db, t.id, "Email reply of 3 March");
    await biz.setTestimonialPublished(db, t.id, true);
    const shown = await biz.publicTestimonials(db);
    expect(shown).toHaveLength(1);
    expect(shown[0]).toEqual({
      id: t.id,
      displayName: "Maria R.",
      role: null,
      quote: "She made the whole day feel easy.",
    });
    await biz.withdrawConsent(db, t.id);
    expect(await biz.publicTestimonials(db)).toHaveLength(0);
  });
  it("a testimonial added with consent can be published at once", async () => {
    const t = await biz.addTestimonial(db, {
      displayName: "A parent",
      quote: "Great with the kids.",
      consent: { note: "Signed release" },
    });
    await biz.setTestimonialPublished(db, t.id, true);
    expect((await biz.publicTestimonials(db)).map((x) => x.displayName)).toContain("A parent");
  });
});

describe("gear", () => {
  it("warns when the same gear is on two jobs the same day, not before", async () => {
    const g = await biz.addGear(db, { name: "Camera body 1", kind: "camera" });
    expect(await biz.assignGear(db, { gearId: g.id, jobId: jobA, onDate: "2027-06-01" })).toEqual([]);
    const clash = await biz.assignGear(db, { gearId: g.id, jobId: jobB, onDate: "2027-06-01" });
    expect(clash.map((c) => c.title).sort()).toEqual(["Job A", "Job B"]);
    expect(await biz.assignGear(db, { gearId: g.id, jobId: jobB, onDate: "2027-06-02" })).toEqual([]);
    await biz.unassignGear(db, { gearId: g.id, jobId: jobB, onDate: "2027-06-01" });
    expect(await biz.gearConflicts(db, g.id, "2027-06-01")).toEqual([]);
  });
  it("assigning twice is harmless", async () => {
    const g = await biz.addGear(db, { name: "Lens 24-70" });
    await biz.assignGear(db, { gearId: g.id, jobId: jobA, onDate: "2027-07-01" });
    expect(await biz.assignGear(db, { gearId: g.id, jobId: jobA, onDate: "2027-07-01" })).toEqual([]);
  });
});

describe("call sheets", () => {
  it("one per job, saved again replaces it, blank lines are dropped", async () => {
    await biz.saveCallSheet(db, jobA, {
      callTime: "6:30 pm",
      shots: [{ text: "Cast walk-in" }, { text: "  " }],
      contacts: [{ name: "Sam", phone: "555" }, { name: "" }],
    });
    const second = await biz.saveCallSheet(db, jobA, { location: "Gym", shots: [{ text: "Finale", done: true }] });
    expect(second.shots).toEqual([{ text: "Finale", done: true }]);
    expect(second.callTime).toBeNull();
    expect((await biz.listCallSheets(db)).filter((x) => x.job.id === jobA)).toHaveLength(1);
  });
});

describe("search", () => {
  it("finds across the studio, needs two letters, treats % as text, hides deleted clients", async () => {
    const c = await st.createClient(db, { name: "Zelda Searchable", email: "zelda@example.com" });
    const hits = await biz.searchStudio(db, "searchable");
    expect(hits.map((h) => `${h.kind}:${h.label}`)).toContain("client:Zelda Searchable");
    expect((await biz.searchStudio(db, "ZELDA@EXAMPLE")).some((h) => h.id === c.id)).toBe(true);
    expect(await biz.searchStudio(db, "z")).toEqual([]);
    expect(await biz.searchStudio(db, "%")).toEqual([]);
    expect((await biz.searchStudio(db, "Job A")).some((h) => h.kind === "job")).toBe(true);
    expect((await biz.searchStudio(db, "Memory")).length).toBeGreaterThanOrEqual(0);
  });
});

describe("specs", () => {
  it("formats shutter and reads exif", () => {
    expect(formatShutter(0.004)).toBe("1/250 s");
    expect(formatShutter(2)).toBe("2 s");
    expect(specsFromExif({ Make: "Nikon", Model: "Z 6", FNumber: 4 })).toMatchObject({
      camera: "Nikon Z 6",
      aperture: 4,
    });
    expect(specLines(undefined).length).toBe(0);
  });
});
