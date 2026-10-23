import { type AuditEntry, type Database, getDb, hitRateLimit, schema, writeAudit } from "@jerryqiu/db";
import { clientIpHash } from "@jerryqiu/protect";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { cache } from "react";
import type { z } from "zod";
import { type Action, type Role, assertProductionSecret, can, isOpenSignIn } from "./policy";
import { type AppUser, authorizeSignIn, findUser } from "./users";

export type { Action, Role } from "./policy";
export type { AppUser } from "./users";

export type ActionError = { ok: false; error: string; fieldErrors?: Record<string, string> };
export type ActionResult<T extends Record<string, unknown> = Record<never, never>> = ({ ok: true } & T) | ActionError;
export type ActionContext = { user: AppUser; db: Database; audit: (e: Omit<AuditEntry, "actor">) => Promise<void> };

export class AuthorizationError extends Error {
  constructor(message = "You don't have permission to do that.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export const actionError = (error: string, fieldErrors?: Record<string, string>): ActionError =>
  fieldErrors ? { ok: false, error, fieldErrors } : { ok: false, error };

export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) out[String(issue.path[0] ?? "form")] ??= issue.message;
  return out;
}
export const invalid = (error: z.ZodError) => actionError("Check the highlighted fields.", zodFieldErrors(error));

const LOCAL_EMAIL = "local-dev@localhost";

/**
 * One auth setup shared by apps/web (/admin, hosts the Auth.js route) and apps/photos (/studio, only reads the session).
 * Same AUTH_SECRET in both; in production the session cookie is scoped to AUTH_COOKIE_DOMAIN (.jerryqiu.com) so one
 * sign-in covers every site. Client sessions (Phase 3) will use a different host-only cookie.
 */
export function createAuthKit() {
  assertProductionSecret();
  const domain = (process.env.ALLOWED_EMAIL_DOMAIN || "jerryqiu.com").trim().toLowerCase();
  const bootstrap = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const prod = process.env.NODE_ENV === "production";
  const cookieDomain = prod ? process.env.AUTH_COOKIE_DOMAIN || undefined : undefined;

  const nextAuth = NextAuth({
    // no `hd` hint: it would hide personal Google accounts from the chooser, and invited helpers may use one. The domain is
    // still checked on the server (policy.ts), so this only widens who can try, not who gets in.
    providers: [Google({ authorization: { params: { prompt: "select_account" } } })],
    session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 14 },
    pages: { signIn: "/sign-in", error: "/sign-in" },
    trustHost: true,
    ...(cookieDomain
      ? {
          cookies: {
            sessionToken: {
              name: "__Secure-authjs.session-token",
              options: { httpOnly: true, sameSite: "lax" as const, path: "/", secure: true, domain: cookieDomain },
            },
          },
        }
      : {}),
    callbacks: {
      async signIn({ account, profile }) {
        if (account?.provider !== "google" || !profile) return false;
        const db = getDb();
        if (!db) return false;
        const verdict = await authorizeSignIn(db, profile as never, { domain, bootstrapEmails: bootstrap });
        return verdict.ok;
      },
      // Quick signed-cookie check for the proxy; real authorization happens in currentUser().
      authorized: ({ auth }) => Boolean(auth?.user?.email),
    },
  });

  function localOwner(email = LOCAL_EMAIL, name: string | null = "Local developer"): AppUser {
    const wanted = process.env.DASHBOARD_DEV_ROLE;
    const role: Role = wanted === "editor" ? "editor" : "owner";
    return { id: "open-signin", email, name, image: null, role };
  }

  /** The signed-in, still-allow-listed user (deduplicated per render). Open sign-in is development only. */
  const currentUser = cache(async (): Promise<AppUser | undefined> => {
    const session = await nextAuth.auth();
    const email = session?.user?.email;
    if (!email) return isOpenSignIn() ? localOwner() : undefined;
    const db = getDb();
    const user = db ? await findUser(db, email) : undefined;
    return user ?? (isOpenSignIn() ? localOwner(email, session?.user?.name ?? null) : undefined);
  });

  const allowed = (user: AppUser, access: Action | "any") => access === "any" || can(user.role, access);

  /** For pages: redirects anyone who is not allowed. */
  async function requirePageUser(access: Action | "any" = "any", callback = "/admin"): Promise<AppUser> {
    const user = await currentUser();
    if (!user) {
      const session = await nextAuth.auth();
      redirect(session ? "/sign-in?error=AccessDenied" : `/sign-in?callbackUrl=${encodeURIComponent(callback)}`);
    }
    if (!allowed(user, access)) redirect("/admin?denied=1");
    return user;
  }

  /** For Server Actions and Route Handlers: throws unless allowed. */
  async function requireUser(access: Action | "any" = "any"): Promise<AppUser> {
    const user = await currentUser();
    if (!user) throw new AuthorizationError("Please sign in again.");
    if (!allowed(user, access)) throw new AuthorizationError();
    return user;
  }

  /**
   * Every mutating Server Action runs through this: re-checks the session and role on the server (never trusting the
   * proxy or the UI), needs a database, rate-limits per user, and turns failures into a message the UI can show.
   */
  async function guarded<R extends { ok: boolean }>(
    access: Action,
    run: (ctx: ActionContext) => Promise<R>,
  ): Promise<R | ActionError> {
    let user: AppUser;
    try {
      user = await requireUser(access);
    } catch (error) {
      if (error instanceof AuthorizationError) return actionError(error.message);
      throw error;
    }
    const db = getDb();
    if (!db) return actionError("The database isn't set up (DATABASE_URL is missing). See docs/owner-guide.md.");
    try {
      const rl = await hitRateLimit(db, `action:${user.email}`, 240, 60);
      if (!rl.allowed) return actionError("You're going a bit fast. Wait a moment and try again.");
      return await run({ user, db, audit: (e) => writeAudit(db, { ...e, actor: user.email }) });
    } catch (error) {
      console.error("[action] failed", error);
      return actionError("Something went wrong. Try again.");
    }
  }

  /** Per-IP limiter for the public sign-in endpoints. */
  async function limitSignIn(): Promise<boolean> {
    const db = getDb();
    if (!db) return true;
    const h = await headers();
    return (await hitRateLimit(db, `signin:${clientIpHash(h)}`, 20, 60)).allowed;
  }

  async function touchUserRole(email: string, role: Role, actor: string) {
    const db = getDb();
    if (!db) return;
    await db.update(schema.users).set({ role }).where(eq(schema.users.email, email));
    await writeAudit(db, {
      actor,
      action: "user.role",
      entity: "user",
      entityId: email,
      summary: `Role set to ${role}`,
    });
  }

  return {
    ...nextAuth,
    currentUser,
    requireUser,
    requirePageUser,
    guarded,
    limitSignIn,
    touchUserRole,
    isOpenSignIn: isOpenSignIn(),
    domain,
  };
}

export type AuthKit = ReturnType<typeof createAuthKit>;
