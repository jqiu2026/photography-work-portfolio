import * as m from "@jerryqiu/db/music";
import { NextResponse } from "next/server";
import { requireUser } from "@/auth";
import { getDb } from "@jerryqiu/db";

export const dynamic = "force-dynamic";

/** The confirmed subscribers as CSV, for the owner. Staff only. */
export async function GET() {
  try {
    await requireUser("studio.access");
  } catch {
    return new NextResponse("Sign in", { status: 401 });
  }
  const db = getDb();
  if (!db) return new NextResponse("No database", { status: 503 });
  const rows = await m.confirmedSubscribers(db);
  const csv = ["email,confirmed_at", ...rows.map((r) => `${r.email},${r.confirmedAt?.toISOString() ?? ""}`)].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="subscribers.csv"',
      "Cache-Control": "no-store",
    },
  });
}
