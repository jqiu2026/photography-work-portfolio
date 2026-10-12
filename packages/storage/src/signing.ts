import { createHmac, timingSafeEqual } from "node:crypto";

/** HMAC signature for local-storage URLs (dev only). */
export function signLocal(secret: string, method: string, key: string, exp: number): string {
  return createHmac("sha256", secret).update(`${method}\n${key}\n${exp}`).digest("base64url");
}

export function verifyLocal(
  secret: string,
  method: string,
  key: string,
  exp: number,
  sig: string,
  now = Date.now(),
): boolean {
  if (!Number.isFinite(exp) || exp * 1000 < now) return false;
  const want = Buffer.from(signLocal(secret, method, key, exp));
  const got = Buffer.from(sig);
  return want.length === got.length && timingSafeEqual(want, got);
}
