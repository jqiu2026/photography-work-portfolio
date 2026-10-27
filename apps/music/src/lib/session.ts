import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * The buyer's library session: a signed cookie holding the buyer id and an expiry. No password. The only way to get one
 * is a one-time link sent to an address that has bought (see music.ts createBuyerLink).
 */
const NAME = "mu_buyer";
const TTL = 60 * 60 * 24 * 14;
const secret = () => process.env.AUTH_SECRET ?? "dev-only-secret";
const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

export function makeSession(buyerId: string, now = Date.now()) {
  const payload = `${buyerId}.${Math.floor(now / 1000) + TTL}`;
  return `${payload}.${sign(payload)}`;
}

export function readSession(value: string | undefined, now = Date.now()): string | null {
  if (!value) return null;
  const [id, exp, sig] = value.split(".");
  if (!id || !exp || !sig) return null;
  const want = sign(`${id}.${exp}`);
  if (sig.length !== want.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return null;
  return Number(exp) * 1000 > now ? id : null;
}

export async function buyerId(): Promise<string | null> {
  return readSession((await cookies()).get(NAME)?.value);
}

export async function startSession(id: string) {
  (await cookies()).set(NAME, makeSession(id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL,
  });
}

export async function endSession() {
  (await cookies()).delete(NAME);
}
