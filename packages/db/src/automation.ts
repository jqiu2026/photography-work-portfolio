import { and, asc, desc, eq, gt, isNull, lt, sql } from "drizzle-orm";
import { z } from "zod";
import { getStudioSetting, setStudioSetting } from "./calendar";
import type { Database } from "./client";
import { StudioError } from "./errors";
import { galleryState } from "./gallery-expiry";
import * as s from "./schema";

/**
 * Automations: a fixed set of well-understood rules (trigger, condition, action) that find things needing a nudge. Each rule can
 * be switched off and tuned (how many days). The database side only FINDS what is due and records runs; the app sends the emails.
 * A run is claimed by a unique key first, so overlapping cron calls and retries never send twice.
 */
export const RULES = {
  "invoice-due": {
    name: "Invoice due soon",
    blurb: "Remind a client when an unpaid invoice is due within this many days.",
    days: 3,
  },
  "invoice-overdue": {
    name: "Invoice overdue",
    blurb: "Remind a client once an invoice is this many days past due.",
    days: 2,
  },
  "questionnaire-pending": {
    name: "Questionnaire not answered",
    blurb: "Nudge when a questionnaire has waited this many days.",
    days: 3,
  },
  "gallery-expiring": {
    name: "Gallery expiring",
    blurb: "Tell a client when their gallery ends within this many days.",
    days: 14,
  },
  "post-shoot-thanks": {
    name: "Thank you after the shoot",
    blurb: "Thank the client this many days after the job reaches Shot.",
    days: 1,
  },
  "quote-unanswered": {
    name: "Quote not answered",
    blurb: "Follow up when a quote has waited this many days.",
    days: 5,
  },
  "appointment-reminder": {
    name: "Appointment tomorrow",
    blurb: "Remind a client this many days before an appointment.",
    days: 1,
  },
} as const;
export type RuleKey = keyof typeof RULES;

export const automationSettingsSchema = z.object({
  rules: z
    .record(
      z.string(),
      z.object({
        enabled: z.boolean().default(true),
        days: z.number().int().min(0).max(365).optional(),
        message: z.string().max(1000).optional(),
      }),
    )
    .default({}),
});
export type AutomationSettings = z.infer<typeof automationSettingsSchema>;
export const getAutomationSettings = (db: Database) => getStudioSetting(db, "automations", automationSettingsSchema);
export async function saveRule(
  db: Database,
  key: RuleKey,
  patch: { enabled?: boolean; days?: number; message?: string },
) {
  if (!(key in RULES)) throw new StudioError("Unknown rule.");
  if (patch.days !== undefined && (!Number.isInteger(patch.days) || patch.days < 0 || patch.days > 365))
    throw new StudioError("Days are 0 to 365.");
  const cur = await getAutomationSettings(db);
  const next = { rules: { ...cur.rules, [key]: { ...cur.rules[key], ...patch } } };
  await setStudioSetting(db, "automations", automationSettingsSchema.parse(next));
}
export async function ruleConfig(db: Database) {
  const cfg = await getAutomationSettings(db);
  return (Object.keys(RULES) as RuleKey[]).map((key) => ({
    key,
    ...RULES[key],
    enabled: cfg.rules[key]?.enabled ?? true,
    days: cfg.rules[key]?.days ?? RULES[key].days,
    message: cfg.rules[key]?.message ?? "",
  }));
}

/** Claims one run. Returns false when this exact thing has already been done (or is being done by another caller). */
export async function claimRun(
  db: Database,
  run: { key: string; rule: string; entityType?: string; entityId?: string; detail?: string },
) {
  const rows = await db
    .insert(s.studioAutomationRuns)
    .values({
      dedupeKey: run.key,
      rule: run.rule,
      entityType: run.entityType ?? null,
      entityId: run.entityId ?? null,
      detail: run.detail ?? null,
    })
    .onConflictDoNothing()
    .returning({ id: s.studioAutomationRuns.id });
  return rows.length > 0;
}
export async function recentRuns(db: Database, limit = 50) {
  return db.select().from(s.studioAutomationRuns).orderBy(desc(s.studioAutomationRuns.at)).limit(limit);
}

/** Reminder preferences: a client with a portal account can switch reminders off (default on). Transactional email always goes. */
export async function remindersAllowed(db: Database, clientId: string): Promise<boolean> {
  const [a] = await db.select().from(s.clientAccounts).where(eq(s.clientAccounts.clientId, clientId));
  return a ? a.prefs.reminders : true;
}
export async function galleryReadyAllowed(db: Database, clientId: string): Promise<boolean> {
  const [a] = await db.select().from(s.clientAccounts).where(eq(s.clientAccounts.clientId, clientId));
  return a ? a.prefs.galleryReady : true;
}

const day = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);
export type Due = {
  rule: RuleKey;
  key: string;
  entityType: string;
  entityId: string;
  clientId: string;
  email: string;
  name: string;
  title: string;
  detail?: string;
  link?: { kind: "invoice" | "quote" | "questionnaire" | "gallery" | "job"; id: string };
  date?: string;
};

/** Everything a rule finds today. Pure reads, so it is safe to call as often as you like. */
export async function findDue(db: Database, rule: RuleKey, days: number, now = new Date()): Promise<Due[]> {
  const today = day(now);
  const out: Due[] = [];
  const clientOf = async (jobId: string) => {
    const [r] = await db
      .select({ job: s.studioJobs, client: s.studioClients })
      .from(s.studioJobs)
      .innerJoin(s.studioClients, eq(s.studioClients.id, s.studioJobs.clientId))
      .where(eq(s.studioJobs.id, jobId));
    return r;
  };
  if (rule === "invoice-due" || rule === "invoice-overdue") {
    const rows = await db
      .select()
      .from(s.studioInvoices)
      .where(
        and(
          sql`${s.studioInvoices.status} in ('sent','viewed','partial')`,
          isNull(s.studioInvoices.deletedAt),
          sql`${s.studioInvoices.dueDate} is not null`,
        ),
      );
    for (const inv of rows) {
      const due = inv.dueDate as string;
      const daysTo = Math.round(
        (new Date(`${due}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()) / 86_400_000,
      );
      const hit = rule === "invoice-due" ? daysTo >= 0 && daysTo <= days : daysTo <= -days;
      if (!hit) continue;
      const r = await clientOf(inv.jobId);
      if (!r) continue;
      out.push({
        rule,
        key: `${rule}:${inv.id}:${rule === "invoice-due" ? due : "late"}`,
        entityType: "invoice",
        entityId: inv.id,
        clientId: r.client.id,
        email: r.client.email,
        name: r.client.name,
        title: `Invoice ${inv.number}`,
        detail: `${(inv.totalCents / 100).toFixed(2)} due ${due}`,
        link: { kind: "invoice", id: inv.id },
        date: due,
      });
    }
  }
  if (rule === "questionnaire-pending") {
    const rows = await db
      .select({ send: s.studioQuestionnaireSends, client: s.studioClients })
      .from(s.studioQuestionnaireSends)
      .innerJoin(s.studioClients, eq(s.studioClients.id, s.studioQuestionnaireSends.clientId))
      .where(
        and(isNull(s.studioQuestionnaireSends.completedAt), lt(s.studioQuestionnaireSends.sentAt, addDays(now, -days))),
      );
    for (const r of rows)
      out.push({
        rule,
        key: `${rule}:${r.send.id}`,
        entityType: "questionnaire",
        entityId: r.send.id,
        clientId: r.client.id,
        email: r.client.email,
        name: r.client.name,
        title: r.send.title,
        link: { kind: "questionnaire", id: r.send.id },
      });
  }
  if (rule === "gallery-expiring") {
    const rows = await db
      .select({ g: s.studioGalleries, job: s.studioJobs, client: s.studioClients })
      .from(s.studioGalleries)
      .innerJoin(s.studioJobs, eq(s.studioJobs.id, s.studioGalleries.jobId))
      .innerJoin(s.studioClients, eq(s.studioClients.id, s.studioJobs.clientId))
      .where(
        and(
          eq(s.studioGalleries.status, "published"),
          isNull(s.studioGalleries.deletedAt),
          sql`${s.studioGalleries.expiresAt} is not null`,
        ),
      );
    for (const r of rows) {
      const ends = r.g.expiresAt as Date;
      if (galleryState(r.g, now, days) !== "expiring" || ends <= now) continue;
      out.push({
        rule,
        key: `${rule}:${r.g.id}:${day(ends)}`,
        entityType: "gallery",
        entityId: r.g.id,
        clientId: r.client.id,
        email: r.client.email,
        name: r.client.name,
        title: r.g.title,
        date: day(ends),
        link: { kind: "gallery", id: r.g.id },
      });
    }
  }
  if (rule === "post-shoot-thanks") {
    const rows = await db
      .select({ job: s.studioJobs, client: s.studioClients })
      .from(s.studioJobs)
      .innerJoin(s.studioClients, eq(s.studioClients.id, s.studioJobs.clientId))
      .where(
        and(
          eq(s.studioJobs.status, "shot"),
          lt(s.studioJobs.updatedAt, addDays(now, -days)),
          isNull(s.studioJobs.deletedAt),
        ),
      );
    for (const r of rows)
      out.push({
        rule,
        key: `${rule}:${r.job.id}`,
        entityType: "job",
        entityId: r.job.id,
        clientId: r.client.id,
        email: r.client.email,
        name: r.client.name,
        title: r.job.title,
        link: { kind: "job", id: r.job.id },
      });
  }
  if (rule === "quote-unanswered") {
    const rows = await db
      .select({ q: s.studioQuotes, client: s.studioClients })
      .from(s.studioQuotes)
      .innerJoin(s.studioClients, eq(s.studioClients.id, s.studioQuotes.clientId))
      .where(
        and(
          sql`${s.studioQuotes.status} in ('sent','viewed')`,
          lt(s.studioQuotes.sentAt, addDays(now, -days)),
          gt(s.studioQuotes.validUntil, now),
          isNull(s.studioQuotes.deletedAt),
        ),
      );
    for (const r of rows)
      out.push({
        rule,
        key: `${rule}:${r.q.id}`,
        entityType: "quote",
        entityId: r.q.id,
        clientId: r.client.id,
        email: r.client.email,
        name: r.client.name,
        title: `${r.q.number}: ${r.q.title}`,
        link: { kind: "quote", id: r.q.id },
      });
  }
  if (rule === "appointment-reminder") {
    const from = addDays(now, days);
    const rows = await db
      .select({ a: s.appointments, client: s.studioClients })
      .from(s.appointments)
      .innerJoin(s.studioClients, eq(s.studioClients.id, s.appointments.clientId))
      .where(
        and(
          eq(s.appointments.status, "confirmed"),
          gt(s.appointments.startsAt, now),
          lt(s.appointments.startsAt, from),
        ),
      );
    for (const r of rows)
      out.push({
        rule,
        key: `${rule}:${r.a.id}:${day(r.a.startsAt)}`,
        entityType: "appointment",
        entityId: r.a.id,
        clientId: r.client.id,
        email: r.client.email,
        name: r.client.name,
        title: r.a.title,
        date: r.a.startsAt.toISOString(),
        detail: r.a.location ?? undefined,
      });
  }
  return out;
}

/* ---------- tasks ---------- */
export async function addTask(
  db: Database,
  t: {
    title: string;
    dueOn?: string | null;
    notes?: string;
    jobId?: string | null;
    clientId?: string | null;
    source?: string;
  },
) {
  if (t.title.trim().length < 2) throw new StudioError("Give the task a title.");
  if (t.dueOn && !/^\d{4}-\d{2}-\d{2}$/.test(t.dueOn)) throw new StudioError("Pick a due date.");
  const [row] = await db
    .insert(s.studioTasks)
    .values({
      title: t.title.trim().slice(0, 200),
      dueOn: t.dueOn || null,
      notes: t.notes?.trim().slice(0, 1000) || null,
      jobId: t.jobId ?? null,
      clientId: t.clientId ?? null,
      source: t.source ?? null,
    })
    .returning();
  return row;
}
export async function setTaskDone(db: Database, id: string, done: boolean, now = new Date()) {
  await db
    .update(s.studioTasks)
    .set({ doneAt: done ? now : null })
    .where(eq(s.studioTasks.id, id));
}
export async function deleteTask(db: Database, id: string) {
  await db.delete(s.studioTasks).where(eq(s.studioTasks.id, id));
}
export async function listTasks(db: Database) {
  return db
    .select()
    .from(s.studioTasks)
    .orderBy(sql`${s.studioTasks.doneAt} is not null`, asc(s.studioTasks.dueOn), desc(s.studioTasks.createdAt));
}

/* ---------- notifications ---------- */
export async function notify(db: Database, n: { kind: string; title: string; body?: string; link?: string }) {
  await db
    .insert(s.studioNotifications)
    .values({ kind: n.kind, title: n.title.slice(0, 200), body: n.body?.slice(0, 500) ?? null, link: n.link ?? null })
    .catch(() => {});
}
export async function listNotifications(db: Database, limit = 100) {
  return db.select().from(s.studioNotifications).orderBy(desc(s.studioNotifications.createdAt)).limit(limit);
}
export async function unreadCount(db: Database) {
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(s.studioNotifications)
    .where(isNull(s.studioNotifications.readAt));
  return Number(n);
}
export async function markAllRead(db: Database, now = new Date()) {
  await db.update(s.studioNotifications).set({ readAt: now }).where(isNull(s.studioNotifications.readAt));
}
