import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getDb, schema } from "@jerryqiu/db";
import { tokenSecrets } from "@jerryqiu/protect";
import { and, eq, isNull } from "drizzle-orm";
import { cookies } from "next/headers";

/**
 * Portal account session: a signed, httpOnly, host-only cookie holding the account id and a per-session viewer id (which
 * binds image tokens and the invisible watermark to this session). SameSite=Lax so the emailed sign-in link can start it.
 * Always re-checked against the database. Separate from the staff session (Auth.js) and from the gallery passcode session.
 */
const COOKIE = "hl_account";
const TTL_SEC = 14 * 24 * 60 * 60;
export type AccountSession = { a: string; v: string; e: number };

const b64 = (s: string) => Buffer.from(s).toString("base64url");
const mac = (secret: string, body: string) => createHmac("sha256", secret).update(body).digest("base64url");

export function signAccountSession(s: AccountSession, secret = tokenSecrets()[0]): string {
  if (!secret) throw new Error("No signing secret configured");
  const body = b64(JSON.stringify(s));
  return `${body}.${mac(secret, body)}`;
}
export function readAccountSession(
  value: string | undefined,
  secrets = tokenSecrets(),
  now = Date.now(),
): AccountSession | null {
  if (!value || value.length > 500) return null;
  const [body, sig, extra] = value.split(".");
  if (!body || !sig || extra !== undefined) return null;
  const got = Buffer.from(sig);
  if (
    !secrets.some((s) => {
      const want = Buffer.from(mac(s, body));
      return want.length === got.length && timingSafeEqual(want, got);
    })
  )
    return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as AccountSession;
    return typeof p.a === "string" && typeof p.v === "string" && typeof p.e === "number" && p.e * 1000 > now ? p : null;
  } catch {
    return null;
  }
}

export async function startAccountSession(accountId: string): Promise<void> {
  const e = Math.floor(Date.now() / 1000) + TTL_SEC;
  (await cookies()).set(COOKIE, signAccountSession({ a: accountId, v: randomBytes(8).toString("hex"), e }), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: TTL_SEC,
  });
}
export async function endAccountSession(): Promise<void> {
  (await cookies()).delete({ name: COOKIE, path: "/" });
}

/** The signed-in client, or null. Re-checked against the database on every call. */
export async function accountSession() {
  const raw = readAccountSession((await cookies()).get(COOKIE)?.value);
  const db = getDb();
  if (!raw || !db) return null;
  const [row] = await db
    .select({ account: schema.clientAccounts, client: schema.studioClients })
    .from(schema.clientAccounts)
    .innerJoin(schema.studioClients, eq(schema.studioClients.id, schema.clientAccounts.clientId))
    .where(and(eq(schema.clientAccounts.id, raw.a), isNull(schema.studioClients.deletedAt)));
  return row ? { ...row, viewer: `${row.account.id}.${raw.v}` } : null;
}
