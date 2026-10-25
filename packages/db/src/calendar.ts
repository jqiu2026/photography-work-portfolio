import { and, asc, eq, gte, inArray, isNull, lt, lte, ne, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "./client";
import * as s from "./schema";
import { StudioError } from "./errors";
import { newToken } from "./studio-crypto";

/**
 * Calendar and booking: weekly availability, blackout dates, buffers and travel time, no double booking (a Postgres
 * EXCLUDE constraint is the last line of defence), mini-session slots, deposit holds, a waitlist and an `.ics` feed.
 * All wall-clock reasoning happens in the studio time zone (`calendar.timezone`); stored times are UTC.
 */

/* ---------- settings ---------- */
export const calendarSettingsSchema = z.object({
  timezone: z.string().default("America/New_York"),
  defaultBufferMin: z.number().int().min(0).max(240).default(15),
  minNoticeHours: z
    .number()
    .int()
    .min(0)
    .max(24 * 60)
    .default(48),
  maxAdvanceDays: z.number().int().min(1).max(730).default(180),
  stepMin: z.number().int().min(5).max(120).default(30),
  holdMinutes: z.number().int().min(5).max(1440).default(30),
  /** SAMPLE placeholder (Q61): the owner sets the real deposit. */
  depositCents: z.number().int().min(0).default(5000),
  durations: z
    .object({
      consult: z.number().int().default(30),
      shoot: z.number().int().default(120),
      minislot: z.number().int().default(20),
    })
    .default({ consult: 30, shoot: 120, minislot: 20 }),
  icsToken: z.string().optional(),
});
export type CalendarSettings = z.infer<typeof calendarSettingsSchema>;

export async function getStudioSetting<T>(db: Database, key: string, schema: z.ZodType<T>): Promise<T> {
  const [row] = await db.select().from(s.studioSettings).where(eq(s.studioSettings.key, key));
  return schema.parse(row?.value ?? {});
}
export async function setStudioSetting(db: Database, key: string, value: unknown) {
  await db
    .insert(s.studioSettings)
    .values({ key, value })
    .onConflictDoUpdate({ target: s.studioSettings.key, set: { value, updatedAt: new Date() } });
}
export const getCalendarSettings = (db: Database) => getStudioSetting(db, "calendar", calendarSettingsSchema);
export async function saveCalendarSettings(db: Database, patch: Partial<CalendarSettings>) {
  const next = calendarSettingsSchema.parse({ ...(await getCalendarSettings(db)), ...patch });
  await setStudioSetting(db, "calendar", next);
  return next;
}
/** The secret in the owner's calendar feed URL. Created on first use. */
export async function icsToken(db: Database): Promise<string> {
  const c = await getCalendarSettings(db);
  if (c.icsToken) return c.icsToken;
  const token = newToken().token;
  await saveCalendarSettings(db, { icsToken: token });
  return token;
}

/* ---------- time zones ---------- */
type Parts = { y: number; m: number; d: number; minute: number; weekday: number };
function partsIn(date: Date, tz: string): Parts {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
  }).formatToParts(date);
  const g = (t: string) => f.find((p) => p.type === t)?.value ?? "0";
  return {
    y: +g("year"),
    m: +g("month"),
    d: +g("day"),
    minute: +g("hour") * 60 + +g("minute"),
    weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(g("weekday")),
  };
}
export function localDate(date: Date, tz: string): string {
  const p = partsIn(date, tz);
  return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}
/** The UTC instant of `date` (YYYY-MM-DD) at `minute` minutes after local midnight in `tz`. DST-safe. */
export function zonedToUtc(date: string, minute: number, tz: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  let guess = Date.UTC(y, m - 1, d, 0, minute);
  for (let i = 0; i < 3; i++) {
    const p = partsIn(new Date(guess), tz);
    const have = Date.UTC(p.y, p.m - 1, p.d, 0, p.minute);
    const want = Date.UTC(y, m - 1, d, 0, minute);
    if (have === want) break;
    guess += want - have;
  }
  return new Date(guess);
}
export const weekdayOf = (date: string, tz: string) => partsIn(zonedToUtc(date, 12 * 60, tz), tz).weekday;

/* ---------- appointments ---------- */
export type AppointmentInput = {
  kind?: "shoot" | "consult" | "minislot" | "block";
  status?: "open" | "hold" | "confirmed";
  title: string;
  startsAt: Date;
  endsAt: Date;
  bufferBeforeMin?: number;
  bufferAfterMin?: number;
  travelMin?: number;
  location?: string;
  notes?: string;
  jobId?: string | null;
  clientId?: string | null;
  bookingId?: string | null;
  invoiceId?: string | null;
  groupLabel?: string;
  holdUntil?: Date | null;
};

export const blockedRange = (a: {
  startsAt: Date;
  endsAt: Date;
  bufferBeforeMin?: number;
  bufferAfterMin?: number;
  travelMin?: number;
}) => ({
  start: new Date(a.startsAt.getTime() - ((a.bufferBeforeMin ?? 0) + (a.travelMin ?? 0)) * 60_000),
  end: new Date(a.endsAt.getTime() + ((a.bufferAfterMin ?? 0) + (a.travelMin ?? 0)) * 60_000),
});

/** Turns lapsed deposit holds back into free time. */
export async function releaseExpiredHolds(db: Database, now = new Date()) {
  await db
    .update(s.appointments)
    .set({ status: "cancelled", updatedAt: now })
    .where(and(eq(s.appointments.status, "hold"), lt(s.appointments.holdUntil, now)));
}

export async function findConflicts(db: Database, range: { start: Date; end: Date }, excludeId?: string) {
  const rows = await db
    .select()
    .from(s.appointments)
    .where(
      and(
        ne(s.appointments.status, "cancelled"),
        lt(s.appointments.blockedStart, range.end),
        sql`${s.appointments.blockedEnd} > ${range.start}`,
        excludeId ? ne(s.appointments.id, excludeId) : undefined,
      ),
    )
    .orderBy(asc(s.appointments.startsAt));
  return rows;
}

const isExclusion = (e: unknown) => {
  const x = e as { code?: string; cause?: { code?: string }; message?: string };
  return x?.code === "23P01" || x?.cause?.code === "23P01" || /appointments_no_overlap/.test(x?.message ?? "");
};

export async function addAppointment(db: Database, input: AppointmentInput, now = new Date()) {
  if (input.title.trim().length < 2) throw new StudioError("Give the appointment a title.");
  if (!(input.endsAt > input.startsAt)) throw new StudioError("The end must be after the start.");
  const b = blockedRange(input);
  await releaseExpiredHolds(db, now);
  const clash = await findConflicts(db, b);
  if (clash.length)
    throw new StudioError(`That time conflicts with "${clash[0].title}" (buffers and travel time included).`);
  try {
    const [row] = await db
      .insert(s.appointments)
      .values({
        kind: input.kind ?? "shoot",
        status: input.status ?? "confirmed",
        title: input.title.trim().slice(0, 160),
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        bufferBeforeMin: input.bufferBeforeMin ?? 0,
        bufferAfterMin: input.bufferAfterMin ?? 0,
        travelMin: input.travelMin ?? 0,
        blockedStart: b.start,
        blockedEnd: b.end,
        location: input.location?.trim() || null,
        notes: input.notes?.trim() || null,
        jobId: input.jobId ?? null,
        clientId: input.clientId ?? null,
        bookingId: input.bookingId ?? null,
        invoiceId: input.invoiceId ?? null,
        groupLabel: input.groupLabel ?? null,
        holdUntil: input.holdUntil ?? null,
      })
      .returning();
    return row;
  } catch (error) {
    if (isExclusion(error)) throw new StudioError("That time was just taken. Pick another.");
    throw error;
  }
}

/** Moves or edits an appointment; the same clash rules apply, ignoring the appointment itself. */
export async function updateAppointment(db: Database, id: string, input: AppointmentInput, now = new Date()) {
  if (input.title.trim().length < 2) throw new StudioError("Give the appointment a title.");
  if (!(input.endsAt > input.startsAt)) throw new StudioError("The end must be after the start.");
  const b = blockedRange(input);
  await releaseExpiredHolds(db, now);
  const clash = await findConflicts(db, b, id);
  if (clash.length)
    throw new StudioError(`That time conflicts with "${clash[0].title}" (buffers and travel time included).`);
  try {
    const rows = await db
      .update(s.appointments)
      .set({
        kind: input.kind ?? "shoot",
        title: input.title.trim().slice(0, 160),
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        bufferBeforeMin: input.bufferBeforeMin ?? 0,
        bufferAfterMin: input.bufferAfterMin ?? 0,
        travelMin: input.travelMin ?? 0,
        blockedStart: b.start,
        blockedEnd: b.end,
        location: input.location?.trim() || null,
        notes: input.notes?.trim().slice(0, 2000) || null,
        jobId: input.jobId ?? null,
        updatedAt: now,
      })
      .where(eq(s.appointments.id, id))
      .returning();
    if (!rows.length) throw new StudioError("Unknown appointment.");
    return rows[0];
  } catch (error) {
    if (isExclusion(error)) throw new StudioError("That time was just taken. Pick another.");
    throw error;
  }
}

export async function cancelAppointment(db: Database, id: string, now = new Date()) {
  const [row] = await db
    .update(s.appointments)
    .set({ status: "cancelled", updatedAt: now })
    .where(eq(s.appointments.id, id))
    .returning();
  if (!row) throw new StudioError("Unknown appointment.");
  return row;
}

export async function listAppointments(db: Database, from: Date, to: Date) {
  return db
    .select()
    .from(s.appointments)
    .where(
      and(ne(s.appointments.status, "cancelled"), gte(s.appointments.startsAt, from), lte(s.appointments.startsAt, to)),
    )
    .orderBy(asc(s.appointments.startsAt));
}

/** A paid deposit confirms the hold and books the job. */
export async function confirmForInvoice(db: Database, invoiceId: string, now = new Date()) {
  const rows = await db
    .update(s.appointments)
    .set({ status: "confirmed", holdUntil: null, updatedAt: now })
    .where(and(eq(s.appointments.invoiceId, invoiceId), eq(s.appointments.status, "hold")))
    .returning();
  for (const a of rows)
    if (a.jobId)
      await db
        .update(s.studioJobs)
        .set({ status: "booked", updatedAt: now })
        .where(and(eq(s.studioJobs.id, a.jobId), eq(s.studioJobs.status, "inquiry")));
  return rows;
}

/* ---------- availability ---------- */
export async function listRules(db: Database) {
  return db
    .select()
    .from(s.availabilityRules)
    .orderBy(asc(s.availabilityRules.weekday), asc(s.availabilityRules.startMinute));
}
export async function addRule(db: Database, r: { weekday: number; startMinute: number; endMinute: number }) {
  if (!Number.isInteger(r.weekday) || r.weekday < 0 || r.weekday > 6) throw new StudioError("Pick a weekday.");
  if (r.startMinute < 0 || r.endMinute > 1440 || r.endMinute <= r.startMinute)
    throw new StudioError("End must be after start.");
  const [row] = await db.insert(s.availabilityRules).values(r).returning();
  return row;
}
export async function removeRule(db: Database, id: string) {
  await db.delete(s.availabilityRules).where(eq(s.availabilityRules.id, id));
}
export async function listBlackouts(db: Database) {
  return db.select().from(s.blackoutDates).orderBy(asc(s.blackoutDates.date));
}
export async function addBlackout(db: Database, date: string, reason?: string, to?: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new StudioError("Pick a date.");
  const end = to && /^\d{4}-\d{2}-\d{2}$/.test(to) ? to : date;
  if (end < date) throw new StudioError("The last day cannot be before the first.");
  const days: string[] = [];
  for (let d = new Date(`${date}T12:00:00Z`); d.toISOString().slice(0, 10) <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    days.push(d.toISOString().slice(0, 10));
    if (days.length > 366) throw new StudioError("Block at most a year at a time.");
  }
  await db
    .insert(s.blackoutDates)
    .values(days.map((day) => ({ date: day, reason: reason?.trim() || null })))
    .onConflictDoNothing();
  return days.length;
}
export async function removeBlackout(db: Database, id: string) {
  await db.delete(s.blackoutDates).where(eq(s.blackoutDates.id, id));
}

export type Slot = { startsAt: Date; endsAt: Date };

/**
 * Bookable start times on a local date for an appointment of `durationMin`: inside a weekly window, not a blackout date,
 * after the minimum notice and within the booking horizon, and clear of every live appointment once the default buffer
 * (and any travel time) is added on both sides.
 */
export async function slotsForDate(
  db: Database,
  date: string,
  opts: { durationMin: number; travelMin?: number; now?: Date; settings?: CalendarSettings },
): Promise<Slot[]> {
  const now = opts.now ?? new Date();
  const c = opts.settings ?? (await getCalendarSettings(db));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
  const [black] = await db.select().from(s.blackoutDates).where(eq(s.blackoutDates.date, date));
  if (black) return [];
  const wd = weekdayOf(date, c.timezone);
  const rules = (await db.select().from(s.availabilityRules).where(eq(s.availabilityRules.weekday, wd))).sort(
    (a, b) => a.startMinute - b.startMinute,
  );
  if (!rules.length) return [];
  await releaseExpiredHolds(db, now);
  const dayStart = zonedToUtc(date, 0, c.timezone);
  const dayEnd = zonedToUtc(date, 1440, c.timezone);
  const live = await findConflicts(db, {
    start: new Date(dayStart.getTime() - 24 * 3600_000),
    end: new Date(dayEnd.getTime() + 24 * 3600_000),
  });
  const earliest = now.getTime() + c.minNoticeHours * 3600_000;
  const latest = now.getTime() + c.maxAdvanceDays * 86_400_000;
  const out: Slot[] = [];
  const seen = new Set<number>(); // overlapping or repeated weekly windows must not offer the same time twice
  for (const r of rules)
    for (let m = r.startMinute; m + opts.durationMin <= r.endMinute; m += c.stepMin) {
      const startsAt = zonedToUtc(date, m, c.timezone);
      const endsAt = new Date(startsAt.getTime() + opts.durationMin * 60_000);
      if (startsAt.getTime() < earliest || startsAt.getTime() > latest) continue;
      const b = blockedRange({
        startsAt,
        endsAt,
        bufferBeforeMin: c.defaultBufferMin,
        bufferAfterMin: c.defaultBufferMin,
        travelMin: opts.travelMin,
      });
      if (live.some((a) => a.blockedStart < b.end && a.blockedEnd > b.start)) continue;
      if (seen.has(startsAt.getTime())) continue;
      seen.add(startsAt.getTime());
      out.push({ startsAt, endsAt });
    }
  return out.sort((x, y) => x.startsAt.getTime() - y.startsAt.getTime());
}

/* ---------- mini-sessions ---------- */
export async function createMinislots(
  db: Database,
  input: {
    date: string;
    startMinute: number;
    count: number;
    lengthMin: number;
    gapMin?: number;
    label: string;
    location?: string;
  },
) {
  if (input.count < 1 || input.count > 40) throw new StudioError("Between 1 and 40 slots.");
  if (input.lengthMin < 5) throw new StudioError("Slots must be at least 5 minutes.");
  const c = await getCalendarSettings(db);
  const made = [];
  for (let i = 0; i < input.count; i++) {
    const startsAt = zonedToUtc(
      input.date,
      input.startMinute + i * (input.lengthMin + (input.gapMin ?? 0)),
      c.timezone,
    );
    made.push(
      await addAppointment(db, {
        kind: "minislot",
        status: "open",
        title: `${input.label} slot ${i + 1}`,
        startsAt,
        endsAt: new Date(startsAt.getTime() + input.lengthMin * 60_000),
        groupLabel: input.label,
        location: input.location,
      }),
    );
  }
  return made;
}
export async function openMinislots(db: Database, now = new Date()) {
  return db
    .select()
    .from(s.appointments)
    .where(
      and(eq(s.appointments.kind, "minislot"), eq(s.appointments.status, "open"), gte(s.appointments.startsAt, now)),
    )
    .orderBy(asc(s.appointments.startsAt));
}
/** Books an open slot for a client (atomic: only one booker wins). */
export async function bookMinislot(db: Database, id: string, who: { clientId: string; bookingId?: string }) {
  const rows = await db
    .update(s.appointments)
    .set({ status: "confirmed", clientId: who.clientId, bookingId: who.bookingId ?? null, updatedAt: new Date() })
    .where(and(eq(s.appointments.id, id), eq(s.appointments.kind, "minislot"), eq(s.appointments.status, "open")))
    .returning();
  if (!rows.length) throw new StudioError("That slot was just taken.");
  return rows[0];
}

/* ---------- waitlist ---------- */
export async function joinWaitlist(
  db: Database,
  w: { name: string; email: string; wanted: string; shootType?: string },
) {
  if (w.name.trim().length < 2) throw new StudioError("Enter your name.");
  if (!/^\S+@\S+\.\S+$/.test(w.email.trim())) throw new StudioError("Enter a valid email address.");
  const email = w.email.trim().toLowerCase();
  const [dup] = await db
    .select()
    .from(s.waitlist)
    .where(and(eq(s.waitlist.email, email), eq(s.waitlist.wanted, w.wanted), isNull(s.waitlist.notifiedAt)));
  if (dup) return dup;
  const [row] = await db
    .insert(s.waitlist)
    .values({
      name: w.name.trim().slice(0, 120),
      email,
      wanted: w.wanted.slice(0, 120),
      shootType: w.shootType ?? null,
    })
    .returning();
  return row;
}
export async function waitingFor(db: Database, wanted: string[]) {
  if (!wanted.length) return [];
  return db
    .select()
    .from(s.waitlist)
    .where(and(inArray(s.waitlist.wanted, wanted), isNull(s.waitlist.notifiedAt)))
    .orderBy(asc(s.waitlist.createdAt));
}
export async function markWaitlistNotified(db: Database, ids: string[], now = new Date()) {
  if (ids.length) await db.update(s.waitlist).set({ notifiedAt: now }).where(inArray(s.waitlist.id, ids));
}

/* ---------- .ics ---------- */
const icsEscape = (v: string) =>
  v.replace(/\\/g, "\\\\").replace(/;/g, ";").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const icsDate = (d: Date) =>
  d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
function fold(line: string): string {
  // RFC 5545: lines are at most 75 octets; continuation lines start with a space.
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let i = 0;
  let first = true;
  while (i < bytes.length) {
    const max = first ? 75 : 74;
    let end = Math.min(bytes.length, i + max);
    while (end < bytes.length && (bytes[end] & 0xc0) === 0x80) end--; // do not split a UTF-8 sequence
    parts.push(bytes.subarray(i, end).toString("utf8"));
    i = end;
    first = false;
  }
  return parts.join("\r\n ");
}

export function icsCalendar(
  rows: {
    id: string;
    title: string;
    startsAt: Date;
    endsAt: Date;
    location?: string | null;
    notes?: string | null;
    status: string;
    kind: string;
  }[],
  opts: { name: string; now?: Date },
): string {
  const stamp = icsDate(opts.now ?? new Date());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//jerryqiu.com//photo studio//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${icsEscape(opts.name)}`,
  ];
  for (const r of rows) {
    if (r.status === "cancelled") continue;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${r.id}@photo.jerryqiu.com`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsDate(r.startsAt)}`,
      `DTEND:${icsDate(r.endsAt)}`,
      `SUMMARY:${icsEscape(r.title)}`,
      ...(r.location ? [`LOCATION:${icsEscape(r.location)}`] : []),
      ...(r.notes ? [`DESCRIPTION:${icsEscape(r.notes)}`] : []),
      `STATUS:${r.status === "confirmed" ? "CONFIRMED" : "TENTATIVE"}`,
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return `${lines.map(fold).join("\r\n")}\r\n`;
}
