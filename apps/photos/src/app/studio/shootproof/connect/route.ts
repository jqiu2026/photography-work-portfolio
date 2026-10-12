import { getSite } from "@jerryqiu/sites";
import { newOAuthState, sourceFromEnv } from "@jerryqiu/shootproof";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireUser } from "@/auth";

export const dynamic = "force-dynamic";

/** Start of the OAuth flow: owner only; remembers a one-time `state` in a short-lived cookie, then sends them to ShootProof. */
export async function GET() {
  const photos = getSite("photos").url;
  try {
    await requireUser("shootproof.manage");
  } catch {
    return NextResponse.redirect(`${photos}/sign-in?callbackUrl=/studio/shootproof`);
  }
  const s = sourceFromEnv();
  if (s.state !== "ready") return NextResponse.redirect(`${photos}/studio/shootproof?error=ShootProof+is+not+set+up.`);
  const state = newOAuthState();
  (await cookies()).set("sp_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/studio/shootproof",
    maxAge: 600,
  });
  return NextResponse.redirect(s.source.authorizeUrl(state, `${photos}/studio/shootproof/callback`));
}
