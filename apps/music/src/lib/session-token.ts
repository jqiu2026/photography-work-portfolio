import { createHmac, timingSafeEqual } from "node:crypto";

/** The signed value of the buyer session cookie: the buyer id, an expiry, and an HMAC over both. No server-only code, so it is testable. */
export const TTL = 60 * 60 * 24 * 14;
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
