"use server";

import { getDb, hitRateLimit, schema } from "@jerryqiu/db";
import * as cal from "@jerryqiu/db/calendar";
import * as forms from "@jerryqiu/db/forms";
import * as portal from "@jerryqiu/db/portal";
import { StudioError } from "@jerryqiu/db/studio";
import { passwordProblem } from "@jerryqiu/db/studio-crypto";
import { sendTemplate } from "@jerryqiu/email";
import { getSite } from "@jerryqiu/sites";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { accountSession, endAccountSession, startAccountSession } from "@/lib/account-session";
import { requestIpHash } from "@/lib/portal";

export type AccountResult = { ok: true; message?: string } | { ok: false; error: string };
const no = (error: string): AccountResult => ({ ok: false, error });
const base = () => getSite("photos").url;
const GENERIC_LINK = "If that email belongs to a client, a link is on its way. It works once and expires soon.";

async function limit(key: string, max: number, windowSec: number) {
  const db = getDb();
  if (!db) return null;
  const ip = await requestIpHash();
  const r = await hitRateLimit(db, `${key}:${ip}`, max, windowSec);
  return r.allowed ? db : null;
}

export async function passwordLoginAction(_prev: AccountResult | null, formData: FormData): Promise<AccountResult> {
  const db = await limit("acct-login", 10, 600);
  if (!db) return no("Too many tries. Wait a few minutes, or use an emailed sign-in link.");
  const r = await portal.loginWithPassword(
    db,
    String(formData.get("email") ?? ""),
    String(formData.get("password") ?? ""),
  );
  if (!r.ok) return no(r.error);
  await startAccountSession(r.account.id);
  redirect("/client/home");
}

export async function requestMagicLinkAction(_prev: AccountResult | null, formData: FormData): Promise<AccountResult> {
  const db = await limit("acct-magic", 5, 600);
  if (!db) return no("Too many tries. Wait a few minutes and try again.");
  const email = String(formData.get("email") ?? "");
  const perEmail = await hitRateLimit(db, `acct-magic-email:${email.trim().toLowerCase()}`, 3, 600);
  if (perEmail.allowed) {
    const r = await portal.requestMagicLink(db, email);
    if (r) {
      const [c] = await db.select().from(schema.studioClients).where(eq(schema.studioClients.id, r.account.clientId));
      await sendTemplate(
        db,
        r.account.email,
        "magic-link",
        { name: c?.name, link: `${base()}/client/login/verify?t=${r.token}`, linkLabel: "Sign in" },
        { related: { type: "account", id: r.account.id } },
      );
    }
  }
  return { ok: true, message: GENERIC_LINK };
}

export async function requestResetAction(_prev: AccountResult | null, formData: FormData): Promise<AccountResult> {
  const db = await limit("acct-reset", 5, 600);
  if (!db) return no("Too many tries. Wait a few minutes and try again.");
  const email = String(formData.get("email") ?? "");
  const perEmail = await hitRateLimit(db, `acct-reset-email:${email.trim().toLowerCase()}`, 3, 600);
  if (perEmail.allowed) {
    const r = await portal.requestPasswordReset(db, email);
    if (r) {
      const [c] = await db.select().from(schema.studioClients).where(eq(schema.studioClients.id, r.account.clientId));
      await sendTemplate(
        db,
        r.account.email,
        "password-reset",
        { name: c?.name, link: `${base()}/client/login/reset?t=${r.token}` },
        { related: { type: "account", id: r.account.id } },
      );
    }
  }
  return { ok: true, message: GENERIC_LINK };
}

/** The emailed link only shows a button; consuming the token happens here (so mail scanners that open links cannot use it up). */
export async function confirmLoginAction(token: string): Promise<AccountResult> {
  const db = await limit("acct-verify", 10, 600);
  if (!db || token.length > 80) return no("Try again in a moment.");
  const used = await portal.consumeToken(db, token, ["magic", "invite"]);
  if (!used) return no("This link has expired or was already used. Ask for a new one.");
  await portal.markLogin(db, used.account.id);
  await startAccountSession(used.account.id);
  redirect(used.kind === "invite" ? "/client/account?welcome=1" : "/client/home");
}

export async function resetPasswordAction(
  token: string,
  _prev: AccountResult | null,
  formData: FormData,
): Promise<AccountResult> {
  const db = await limit("acct-resetpw", 10, 600);
  if (!db || token.length > 80) return no("Try again in a moment.");
  const pw = String(formData.get("password") ?? "");
  if (pw !== String(formData.get("confirm") ?? "")) return no("The two passwords do not match.");
  const acct = await portal.tokenAccount(db, token, ["reset", "invite"]);
  if (!acct) return no("This link has expired or was already used. Ask for a new one.");
  // Check the password BEFORE spending the one-time link, so a too-short try does not burn it.
  const problem = passwordProblem(pw, acct.email);
  if (problem) return no(problem);
  try {
    const used = await portal.consumeToken(db, token, ["reset", "invite"]);
    if (!used) return no("This link has expired or was already used. Ask for a new one.");
    await portal.setPassword(db, used.account.id, pw);
    await portal.markLogin(db, used.account.id);
    await startAccountSession(used.account.id);
  } catch (e) {
    return no(e instanceof StudioError ? e.message : "Could not set the password.");
  }
  redirect("/client/home");
}

export async function logoutAccountAction() {
  await endAccountSession();
  redirect("/client");
}

export async function changePasswordAction(_prev: AccountResult | null, formData: FormData): Promise<AccountResult> {
  const me = await accountSession();
  const db = await limit("acct-chpw", 10, 600);
  if (!me || !db) return no("Please sign in again.");
  const next = String(formData.get("password") ?? "");
  if (next !== String(formData.get("confirm") ?? "")) return no("The two passwords do not match.");
  try {
    await portal.changePassword(db, me.account.id, String(formData.get("current") ?? ""), next);
    return { ok: true, message: "Password saved." };
  } catch (e) {
    return no(e instanceof StudioError ? e.message : "Could not change the password.");
  }
}

export async function savePrefsAction(_prev: AccountResult | null, formData: FormData): Promise<AccountResult> {
  const me = await accountSession();
  const db = getDb();
  if (!me || !db) return no("Please sign in again.");
  await portal.savePrefs(db, me.account.id, {
    galleryReady: formData.get("galleryReady") === "on",
    reminders: formData.get("reminders") === "on",
    news: formData.get("news") === "on",
  });
  return { ok: true, message: "Preferences saved." };
}

export async function sendMessageAction(_prev: AccountResult | null, formData: FormData): Promise<AccountResult> {
  const me = await accountSession();
  const db = await limit("acct-msg", 20, 600);
  if (!me || !db) return no("Please sign in again, or try later.");
  try {
    const jobId = String(formData.get("jobId") ?? "");
    await portal.postMessage(db, {
      clientId: me.client.id,
      jobId: /^[0-9a-f-]{36}$/i.test(jobId) ? jobId : null,
      direction: "in",
      body: String(formData.get("body") ?? ""),
    });
    const owner = process.env.CONTACT_TO_EMAIL?.trim();
    if (owner || process.env.NODE_ENV !== "production")
      await sendTemplate(
        db,
        owner || "owner@photo.invalid",
        "client-message",
        {
          title: `New message from ${me.client.name}`,
          summary: String(formData.get("body") ?? "").slice(0, 600),
          link: `${base()}/studio/messages`,
          linkLabel: "Open the studio",
        },
        { related: { type: "client", id: me.client.id }, replyTo: me.client.email },
      );
    return { ok: true, message: "Sent." };
  } catch (e) {
    return no(e instanceof StudioError ? e.message : "Could not send the message.");
  }
}

async function ownAppointment(db: NonNullable<ReturnType<typeof getDb>>, clientId: string, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new StudioError("Unknown appointment.");
  const [a] = await db.select().from(schema.appointments).where(eq(schema.appointments.id, id));
  if (!a || a.clientId !== clientId || a.status === "cancelled") throw new StudioError("Unknown appointment.");
  const policies = await forms.getPolicies(db);
  const hoursLeft = (a.startsAt.getTime() - Date.now()) / 3_600_000;
  if (hoursLeft < policies.cancellationDays * 24)
    throw new StudioError(
      `This is inside the ${policies.cancellationDays}-day window for changes. Please message me and we will sort it out.`,
    );
  return a;
}

export async function cancelMyAppointmentAction(appointmentId: string): Promise<AccountResult> {
  const me = await accountSession();
  const db = await limit("acct-appt", 20, 600);
  if (!me || !db) return no("Please sign in again.");
  try {
    const a = await ownAppointment(db, me.client.id, appointmentId);
    await cal.cancelAppointment(db, a.id);
    const owner = process.env.CONTACT_TO_EMAIL?.trim();
    if (owner || process.env.NODE_ENV !== "production")
      await sendTemplate(
        db,
        owner || "owner@photo.invalid",
        "client-message",
        {
          title: `${me.client.name} cancelled ${a.title}`,
          summary: "Cancelled from the client portal. The time is free again.",
        },
        { related: { type: "appointment", id: a.id } },
      );
    return { ok: true, message: "Cancelled. A deposit is handled as the agreement says; I'll be in touch." };
  } catch (e) {
    return no(e instanceof StudioError ? e.message : "Could not cancel.");
  }
}

/** Moves the appointment to another offered time (same length), inside the policy window. The old time is restored if the new one fails. */
export async function rescheduleMyAppointmentAction(appointmentId: string, startIso: string): Promise<AccountResult> {
  const me = await accountSession();
  const db = await limit("acct-appt", 20, 600);
  if (!me || !db) return no("Please sign in again.");
  try {
    const a = await ownAppointment(db, me.client.id, appointmentId);
    const c = await cal.getCalendarSettings(db);
    const minutes = Math.round((a.endsAt.getTime() - a.startsAt.getTime()) / 60_000);
    const startsAt = new Date(startIso);
    if (Number.isNaN(startsAt.getTime())) return no("Pick a time.");
    const policies = await forms.getPolicies(db);
    if ((startsAt.getTime() - Date.now()) / 3_600_000 < policies.cancellationDays * 24)
      return no(`Pick a time at least ${policies.cancellationDays} days away, or message me.`);
    // Free the old time first so the new slot check does not collide with it; put it back if anything fails.
    await cal.cancelAppointment(db, a.id);
    try {
      const date = cal.localDate(startsAt, c.timezone);
      const offered = await cal.slotsForDate(db, date, { durationMin: minutes, settings: c });
      if (!offered.some((s) => s.startsAt.getTime() === startsAt.getTime()))
        throw new StudioError("That time is not available. Pick another.");
      await cal.addAppointment(db, {
        kind: a.kind,
        status: "confirmed",
        title: a.title,
        startsAt,
        endsAt: new Date(startsAt.getTime() + minutes * 60_000),
        bufferBeforeMin: a.bufferBeforeMin,
        bufferAfterMin: a.bufferAfterMin,
        travelMin: a.travelMin,
        location: a.location ?? undefined,
        jobId: a.jobId,
        clientId: a.clientId,
        bookingId: a.bookingId,
        invoiceId: a.invoiceId,
      });
    } catch (e) {
      await db
        .update(schema.appointments)
        .set({ status: "confirmed", updatedAt: new Date() })
        .where(eq(schema.appointments.id, a.id));
      throw e;
    }
    await sendTemplate(
      db,
      me.client.email,
      "booking-confirmed",
      {
        name: me.client.name,
        title: a.title,
        date: new Intl.DateTimeFormat("en-US", { timeZone: c.timezone, dateStyle: "full", timeStyle: "short" }).format(
          startsAt,
        ),
        detail: "Your new time is confirmed.",
      },
      { related: { type: "appointment", id: a.id } },
    );
    return { ok: true, message: "Moved. A confirmation is on its way." };
  } catch (e) {
    return no(e instanceof StudioError ? e.message : "Could not reschedule.");
  }
}
