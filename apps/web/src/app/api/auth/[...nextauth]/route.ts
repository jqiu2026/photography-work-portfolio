import { NextResponse } from "next/server";
import { handlers, limitSignIn } from "@/auth";

export const { GET } = handlers;

// Sign-in attempts are rate limited per IP (20 per minute).
export async function POST(request: Request) {
  if (!(await limitSignIn()))
    return NextResponse.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
  return handlers.POST(request as never);
}
