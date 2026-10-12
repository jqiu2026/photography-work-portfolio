import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export const sha256Hex = (s: string) => createHash("sha256").update(s).digest("hex");

/** A random link token (shown once, in the link) and the hash that is stored. */
export function newToken(): { token: string; hash: string } {
  const token = randomBytes(24).toString("base64url");
  return { token, hash: sha256Hex(token) };
}
export const hashToken = sha256Hex;

const norm = (p: string) => p.trim().toLowerCase().replace(/\s+/g, "");

/** scrypt hash of a gallery passcode ("salt:hash", hex). Passcodes are compared case- and space-insensitively. */
export async function hashPasscode(passcode: string): Promise<string> {
  const salt = randomBytes(16);
  const h = await scrypt(norm(passcode), salt, 32);
  return `${salt.toString("hex")}:${h.toString("hex")}`;
}

export async function verifyPasscode(passcode: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored) return false;
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const got = await scrypt(norm(passcode), Buffer.from(saltHex, "hex"), expected.length);
  return got.length === expected.length && timingSafeEqual(got, expected);
}

/** "2026-0007" */
export const invoiceNumber = (year: number, seq: number) => `${year}-${String(seq).padStart(4, "0")}`;

export const totalOf = (lines: { amountCents: number }[]) => lines.reduce((n, l) => n + l.amountCents, 0);
