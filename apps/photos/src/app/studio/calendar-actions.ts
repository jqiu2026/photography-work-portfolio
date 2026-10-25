"use server";

import * as cal from "@jerryqiu/db/calendar";
import { StudioError } from "@jerryqiu/db/studio";
import { z } from "zod";
import { created, mayRemove, studio, studioOwner } from "@/lib/studio-run";

const id = z.string().uuid();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date.");
const time = z.string().regex(/^\d{2}:\d{2}$/, "Pick a time.");
const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));

export async function addAppointmentAction(input: {
  title: string;
  date: string;
  start: string;
  end: string;
  kind?: string;
  location?: string;
  bufferMin?: string;
  travelMin?: string;
  jobId?: string;
  notes?: string;
}) {
  return studio(async (ctx) => {
    const { db } = ctx;
    const p = z.object({ title: z.string().min(2, "Give it a title."), date, start: time, end: time }).safeParse(input);
    if (!p.success) throw new StudioError(p.error.issues[0].message);
    const c = await cal.getCalendarSettings(db);
    const buffer = input.bufferMin?.trim() ? Number(input.bufferMin) : c.defaultBufferMin;
    const travel = input.travelMin?.trim() ? Number(input.travelMin) : 0;
    if (![buffer, travel].every((n) => Number.isInteger(n) && n >= 0 && n <= 600))
      throw new StudioError("Buffer and travel are whole minutes.");
    const kind = (["shoot", "consult", "block"] as const).find((k) => k === input.kind) ?? "shoot";
    const a = await cal.addAppointment(db, {
      kind,
      title: p.data.title,
      startsAt: cal.zonedToUtc(p.data.date, minutes(p.data.start), c.timezone),
      endsAt: cal.zonedToUtc(p.data.date, minutes(p.data.end), c.timezone),
      bufferBeforeMin: buffer,
      bufferAfterMin: buffer,
      travelMin: travel,
      location: input.location,
      notes: input.notes,
      jobId: input.jobId && id.safeParse(input.jobId).success ? input.jobId : null,
    });
    await created(ctx, "appointment", a.id);
    return {
      message: "Added to the calendar",
      audit: {
        action: "studio.appointment.create",
        entity: "appointment",
        entityId: a.id,
        summary: `Added ${a.title}`,
      },
    };
  });
}

export async function updateAppointmentAction(input: {
  appointmentId: string;
  title: string;
  date: string;
  start: string;
  end: string;
  kind?: string;
  location?: string;
  bufferMin?: string;
  travelMin?: string;
  jobId?: string;
  notes?: string;
}) {
  return studio(async (ctx) => {
    const { db } = ctx;
    const aid = id.safeParse(input.appointmentId);
    if (!aid.success) throw new StudioError("Unknown appointment.");
    const p = z.object({ title: z.string().min(2, "Give it a title."), date, start: time, end: time }).safeParse(input);
    if (!p.success) throw new StudioError(p.error.issues[0].message);
    const c = await cal.getCalendarSettings(db);
    const buffer = input.bufferMin?.trim() ? Number(input.bufferMin) : c.defaultBufferMin;
    const travel = input.travelMin?.trim() ? Number(input.travelMin) : 0;
    if (![buffer, travel].every((n) => Number.isInteger(n) && n >= 0 && n <= 600))
      throw new StudioError("Buffer and travel are whole minutes.");
    const kind = (["shoot", "consult", "block"] as const).find((k) => k === input.kind) ?? "shoot";
    const a = await cal.updateAppointment(db, aid.data, {
      kind,
      title: p.data.title,
      startsAt: cal.zonedToUtc(p.data.date, minutes(p.data.start), c.timezone),
      endsAt: cal.zonedToUtc(p.data.date, minutes(p.data.end), c.timezone),
      bufferBeforeMin: buffer,
      bufferAfterMin: buffer,
      travelMin: travel,
      location: input.location,
      notes: input.notes,
      jobId: input.jobId && id.safeParse(input.jobId).success ? input.jobId : null,
    });
    return {
      message: "Calendar entry saved",
      audit: {
        action: "studio.appointment.update",
        entity: "appointment",
        entityId: a.id,
        summary: `Edited ${a.title}`,
      },
    };
  });
}

export async function cancelAppointmentAction(appointmentId: string) {
  return studio(async (ctx) => {
    const { db } = ctx;
    await mayRemove(ctx, "appointment", appointmentId);
    const p = id.safeParse(appointmentId);
    if (!p.success) throw new StudioError("Unknown appointment.");
    const a = await cal.cancelAppointment(db, p.data);
    return {
      message: "Canceled. Anyone on the waitlist can be told from the Calendar page.",
      audit: {
        action: "studio.appointment.cancel",
        entity: "appointment",
        entityId: a.id,
        summary: `Canceled ${a.title}`,
      },
    };
  });
}

export async function addRuleAction(input: { weekday: string; start: string; end: string }) {
  return studio(async ({ db }) => {
    const p = z.object({ start: time, end: time }).safeParse(input);
    if (!p.success) throw new StudioError(p.error.issues[0].message);
    await cal.addRule(db, {
      weekday: Number(input.weekday),
      startMinute: minutes(p.data.start),
      endMinute: minutes(p.data.end),
    });
    return {
      message: "Hours added",
      audit: { action: "studio.availability.add", entity: "availability_rule", summary: "Added bookable hours" },
    };
  });
}

export async function removeRuleAction(ruleId: string) {
  return studioOwner(async ({ db }) => {
    const p = id.safeParse(ruleId);
    if (!p.success) throw new StudioError("Unknown rule.");
    await cal.removeRule(db, p.data);
    return { message: "Hours removed" };
  });
}

export async function addBlackoutAction(input: { date: string; to?: string; reason?: string }) {
  return studio(async ({ db }) => {
    const p = date.safeParse(input.date);
    if (!p.success) throw new StudioError(p.error.issues[0].message);
    const n = await cal.addBlackout(db, p.data, input.reason, input.to);
    return {
      message: n > 1 ? `${n} days blocked` : "Day blocked",
      audit: { action: "studio.blackout.add", entity: "blackout_date", summary: `Blocked ${p.data}` },
    };
  });
}

export async function removeBlackoutAction(blackoutId: string) {
  return studioOwner(async ({ db }) => {
    const p = id.safeParse(blackoutId);
    if (!p.success) throw new StudioError("Unknown day.");
    await cal.removeBlackout(db, p.data);
    return { message: "Day reopened" };
  });
}

export async function createMinislotsAction(input: {
  label: string;
  date: string;
  start: string;
  count: string;
  length: string;
  gap: string;
  location?: string;
}) {
  return studio(async ({ db }) => {
    const p = z.object({ label: z.string().min(2, "Name the mini-session."), date, start: time }).safeParse(input);
    if (!p.success) throw new StudioError(p.error.issues[0].message);
    const made = await cal.createMinislots(db, {
      date: p.data.date,
      startMinute: minutes(p.data.start),
      count: Number(input.count),
      lengthMin: Number(input.length),
      gapMin: input.gap ? Number(input.gap) : 0,
      label: p.data.label,
      location: input.location,
    });
    return {
      message: `${made.length} slots opened`,
      audit: {
        action: "studio.minislots.create",
        entity: "appointment",
        summary: `Opened ${made.length} slots for ${p.data.label}`,
      },
    };
  });
}

export async function saveCalendarSettingsAction(input: {
  timezone: string;
  defaultBufferMin: string;
  minNoticeHours: string;
  maxAdvanceDays: string;
  depositDollars: string;
}) {
  return studioOwner(async ({ db }) => {
    const dollars = Number(input.depositDollars);
    if (!Number.isFinite(dollars) || dollars < 0) throw new StudioError("Enter the deposit as a number of dollars.");
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: input.timezone });
    } catch {
      throw new StudioError("That time zone is not recognized (use a name like America/New_York).");
    }
    const parsed = cal.calendarSettingsSchema.partial().safeParse({
      timezone: input.timezone,
      defaultBufferMin: Number(input.defaultBufferMin),
      minNoticeHours: Number(input.minNoticeHours),
      maxAdvanceDays: Number(input.maxAdvanceDays),
      depositCents: Math.round(dollars * 100),
    });
    if (!parsed.success) throw new StudioError("Check the numbers (whole minutes, hours and days).");
    await cal.saveCalendarSettings(db, parsed.data);
    return {
      message: "Calendar settings saved",
      audit: {
        action: "studio.calendar.settings",
        entity: "studio_setting",
        entityId: "calendar",
        summary: "Updated calendar settings",
      },
    };
  });
}

export async function notifyWaitlistAction(wanted: string) {
  return studio(async ({ db }) => {
    const { sendTemplate } = await import("@jerryqiu/email");
    const rows = await cal.waitingFor(db, [wanted]);
    for (const w of rows)
      await sendTemplate(db, w.email, "reminder", {
        name: w.name,
        title: "A spot opened up",
        summary: `A time you were waiting for (${wanted}) is available again. Reply to this email to claim it.`,
      });
    await cal.markWaitlistNotified(
      db,
      rows.map((r) => r.id),
    );
    return { message: `${rows.length} ${rows.length === 1 ? "person" : "people"} told` };
  });
}
