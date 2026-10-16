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

/* ---------- account passwords (not normalised, unlike gallery passcodes) ---------- */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const h = await scrypt(password, salt, 32);
  return `${salt.toString("hex")}:${h.toString("hex")}`;
}
const DUMMY = `${"00".repeat(16)}:${"00".repeat(32)}`;
/** Always does the same work, so a missing account takes as long as a wrong password. */
export async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  const [saltHex, hashHex] = (stored ?? DUMMY).split(":");
  const expected = Buffer.from(hashHex, "hex");
  const got = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  const ok = got.length === expected.length && timingSafeEqual(got, expected);
  return Boolean(stored) && ok;
}

const COMMON = new Set([
  "password",
  "password1",
  "1234567890",
  "qwertyuiop",
  "letmein123",
  "iloveyou12",
  "welcome123",
  "admin12345",
]);
/** At least 10 characters, not an obvious one, not the email address. Returns a message, or null when fine. */
export function passwordProblem(password: string, email?: string): string | null {
  if (password.length < 10) return "Use at least 10 characters.";
  if (password.length > 200) return "That password is too long.";
  if (COMMON.has(password.toLowerCase())) return "That password is too common.";
  if (email && password.toLowerCase().includes(email.split("@")[0].toLowerCase()) && email.split("@")[0].length > 3)
    return "Do not use your email address in your password.";
  if (/^(.)\1+$/.test(password)) return "Use more than one repeated character.";
  return null;
}

/**
 * A document reference is either a link token (looked up by its hash) or `id:<uuid>`, which APPLICATION code may pass only
 * after it has verified a signed portal capability for a signed-in client. A raw URL value starting with "id:" must never
 * reach these functions (the app layer rejects it).
 */
export const isIdRef = (t: string) => /^id:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(t);
