import "server-only";
import { type Database, schema } from "@jerryqiu/db";
import * as cal from "@jerryqiu/db/calendar";
import { getSite } from "@jerryqiu/sites";
import { isNull } from "drizzle-orm";
import type { CalendarData } from "@/components/studio/CalendarView";

/** Everything the studio Calendar page shows, with times already formatted in the studio time zone. */
export async function calendarData(db: Database): Promise<CalendarData> {
  const c = await cal.getCalendarSettings(db);
  const now = new Date();
  const [appointments, rules, blackouts, jobs, clients, token] = await Promise.all([
    cal.listAppointments(db, new Date(now.getTime() - 86_400_000), new Date(now.getTime() + 400 * 86_400_000)),
    cal.listRules(db),
    cal.listBlackouts(db),
    db
      .select({ id: schema.studioJobs.id, title: schema.studioJobs.title })
      .from(schema.studioJobs)
      .where(isNull(schema.studioJobs.deletedAt)),
    db.select({ id: schema.studioClients.id, name: schema.studioClients.name }).from(schema.studioClients),
    cal.icsToken(db),
  ]);
  const clientName = new Map(clients.map((x) => [x.id, x.name]));
  const fmtDay = new Intl.DateTimeFormat("en-US", {
    timeZone: c.timezone,
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const fmtTime = new Intl.DateTimeFormat("en-US", { timeZone: c.timezone, hour: "numeric", minute: "2-digit" });
  const waiting = await db.select().from(schema.waitlist).where(isNull(schema.waitlist.notifiedAt));
  const counts = new Map<string, number>();
  for (const w of waiting) counts.set(w.wanted, (counts.get(w.wanted) ?? 0) + 1);
  return {
    timezone: c.timezone,
    settings: {
      defaultBufferMin: c.defaultBufferMin,
      minNoticeHours: c.minNoticeHours,
      maxAdvanceDays: c.maxAdvanceDays,
      depositDollars: (c.depositCents / 100).toFixed(2),
    },
    appointments: appointments.map((a) => ({
      id: a.id,
      title: a.title,
      kind: a.kind,
      status: a.status,
      day: cal.localDate(a.startsAt, c.timezone),
      dayLabel: fmtDay.format(a.startsAt),
      time: `${fmtTime.format(a.startsAt)} to ${fmtTime.format(a.endsAt)}`,
      location: a.location,
      client: a.clientId ? (clientName.get(a.clientId) ?? null) : null,
    })),
    rules,
    blackouts,
    waiting: [...counts].map(([wanted, count]) => ({ wanted, count })),
    icsUrl: `${getSite("photos").url}/api/ics/${token}`,
    jobs,
  };
}
