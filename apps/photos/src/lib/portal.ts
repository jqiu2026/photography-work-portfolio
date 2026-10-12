import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { clientIpHash, tokenSecrets } from "@jerryqiu/protect";
import { cookies, headers } from "next/headers";

/**
 * Client portal session: a signed, httpOnly, host-only cookie holding the gallery the visitor opened with its passcode.
 * Separate from the staff session (Auth.js). Scoped to /client, SameSite=Strict, 8 hours. The `viewer` id binds image
 * tokens to this session so a leaked token is useless elsewhere.
 */
const COOKIE = "hl_client";
const TTL_SEC = 8 * 60 * 60;

export type PortalSession = { g: string; v: string; e: number };

const b64 = (s: string) => Buffer.from(s).toString("base64url");
const mac = (secret: string, body: string) => createHmac("sha256", secret).update(body).digest("base64url");

export function signSession(s: PortalSession, secret = tokenSecrets()[0]): string {
  if (!secret) throw new Error("No signing secret configured");
  const body = b64(JSON.stringify(s));
  return `${body}.${mac(secret, body)}`;
}

export function readSessionValue(
  value: string | undefined,
  secrets = tokenSecrets(),
  now = Date.now(),
): PortalSession | null {
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
    const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as PortalSession;
    if (typeof p.g !== "string" || typeof p.v !== "string" || typeof p.e !== "number" || p.e * 1000 < now) return null;
    return p;
  } catch {
    return null;
  }
}

export async function startPortalSession(galleryId: string): Promise<void> {
  const e = Math.floor(Date.now() / 1000) + TTL_SEC;
  (await cookies()).set(COOKIE, signSession({ g: galleryId, v: randomBytes(8).toString("hex"), e }), {
    path: "/client",
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: TTL_SEC,
  });
}

export async function portalSession(): Promise<PortalSession | null> {
  return readSessionValue((await cookies()).get(COOKIE)?.value);
}

export async function endPortalSession(): Promise<void> {
  (await cookies()).delete({ name: COOKIE, path: "/client" });
}

export async function requestIpHash(): Promise<string> {
  return clientIpHash(await headers());
}
