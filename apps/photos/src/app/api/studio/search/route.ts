import { getDb } from "@jerryqiu/db";
import { searchStudio } from "@jerryqiu/db/business";
import { NextResponse } from "next/server";
import { canSeeSection } from "@/components/studio/sections";
import { guardedRoute } from "@/lib/route-guard";

export const dynamic = "force-dynamic";

/** `GET /api/studio/search?q=` for the Jump-to palette: matches across clients, jobs, galleries, invoices and more. */
export const GET = guardedRoute(
  "studio.access",
  async (req, _ctx, user) => {
    const db = getDb();
    if (!db) return NextResponse.json({ hits: [] });
    const q = new URL(req.url).searchParams.get("q") ?? "";
    // a role only gets results from pages it may open
    const page: Record<string, string> = {
      client: "clients",
      job: "shoots",
      gallery: "galleries",
      invoice: "invoices",
      testimonial: "testimonials",
      expense: "expenses",
    };
    const hits = (await searchStudio(db, q)).filter((h) => canSeeSection(user.role, page[h.kind] ?? "overview"));
    return NextResponse.json({ hits }, { headers: { "Cache-Control": "no-store" } });
  },
  { limit: 300 },
);
