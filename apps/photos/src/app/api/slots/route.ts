import { getDb } from "@jerryqiu/db";
import * as cal from "@jerryqiu/db/calendar";
import { hitRateLimit } from "@jerryqiu/db";
import { clientIpHash } from "@jerryqiu/protect";
import { scheduleKind } from "@/lib/scheduling";

export const dynamic = "force-dynamic";

/** `GET /api/slots?kind=portrait&date=2027-03-01`: free start times for that day (public, rate limited, no personal data). */
export async function GET(request: Request) {
  const json = (status: number, body: unknown) =>
    Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
  const db = getDb();
  if (!db) return json(503, { error: "Booking is not available right now." });
  const u = new URL(request.url);
  const kind = scheduleKind(u.searchParams.get("kind") ?? "");
  const date = u.searchParams.get("date") ?? "";
  // `minutes` (15 to 480) lets the portal ask for slots as long as an existing appointment, for rescheduling.
  const minutesParam = Number(u.searchParams.get("minutes") ?? "");
  const custom = Number.isInteger(minutesParam) && minutesParam >= 15 && minutesParam <= 480 ? minutesParam : null;
  if ((!kind && !custom) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return json(400, { error: "Pick a kind and a date." });
  if (!(await hitRateLimit(db, `slots:${clientIpHash(request.headers)}`, 60, 60)).allowed)
    return json(429, { error: "Slow down." });
  const c = await cal.getCalendarSettings(db);
  const duration = custom ?? c.durations[(kind as NonNullable<typeof kind>).durationKey];
  const slots = await cal.slotsForDate(db, date, { durationMin: duration, settings: c });
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone: c.timezone, hour: "numeric", minute: "2-digit" });
  return json(200, {
    timezone: c.timezone,
    minutes: duration,
    deposit: kind?.deposit && !custom ? c.depositCents : 0,
    slots: slots.map((s) => ({ start: s.startsAt.toISOString(), label: fmt.format(s.startsAt) })),
  });
}
