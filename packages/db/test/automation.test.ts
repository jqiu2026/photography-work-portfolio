import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, describe, expect, it } from "vitest";
import * as cal from "../src/calendar";
import * as auto from "../src/automation";
import type { Database } from "../src/client";
import * as forms from "../src/forms";
import * as portal from "../src/portal";
import * as schema from "../src/schema";
import * as st from "../src/studio";

const here = path.dirname(fileURLToPath(import.meta.url));
let db: Database;
let clientId: string;
let jobId: string;
const now = new Date("2027-06-10T12:00:00Z");
beforeAll(async () => {
  const d = drizzle(await PGlite.create(), { schema, casing: "snake_case" });
  await migrate(d, { migrationsFolder: path.join(here, "../drizzle") });
  db = d as unknown as Database;
  clientId = (await st.createClient(db, { name: "Auto Client", email: "auto@example.com" })).id;
  jobId = (await st.createJob(db, { clientId, title: "Auto job" })).id;
});

describe("claiming runs", () => {
  it("one run per key, even under concurrent calls", async () => {
    const rs = await Promise.all([1, 2, 3, 4].map(() => auto.claimRun(db, { key: "k:1", rule: "invoice-due" })));
    expect(rs.filter(Boolean)).toHaveLength(1);
    expect(await auto.claimRun(db, { key: "k:2", rule: "invoice-due" })).toBe(true);
  });
});

describe("rules find the right things", () => {
  it("invoice due soon and overdue use the due date and skip paid ones", async () => {
    const mk = async (due: string, pay = false) => {
      const inv = await st.createInvoice(db, { jobId, lines: [{ description: "x", amountCents: 5000 }], dueDate: due });
      await st.sendInvoice(db, inv.id);
      if (pay)
        await st.recordPayment(db, {
          invoiceId: inv.id,
          provider: "mock",
          providerRef: `p-${inv.id}`,
          amountCents: 5000,
          status: "succeeded",
        });
      return inv;
    };
    const soon = await mk("2027-06-12");
    await mk("2027-06-30");
    await mk("2027-06-11", true);
    const late = await mk("2027-06-05");
    const due = await auto.findDue(db, "invoice-due", 3, now);
    expect(due.map((x) => x.entityId)).toEqual([soon.id]);
    expect(due[0].key).toBe(`invoice-due:${soon.id}:2027-06-12`);
    const over = await auto.findDue(db, "invoice-overdue", 2, now);
    expect(over.map((x) => x.entityId)).toEqual([late.id]);
  });

  it("questionnaires waiting, quotes unanswered, galleries expiring, thanks after the shoot, appointments tomorrow", async () => {
    const q =
      (await forms.listQuestionnaires(db))[0] ??
      (await (async () => {
        await forms.seedSampleQuestionnaires(db);
        return (await forms.listQuestionnaires(db))[0];
      })());
    const sent = await forms.sendQuestionnaire(
      db,
      { questionnaireId: q.id, clientId, jobId },
      new Date("2027-06-01T00:00:00Z"),
    );
    expect((await auto.findDue(db, "questionnaire-pending", 3, now)).map((x) => x.entityId)).toEqual([sent.send.id]);
    await forms.submitQuestionnaire(
      db,
      sent.token,
      Object.fromEntries(
        sent.send.fields
          .filter((f) => f.required)
          .map((f) => [f.id, f.type === "yesno" ? "Yes" : f.type === "choice" ? (f.options?.[0] ?? "x") : "ok"]),
      ),
    );
    expect(await auto.findDue(db, "questionnaire-pending", 3, now)).toEqual([]);

    const g = await st.createGallery(db, { jobId, passcode: "auto-pass-123" });
    await st.publishGallery(db, g.id);
    await db
      .update(schema.studioGalleries)
      .set({ expiresAt: new Date("2027-06-20T00:00:00Z") })
      .where(eq(schema.studioGalleries.id, g.id));
    const exp = await auto.findDue(db, "gallery-expiring", 14, now);
    expect(exp.map((x) => x.entityId)).toEqual([g.id]);
    expect(exp[0].key).toBe(`gallery-expiring:${g.id}:2027-06-20`); // a new expiry date is a new reminder
    expect(await auto.findDue(db, "gallery-expiring", 5, now)).toEqual([]);

    await db
      .update(schema.studioJobs)
      .set({ status: "shot", updatedAt: new Date("2027-06-08T00:00:00Z") })
      .where(eq(schema.studioJobs.id, jobId));
    expect((await auto.findDue(db, "post-shoot-thanks", 1, now)).map((x) => x.entityId)).toEqual([jobId]);

    const planned = await cal.addAppointment(db, {
      title: "Shoot tomorrow",
      startsAt: new Date("2027-06-11T10:00:00Z"),
      endsAt: new Date("2027-06-11T11:00:00Z"),
      jobId,
      clientId,
    });
    expect((await auto.findDue(db, "appointment-reminder", 1, now)).map((x) => x.entityId)).toEqual([planned.id]);
    expect(await auto.findDue(db, "appointment-reminder", 0, now)).toEqual([]);

    await db.update(schema.studioJobs).set({ status: "inquiry" }).where(eq(schema.studioJobs.id, jobId));
    const { createClient } = st;
    void createClient;
  });
});

describe("settings, preferences, tasks, notifications", () => {
  it("rules default on, can be switched off and tuned, and bad values are refused", async () => {
    expect((await auto.ruleConfig(db)).every((r) => r.enabled)).toBe(true);
    await auto.saveRule(db, "invoice-due", { enabled: false, days: 7, message: "Gentle nudge." });
    const r = (await auto.ruleConfig(db)).find((x) => x.key === "invoice-due");
    expect(r).toMatchObject({ enabled: false, days: 7, message: "Gentle nudge." });
    await expect(auto.saveRule(db, "invoice-due", { days: 999 })).rejects.toThrow();
    await expect(auto.saveRule(db, "nope" as never, {})).rejects.toThrow(/Unknown/);
  });

  it("a client who switched reminders off is not nudged, but defaults to yes", async () => {
    expect(await auto.remindersAllowed(db, clientId)).toBe(true);
    const acct = await portal.ensureAccount(db, clientId);
    await portal.savePrefs(db, acct.id, { galleryReady: true, reminders: false, news: false });
    expect(await auto.remindersAllowed(db, clientId)).toBe(false);
    expect(await auto.galleryReadyAllowed(db, clientId)).toBe(true);
  });

  it("tasks: add, complete, sort open first, delete", async () => {
    const a = await auto.addTask(db, { title: "Edit the spring set", dueOn: "2027-06-15" });
    await auto.addTask(db, { title: "Order cards", dueOn: "2027-06-12" });
    await expect(auto.addTask(db, { title: "x" })).rejects.toThrow();
    await auto.setTaskDone(db, a.id, true);
    const list = await auto.listTasks(db);
    expect(list.map((t) => t.title)).toEqual(["Order cards", "Edit the spring set"]);
    await auto.deleteTask(db, a.id);
    expect(await auto.listTasks(db)).toHaveLength(1);
  });

  it("notifications count unread and clear", async () => {
    await auto.notify(db, { kind: "inquiry", title: "New inquiry" });
    await auto.notify(db, { kind: "payment", title: "Paid", body: "$50", link: "/studio/billing" });
    expect(await auto.unreadCount(db)).toBe(2);
    await auto.markAllRead(db);
    expect(await auto.unreadCount(db)).toBe(0);
    expect((await auto.listNotifications(db))[0].kind).toBeTruthy();
  });
});
