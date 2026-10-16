/**
 * Pure access rules. No I/O here, so every rule is unit tested.
 *
 * Sign-in requires ALL of: a verified Google email, the Workspace domain claim (`hd` in the ID token), an email whose
 * domain is exactly the allowed one, and a row in the users allow-list. The `hd` authorization parameter we send to
 * Google is only a UI hint; the claim and the email suffix are verified here, server-side.
 */
export type GoogleProfile = { email?: unknown; email_verified?: unknown; hd?: unknown };

export type Denial = "unverified" | "no_email" | "wrong_domain" | "not_listed" | "inactive";
export type Verdict = { ok: true; email: string } | { ok: false; reason: Denial };

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Step 1: is this Google identity from our Workspace domain at all? */
export function checkGoogleProfile(profile: GoogleProfile, domain: string): Verdict {
  const allowed = domain.trim().toLowerCase().replace(/^@/, "");
  if (typeof profile.email !== "string" || !profile.email.includes("@")) return { ok: false, reason: "no_email" };
  if (profile.email_verified !== true) return { ok: false, reason: "unverified" };
  const email = normalizeEmail(profile.email);
  const emailDomain = email.slice(email.lastIndexOf("@") + 1);
  const hd = typeof profile.hd === "string" ? profile.hd.trim().toLowerCase() : "";
  // Exact match on both: "jerryqiu.com.evil.com" and "evil-jerryqiu.com" must not pass.
  if (emailDomain !== allowed || hd !== allowed) return { ok: false, reason: "wrong_domain" };
  return { ok: true, email };
}

export type Role = "owner" | "editor" | "client";

export const actions = [
  "content.write",
  "content.publish",
  "media.write",
  "inbox.read",
  "inbox.delete",
  "trash.restore",
  "trash.purge",
  "settings.write",
  "users.manage",
  "audit.read",
  "studio.access",
] as const;
export type Action = (typeof actions)[number];

const matrix: Record<Role, readonly Action[]> = {
  owner: actions,
  editor: ["content.write", "content.publish", "media.write", "inbox.read", "trash.restore", "audit.read"],
  client: [],
};

export function can(role: Role | undefined, action: Action): boolean {
  return role !== undefined && matrix[role].includes(action);
}

export function isStaff(role: Role | undefined): role is "owner" | "editor" {
  return role === "owner" || role === "editor";
}

/**
 * Safe post-sign-in redirect. Same-origin relative paths always; absolute URLs only when their origin is one of our own
 * sites (so /studio on photos can send people back after signing in on the hub). Anything else falls back.
 */
export function safeCallback(
  url: string | null | undefined,
  fallback = "/admin",
  allowedOrigins: string[] = [],
): string {
  if (!url || /[\r\n\\]/.test(url)) return fallback;
  if (url.startsWith("/")) return url.startsWith("//") ? fallback : url;
  try {
    const u = new URL(url);
    return (u.protocol === "https:" || u.protocol === "http:") && allowedOrigins.includes(u.origin)
      ? u.toString()
      : fallback;
  } catch {
    return fallback;
  }
}

/** The dev-only open sign-in works only under `next dev` with an explicit flag; production builds ignore it. */
export function isOpenSignIn(env: Record<string, string | undefined> = process.env): boolean {
  return env.NODE_ENV === "development" && env.DASHBOARD_OPEN_SIGNIN === "true";
}

/** Throws in production if the secret is missing or a known dev placeholder. */
export function assertProductionSecret(env: Record<string, string | undefined> = process.env) {
  // `next build` evaluates route modules without runtime secrets; the check runs at runtime in production.
  if (env.NODE_ENV !== "production" || env.NEXT_PHASE === "phase-production-build") return;
  const s = env.AUTH_SECRET;
  if (!s || s.length < 24 || /dev-only|change-me|secret$/i.test(s))
    throw new Error("AUTH_SECRET is missing or a placeholder. Generate one with `openssl rand -base64 32`.");
}
