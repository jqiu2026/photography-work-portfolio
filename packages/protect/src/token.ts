import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed, expiring image tokens (docs/project/05-security-and-image-protection.md, rule 5).
 * Payload {i: imageId, w: width, v: viewer, e: expiry (unix seconds)}, HMAC-SHA256 with a server secret.
 * `secrets[0]` signs; every secret in the list verifies, so a key can be rotated without breaking live pages.
 */
export const ALLOWED_WIDTHS = [480, 960, 1600, 2400] as const;
export type AllowedWidth = (typeof ALLOWED_WIDTHS)[number];

export const TTL = { public: 60 * 60, protected: 5 * 60 } as const;

export type TokenPayload = { i: string; w: number; v: string; e: number };
export type VerifyResult =
  | { ok: true; payload: TokenPayload }
  | { ok: false; reason: "malformed" | "bad_signature" | "expired" | "wrong_image" | "wrong_width" | "wrong_viewer" };

const b64 = (s: string) => Buffer.from(s).toString("base64url");
const mac = (secret: string, body: string) => createHmac("sha256", secret).update(body).digest("base64url");

export function isAllowedWidth(w: number): w is AllowedWidth {
  return (ALLOWED_WIDTHS as readonly number[]).includes(w);
}

export function signImageToken(input: {
  id: string;
  width: number;
  viewer?: string;
  ttl: number;
  secrets: string[];
  now?: number;
}): string {
  if (!input.secrets[0]) throw new Error("No signing secret configured");
  if (!isAllowedWidth(input.width)) throw new Error(`Width ${input.width} is not allowed`);
  const e = Math.floor((input.now ?? Date.now()) / 1000) + Math.min(input.ttl, TTL.public);
  const body = b64(JSON.stringify({ i: input.id, w: input.width, v: input.viewer ?? "", e } satisfies TokenPayload));
  return `${body}.${mac(input.secrets[0], body)}`;
}

export function verifyImageToken(
  token: string | null | undefined,
  secrets: string[],
  expect: { id?: string; width?: number; viewer?: string; now?: number } = {},
): VerifyResult {
  if (!token || token.length > 600) return { ok: false, reason: "malformed" };
  const [body, sig, extra] = token.split(".");
  if (!body || !sig || extra !== undefined) return { ok: false, reason: "malformed" };
  const got = Buffer.from(sig);
  const valid = secrets.some((s) => {
    const want = Buffer.from(mac(s, body));
    return want.length === got.length && timingSafeEqual(want, got);
  });
  if (!valid) return { ok: false, reason: "bad_signature" };
  let payload: TokenPayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (typeof payload.i !== "string" || typeof payload.w !== "number" || typeof payload.e !== "number")
    return { ok: false, reason: "malformed" };
  if (payload.e * 1000 < (expect.now ?? Date.now())) return { ok: false, reason: "expired" };
  if (expect.id !== undefined && payload.i !== expect.id) return { ok: false, reason: "wrong_image" };
  if (expect.width !== undefined && payload.w !== expect.width) return { ok: false, reason: "wrong_width" };
  if (expect.viewer !== undefined && payload.v && payload.v !== expect.viewer)
    return { ok: false, reason: "wrong_viewer" };
  return { ok: true, payload };
}

/** An opaque path for the image route; the file itself is never addressable. */
export function imageUrl(input: {
  id: string;
  width: number;
  viewer?: string;
  ttl?: number;
  secrets: string[];
  now?: number;
}): string {
  const t = signImageToken({
    id: input.id,
    width: input.width,
    viewer: input.viewer,
    ttl: input.ttl ?? TTL.public,
    secrets: input.secrets,
    now: input.now,
  });
  return `/api/img/${input.id}?w=${input.width}&t=${t}`;
}

/** Secrets from env: IMAGE_TOKEN_SECRET (+ optional IMAGE_TOKEN_SECRET_PREVIOUS for rotation), falling back to AUTH_SECRET. */
export function tokenSecrets(env: Record<string, string | undefined> = process.env): string[] {
  const primary = env.IMAGE_TOKEN_SECRET || env.AUTH_SECRET;
  return [primary, env.IMAGE_TOKEN_SECRET_PREVIOUS].filter((x): x is string => Boolean(x));
}

/** One token per allowed width for an image (the browser picks the width at load time). */
export function mintAllWidths(input: { id: string; viewer?: string; ttl?: number; secrets: string[]; now?: number }) {
  return Object.fromEntries(
    ALLOWED_WIDTHS.map((width) => [
      width,
      signImageToken({
        id: input.id,
        width,
        viewer: input.viewer,
        ttl: input.ttl ?? TTL.protected,
        secrets: input.secrets,
        now: input.now,
      }),
    ]),
  ) as Record<AllowedWidth, string>;
}
