import { getDb } from "@jerryqiu/db";
import { searchStudio } from "@jerryqiu/db/business";
import { NextResponse } from "next/server";
import { guardedRoute } from "@/lib/route-guard";

export const dynamic = "force-dynamic";

/** `GET /api/studio/search?q=` for the Jump-to palette: matches across clients, jobs, galleries, invoices and more. */
export const GET = guardedRoute(
  "studio.access",
  async (req) => {
    const db = getDb();
    if (!db) return NextResponse.json({ hits: [] });
    const q = new URL(req.url).searchParams.get("q") ?? "";
    return NextResponse.json({ hits: await searchStudio(db, q) }, { headers: { "Cache-Control": "no-store" } });
  },
  { limit: 300 },
);
