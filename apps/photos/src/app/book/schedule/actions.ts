"use server";

import { getDb, hitRateLimit, schema } from "@jerryqiu/db";
import { notify } from "@jerryqiu/db/automation";
import * as cal from "@jerryqiu/db/calendar";
import * as st from "@jerryqiu/db/studio";
import { sendTemplate } from "@jerryqiu/email";
import { clientIpHash } from "@jerryqiu/protect";
import { getSite } from "@jerryqiu/sites";
import { and, eq, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { scheduleKind } from "@/lib/scheduling";

export type HoldResult = { ok: true; payUrl?: string; message: string } | { ok: false; error: string };

const input = z.object({
  kind: z.string(),
  start: z.string().datetime(),
  name: z.string().trim().min(2, "Please tell me your name.").max(120),
  email: z
    .string()
    .trim()
    .max(200)
    .regex(/^\S+@\S+\.\S+$/, "That doesn't look like an email address."),
  notes: z.string().trim().max(2000).optional().default(""),
  consent: z.literal(true, { error: "Please tick the box so I can store your details." }),
  website: z.string().max(200).optional().default(""),
});

/**
 * Public: books a time. A consultation is confirmed at once. A paid session is HELD for the configured minutes and a
 * deposit invoice is created; paying it (Stripe Checkout, or the labelled mock) confirms the booking. The slot is
 * re-checked against the live calendar here, and the database refuses an overlap even if two people race.
 */
export async function bookSlotAction(raw: z.input<typeof input>): Promise<HoldResult> {
  const p = input.safeParse(raw);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  if (p.data.website) return { ok: true, message: "Thanks." };
  const kind = scheduleKind(p.data.kind);
  const db = getDb();
  if (!kind || !db) return { ok: false, error: "Booking is not available right now." };
  const ip = clientIpHash(await headers());
  if (!(await hitRateLimit(db, `schedule:${ip}`, 6, 600)).allowed)
    return { ok: false, error: "Too many tries. Please wait a few minutes." };
  try {
    const c = await cal.getCalendarSettings(db);
    const startsAt = new Date(p.data.start);
    const date = cal.localDate(startsAt, c.timezone);
    const minutes = c.durations[kind.durationKey];
    const offered = await cal.slotsForDate(db, date, { durationMin: minutes, settings: c });
    if (!offered.some((s) => s.startsAt.getTime() === startsAt.getTime()))
      return { ok: false, error: "That time is no longer available. Pick another." };

    const email = p.data.email.toLowerCase();
    const [existing] = await db
      .select()
      .from(schema.studioClients)
      .where(and(eq(schema.studioClients.email, email), isNull(schema.studioClients.deletedAt)));
    const client = existing ?? (await st.createClient(db, { name: p.data.name, email }));
    const job = await st.createJob(db, {
      clientId: client.id,
      title: `${kind.label}: ${p.data.name}`,
      date,
      type: kind.slug,
    });
    if (p.data.notes)
      await db.update(schema.studioJobs).set({ notes: p.data.notes }).where(eq(schema.studioJobs.id, job.id));
    const endsAt = new Date(startsAt.getTime() + minutes * 60_000);
    const buffers = { bufferBeforeMin: c.defaultBufferMin, bufferAfterMin: c.defaultBufferMin };

    if (!kind.deposit || c.depositCents <= 0) {
      const a = await cal.addAppointment(db, {
        kind: kind.slug === "consult" ? "consult" : "shoot",
        title: `${kind.label}: ${p.data.name}`,
        startsAt,
        endsAt,
        ...buffers,
        jobId: job.id,
        clientId: client.id,
      });
      await sendTemplate(
        db,
        email,
        "booking-confirmed",
        {
          name: p.data.name,
          title: a.title,
          date: new Intl.DateTimeFormat("en-US", {
            timeZone: c.timezone,
            dateStyle: "full",
            timeStyle: "short",
          }).format(startsAt),
          detail: "I'll send details before we meet.",
        },
        { related: { type: "appointment", id: a.id } },
      );
      await notify(db, { kind: "booking", title: `Booked: ${a.title}`, link: "/studio/calendar" });
      return { ok: true, message: "You're booked. A confirmation is on its way to your inbox." };
    }

    const invoice = await st.createInvoice(db, {
      jobId: job.id,
      lines: [{ description: `Booking deposit (${kind.label})`, amountCents: c.depositCents }],
    });
    const hold = await cal.addAppointment(db, {
      kind: "shoot",
      status: "hold",
      title: `${kind.label}: ${p.data.name}`,
      startsAt,
      endsAt,
      ...buffers,
      jobId: job.id,
      clientId: client.id,
      invoiceId: invoice.id,
      holdUntil: new Date(Date.now() + c.holdMinutes * 60_000),
    });
    const { token } = await st.sendInvoice(db, invoice.id);
    const payUrl = `/client/pay/${token}`;
    await sendTemplate(
      db,
      email,
      "reminder",
      {
        name: p.data.name,
        title: "Pay your deposit to confirm your time",
        summary: `Your ${kind.label.toLowerCase()} is held for ${c.holdMinutes} minutes. Pay the deposit to confirm it.`,
        link: `${getSite("photos").url}${payUrl}`,
        linkLabel: "Pay the deposit",
      },
      { related: { type: "appointment", id: hold.id } },
    );
    return { ok: true, payUrl, message: "Your time is held. Pay the deposit to confirm it." };
  } catch (error) {
    if (error instanceof st.StudioError) return { ok: false, error: error.message };
    console.error("[schedule] failed", error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

const mini = z.object({
  slotId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  email: z
    .string()
    .trim()
    .max(200)
    .regex(/^\S+@\S+\.\S+$/),
  consent: z.literal(true),
});

/** Public: books one open mini-session slot (atomic: one person wins), then emails the confirmation. */
export async function bookMinislotAction(raw: z.input<typeof mini>): Promise<HoldResult> {
  const p = mini.safeParse(raw);
  if (!p.success) return { ok: false, error: "Please fill in your name and email and tick the box." };
  const db = getDb();
  if (!db) return { ok: false, error: "Booking is not available right now." };
  const ip = clientIpHash(await headers());
  if (!(await hitRateLimit(db, `schedule:${ip}`, 6, 600)).allowed)
    return { ok: false, error: "Too many tries. Please wait a few minutes." };
  try {
    const email = p.data.email.toLowerCase();
    const [existing] = await db
      .select()
      .from(schema.studioClients)
      .where(and(eq(schema.studioClients.email, email), isNull(schema.studioClients.deletedAt)));
    const client = existing ?? (await st.createClient(db, { name: p.data.name, email }));
    const a = await cal.bookMinislot(db, p.data.slotId, { clientId: client.id });
    const c = await cal.getCalendarSettings(db);
    await sendTemplate(
      db,
      email,
      "booking-confirmed",
      {
        name: p.data.name,
        title: a.groupLabel ?? a.title,
        date: new Intl.DateTimeFormat("en-US", { timeZone: c.timezone, dateStyle: "full", timeStyle: "short" }).format(
          a.startsAt,
        ),
        detail: a.location ? `Location: ${a.location}` : "",
      },
      { related: { type: "appointment", id: a.id } },
    );
    return { ok: true, message: "You're booked. A confirmation is on its way." };
  } catch (error) {
    if (error instanceof st.StudioError) return { ok: false, error: error.message };
    console.error("[minis] failed", error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

const wait = z.object({
  name: z.string().trim().min(2).max(120),
  email: z
    .string()
    .trim()
    .max(200)
    .regex(/^\S+@\S+\.\S+$/),
  wanted: z.string().trim().min(2).max(120),
});

/** Public: joins the waitlist for a day or a mini-session. */
export async function joinWaitlistAction(raw: z.input<typeof wait>): Promise<HoldResult> {
  const p = wait.safeParse(raw);
  if (!p.success) return { ok: false, error: "Please fill in your name and email." };
  const db = getDb();
  if (!db) return { ok: false, error: "The waitlist is not available right now." };
  const ip = clientIpHash(await headers());
  if (!(await hitRateLimit(db, `waitlist:${ip}`, 5, 600)).allowed) return { ok: false, error: "Too many tries." };
  try {
    await cal.joinWaitlist(db, p.data);
    return { ok: true, message: "You're on the list. I'll email you if a spot opens." };
  } catch (error) {
    if (error instanceof st.StudioError) return { ok: false, error: error.message };
    throw error;
  }
}
