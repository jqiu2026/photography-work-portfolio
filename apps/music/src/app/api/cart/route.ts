import { NextResponse } from "next/server";
import { readCart } from "@/lib/cart";

export const dynamic = "force-dynamic";

/** The number of items in the visitor's cart, for the dock. */
export async function GET() {
  return NextResponse.json({ count: (await readCart()).length }, { headers: { "Cache-Control": "no-store" } });
}
