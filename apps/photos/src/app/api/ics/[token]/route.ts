import { getDb } from "@jerryqiu/db";
import * as cal from "@jerryqiu/db/calendar";
import { timingSafeEqual } from "node:crypto";

export const dynamic = "force-dynamic";

/** The owner's calendar feed. The URL carries a long random token (rotate it by deleting the `calendar` setting). */
export async function GET(_request: Request, ctx: { params: Promise<{ token: string }> }) {
  const db = getDb();
  if (!db) return new Response(null, { status: 404 });
  const { token } = await ctx.params;
  const want = Buffer.from((await cal.getCalendarSettings(db)).icsToken ?? "");
  const got = Buffer.from(token);
  if (!want.length || want.length !== got.length || !timingSafeEqual(want, got))
    return new Response(null, { status: 404 });
  const now = new Date();
  const rows = await cal.listAppointments(
    db,
    new Date(now.getTime() - 30 * 86_400_000),
    new Date(now.getTime() + 540 * 86_400_000),
  );
  return new Response(
    cal.icsCalendar(
      rows.filter((r) => r.status !== "open"),
      { name: "Photo studio" },
    ),
    {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Cache-Control": "private, max-age=300",
        "X-Robots-Tag": "noindex",
      },
    },
  );
}
