import { timingSafeEqual } from "node:crypto";
import { getDb, writeAudit } from "@jerryqiu/db";
import { getSite } from "@jerryqiu/sites";
import { saveTokens, sourceFromEnv } from "@jerryqiu/shootproof";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireUser } from "@/auth";

export const dynamic = "force-dynamic";

const back = (q: string) => NextResponse.redirect(`${getSite("photos").url}/studio/shootproof?${q}`);

/** OAuth return: requires the owner's session AND the state cookie set when they pressed Connect (CSRF protection). */
export async function GET(request: Request) {
  let user: Awaited<ReturnType<typeof requireUser>>;
  try {
    user = await requireUser("shootproof.manage");
  } catch {
    return NextResponse.redirect(`${getSite("photos").url}/sign-in?callbackUrl=/studio/shootproof`);
  }
  const url = new URL(request.url);
  const jar = await cookies();
  const expected = jar.get("sp_state")?.value ?? "";
  jar.delete("sp_state");
  const got = url.searchParams.get("state") ?? "";
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  if (!expected || a.length !== b.length || !timingSafeEqual(a, b))
    return back("error=Sign-in+link+expired.+Try+Connect+again.");
  if (url.searchParams.get("error")) return back("error=ShootProof+did+not+allow+the+connection.");
  const code = url.searchParams.get("code");
  const s = sourceFromEnv();
  const db = getDb();
  if (!code || !db || s.state !== "ready") return back("error=ShootProof+is+not+set+up.");
  try {
    await saveTokens(db, await s.source.exchangeCode(code, `${getSite("photos").url}/studio/shootproof/callback`));
    await writeAudit(db, {
      actor: user.email,
      action: "shootproof.connect",
      entity: "external_connection",
      entityId: "shootproof",
      site: "photos",
      summary: "Connected ShootProof",
    });
    return back("connected=1");
  } catch (error) {
    console.error("[shootproof] code exchange failed", String(error));
    return back("error=Could+not+complete+the+connection.");
  }
}
