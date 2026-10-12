import { createHash } from "node:crypto";

/** Hash of the client IP (+ secret) for rate limiting and abuse review without storing raw IPs. */
export function clientIpHash(
  headers: { get(name: string): string | null },
  secret = process.env.AUTH_SECRET ?? "dev",
): string {
  const ip = (headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
  return createHash("sha256").update(`${secret}:${ip}`).digest("base64url").slice(0, 22);
}
