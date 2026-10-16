import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

/** AES-256-GCM for secrets stored in the database (settings secrets). Key derived from AUTH_SECRET with HKDF. */
const version = "v1";

function key(secret = process.env.AUTH_SECRET): Uint8Array {
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new Uint8Array(hkdfSync("sha256", secret, "jerryqiu", "settings-encryption", 32));
}

export function encrypt(plaintext: string, secret?: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(secret), iv);
  const data = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return [
    version,
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    data.toString("base64url"),
  ].join(".");
}

/** Undefined when tampered with or the secret changed. */
export function decrypt(value: string, secret?: string): string | undefined {
  const [prefix, iv, tag, data] = value.split(".", 4);
  if (prefix !== version || !iv || !tag || data === undefined) return undefined;
  try {
    const d = createDecipheriv("aes-256-gcm", key(secret), Buffer.from(iv, "base64url"));
    d.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([d.update(Buffer.from(data, "base64url")), d.final()]).toString("utf8");
  } catch {
    return undefined;
  }
}
