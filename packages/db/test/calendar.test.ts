import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, describe, expect, it } from "vitest";
import type { Database } from "../src/client";
import * as cal from "../src/calendar";
import * as schema from "../src/schema";

const here = path.dirname(fileURLToPath(import.meta.url));
let db: Database;
beforeAll(async () => {
  const d = drizzle(await PGlite.create(), { schema, casing: "snake_case" });
  await migrate(d, { migrationsFolder: path.join(here, "../drizzle") });
  db = d as unknown as Database;
});

const TZ = "America/New_York";
const at = (date: string, h: number, m = 0) => cal.zonedToUtc(date, h * 60 + m, TZ);

describe("time zones", () => {
  it("converts wall-clock time across the DST change", () => {
    expect(at("2026-03-07", 12).toISOString()).toBe("2026-03-07T17:00:00.000Z"); // EST
    expect(at("2026-03-09", 12).toISOString()).toBe("2026-03-09T16:00:00.000Z"); // EDT
    expect(at("2026-11-01", 0).toISOString()).toBe("2026-11-01T04:00:00.000Z");
    expect(cal.localDate(new Date("2026-10-15T02:00:00Z"), TZ)).toBe("2026-10-14");
    expect(cal.weekdayOf("2026-10-15", TZ)).toBe(4); // Thursday
  });
});

describe("no double booking", () => {
  it("refuses overlaps, buffers and travel time count, adjacent is fine, cancelled frees the time", async () => {
    const a = await cal.addAppointment(db, {
      title: "Wedding",
      startsAt: at("2027-05-01", 10),
      endsAt: at("2027-05-01", 12),
      bufferAfterMin: 30,
      travelMin: 30,
    });
    await expect(
      cal.addAppointment(db, { title: "Overlap", startsAt: at("2027-05-01", 11), endsAt: at("2027-05-01", 13) }),
    ).rejects.toThrow(/conflicts with "Wedding"/);
    // blocked until 12:00 + 30 (after) + 30 (travel) = 13:00
    await expect(
      cal.addAppointment(db, { title: "Too soon", startsAt: at("2027-05-01", 12, 45), endsAt: at("2027-05-01", 14) }),
    ).rejects.toThrow(/conflicts/);
    await cal.addAppointment(db, { title: "Fine", startsAt: at("2027-05-01", 13), endsAt: at("2027-05-01", 14) });
    await cal.cancelAppointment(db, a.id);
    await cal.addAppointment(db, { title: "Reuse", startsAt: at("2027-05-01", 10), endsAt: at("2027-05-01", 11) });
  });

  it("the database itself refuses an overlap that skips the application check", async () => {
    const t = at("2027-06-01", 9);
    const base = {
      title: "Raw",
      kind: "shoot" as const,
      status: "confirmed" as const,
      startsAt: t,
      endsAt: new Date(t.getTime() + 3600_000),
      blockedStart: t,
      blockedEnd: new Date(t.getTime() + 3600_000),
    };
    await db.insert(schema.appointments).values(base);
    await expect(db.insert(schema.appointments).values(base)).rejects.toThrow();
  });

  it("concurrent requests for the same slot: exactly one wins", async () => {
    const mk = (n: number) =>
      cal
        .addAppointment(db, { title: `Race ${n}`, startsAt: at("2027-07-01", 9), endsAt: at("2027-07-01", 10) })
        .then(() => "ok")
        .catch(() => "no");
    const results = await Promise.all([mk(1), mk(2), mk(3), mk(4)]);
    expect(results.filter((r) => r === "ok")).toHaveLength(1);
  });

  it("an expired deposit hold frees the time; a live hold blocks it", async () => {
    const now = new Date("2027-08-01T12:00:00Z");
    await cal.addAppointment(
      db,
      {
        title: "Held",
        status: "hold",
        startsAt: at("2027-08-10", 9),
        endsAt: at("2027-08-10", 10),
        holdUntil: new Date(now.getTime() + 30 * 60_000),
      },
      now,
    );
    await expect(
      cal.addAppointment(db, { title: "Blocked", startsAt: at("2027-08-10", 9), endsAt: at("2027-08-10", 10) }, now),
    ).rejects.toThrow();
    const later = new Date(now.getTime() + 31 * 60_000);
    await cal.addAppointment(
      db,
      { title: "Free now", startsAt: at("2027-08-10", 9), endsAt: at("2027-08-10", 10) },
      later,
    );
  });
});

describe("availability and slots", () => {
  it("offers slots inside weekly windows only, honours notice, blackouts, and existing appointments with buffers", async () => {
    // Mondays 10:00-14:00
    await cal.addRule(db, { weekday: 1, startMinute: 600, endMinute: 840 });
    const now = new Date("2027-09-01T12:00:00Z");
    const settings = cal.calendarSettingsSchema.parse({ minNoticeHours: 48, defaultBufferMin: 15, stepMin: 30 });
    const monday = "2027-09-13"; // a Monday
    const free = await cal.slotsForDate(db, monday, { durationMin: 60, now, settings });
    expect(free.map((s) => s.startsAt.toISOString())).toEqual(
      [10, 10.5, 11, 11.5, 12, 12.5, 13].map((h) => at(monday, Math.floor(h), (h % 1) * 60).toISOString()),
    );
    expect(await cal.slotsForDate(db, "2027-09-14", { durationMin: 60, now, settings })).toEqual([]); // Tuesday
    // too soon
    expect(await cal.slotsForDate(db, "2027-09-02", { durationMin: 60, now, settings })).toEqual([]);
    // an appointment 12:00-13:00 removes slots touching it plus the 15 minute buffers
    await cal.addAppointment(db, { title: "Booked", startsAt: at(monday, 12), endsAt: at(monday, 13) });
    const after = await cal.slotsForDate(db, monday, { durationMin: 60, now, settings });
    expect(after.map((s) => s.startsAt.toISOString())).toEqual(
      [10, 10.5].map((h) => at(monday, Math.floor(h), (h % 1) * 60).toISOString()),
    );
    // a blackout date removes the whole day
    await cal.addBlackout(db, "2027-09-20", "Holiday");
    expect(await cal.slotsForDate(db, "2027-09-20", { durationMin: 60, now, settings })).toEqual([]);
    // beyond the horizon
    const far = await cal.slotsForDate(db, "2029-01-01", { durationMin: 60, now, settings });
    expect(far).toEqual([]);
  });
});

describe("repeated availability windows", () => {
  it("never offer the same start time twice", async () => {
    // Tuesdays 10:00-12:00 added twice, plus an overlapping 11:00-13:00 window
    for (const [a, b] of [
      [600, 720],
      [600, 720],
      [660, 780],
    ])
      await cal.addRule(db, { weekday: 2, startMinute: a, endMinute: b });
    const now = new Date("2028-01-01T12:00:00Z");
    const settings = cal.calendarSettingsSchema.parse({ minNoticeHours: 0, defaultBufferMin: 0, stepMin: 30 });
    const slots = await cal.slotsForDate(db, "2028-01-11", { durationMin: 60, now, settings }); // a Tuesday
    const starts = slots.map((s) => s.startsAt.toISOString());
    expect(new Set(starts).size).toBe(starts.length);
    expect(starts).toEqual([...starts].sort());
    expect(starts).toHaveLength(5); // 10:00 10:30 11:00 11:30 12:00
  });
});

describe("mini-sessions, deposit confirmation, waitlist", () => {
  it("creates consecutive open slots and only one booker wins each", async () => {
    const made = await cal.createMinislots(db, {
      date: "2027-10-24",
      startMinute: 600,
      count: 3,
      lengthMin: 20,
      label: "Fall minis",
    });
    expect(made).toHaveLength(3);
    const [client] = await db.insert(schema.studioClients).values({ name: "M", email: "m@example.com" }).returning();
    const [other] = await db.insert(schema.studioClients).values({ name: "N", email: "n@example.com" }).returning();
    const got = await cal.bookMinislot(db, made[0].id, { clientId: client.id });
    expect(got.status).toBe("confirmed");
    await expect(cal.bookMinislot(db, made[0].id, { clientId: other.id })).rejects.toThrow(/just taken/);
    const open = await cal.openMinislots(db, new Date("2027-10-01"));
    expect(open.filter((o) => o.groupLabel === "Fall minis")).toHaveLength(2);
  });

  it("a paid deposit confirms the hold and books the job", async () => {
    const [client] = await db.insert(schema.studioClients).values({ name: "D", email: "d@example.com" }).returning();
    const [job] = await db.insert(schema.studioJobs).values({ clientId: client.id, title: "Deposit job" }).returning();
    const [inv] = await db
      .insert(schema.studioInvoices)
      .values({ jobId: job.id, number: "T-1", lines: [], totalCents: 5000, tokenHash: "x" } as never)
      .returning();
    await cal.addAppointment(db, {
      title: "Deposit shoot",
      status: "hold",
      startsAt: at("2027-11-10", 9),
      endsAt: at("2027-11-10", 11),
      jobId: job.id,
      invoiceId: inv.id,
      holdUntil: new Date(Date.now() + 3600_000),
    });
    const confirmed = await cal.confirmForInvoice(db, inv.id);
    expect(confirmed).toHaveLength(1);
    const [j] = await db.select().from(schema.studioJobs);
    expect(j.status).toBe("booked");
  });

  it("the waitlist de-duplicates and is cleared once notified", async () => {
    const a = await cal.joinWaitlist(db, { name: "Wanda", email: "W@Example.com", wanted: "Fall minis" });
    const b = await cal.joinWaitlist(db, { name: "Wanda", email: "w@example.com", wanted: "Fall minis" });
    expect(b.id).toBe(a.id);
    expect(await cal.waitingFor(db, ["Fall minis"])).toHaveLength(1);
    await cal.markWaitlistNotified(db, [a.id]);
    expect(await cal.waitingFor(db, ["Fall minis"])).toHaveLength(0);
    await expect(cal.joinWaitlist(db, { name: "Wanda", email: "bad", wanted: "x" })).rejects.toThrow();
  });
});

describe(".ics feed", () => {
  it("is valid iCalendar with escaping, folding and CRLF", () => {
    const text = cal.icsCalendar(
      [
        {
          id: "abc",
          title: "Wedding, Smith; Jones",
          startsAt: new Date("2027-05-01T14:00:00Z"),
          endsAt: new Date("2027-05-01T16:00:00Z"),
          location: "Brooklyn, NY",
          notes: `${"long note ".repeat(20)}\nsecond line`,
          status: "confirmed",
          kind: "shoot",
        },
        {
          id: "gone",
          title: "Cancelled",
          startsAt: new Date(),
          endsAt: new Date(),
          status: "cancelled",
          kind: "shoot",
        },
      ],
      { name: "Studio", now: new Date("2027-01-01T00:00:00Z") },
    );
    expect(text.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(text.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(text).toContain("SUMMARY:Wedding\\, Smith; Jones");
    expect(text).toContain("DTSTART:20270501T140000Z");
    expect(text).not.toContain("Cancelled");
    for (const l of text.split("\r\n")) expect(Buffer.byteLength(l)).toBeLessThanOrEqual(75);
    expect(text).toContain("\r\n "); // folded
    expect(text).toContain("\\n"); // newline escaped
  });
});
