"use server";

import * as auto from "@jerryqiu/db/automation";
import { StudioError } from "@jerryqiu/db/studio";
import { z } from "zod";
import { runScheduled } from "@/lib/automations";
import { created, mayRemove, studio, studioOwner } from "@/lib/studio-run";

const id = z.string().uuid();

export async function addTaskAction(input: { title: string; dueOn?: string; notes?: string }) {
  return studio(async ({ db }) => {
    await auto.addTask(db, { title: input.title, dueOn: input.dueOn || null, notes: input.notes });
    return { message: "Task added" };
  });
}
export async function toggleTaskAction(input: { taskId: string; done: boolean }) {
  return studio(async ({ db }) => {
    const p = id.safeParse(input.taskId);
    if (!p.success) throw new StudioError("Unknown task.");
    await auto.setTaskDone(db, p.data, input.done);
    return { message: input.done ? "Done" : "Reopened" };
  });
}
export async function deleteTaskAction(taskId: string) {
  return studio(async (ctx) => {
    const { db } = ctx;
    await mayRemove(ctx, "task", taskId);
    const p = id.safeParse(taskId);
    if (!p.success) throw new StudioError("Unknown task.");
    await auto.deleteTask(db, p.data);
    return { message: "Task removed" };
  });
}
export async function saveRuleAction(input: { key: string; enabled: boolean; days: string; message: string }) {
  return studioOwner(async ({ db }) => {
    if (!(input.key in auto.RULES)) throw new StudioError("Unknown rule.");
    await auto.saveRule(db, input.key as auto.RuleKey, {
      enabled: input.enabled,
      days: Number(input.days),
      message: input.message,
    });
    return {
      message: "Rule saved",
      audit: {
        action: "studio.automation.save",
        entity: "studio_setting",
        entityId: "automations",
        summary: `Updated rule ${input.key}`,
      },
    };
  });
}
export async function runAutomationsNowAction() {
  return studioOwner(async ({ db }) => {
    const r = await runScheduled(db);
    return {
      message: `Ran now: ${r.automations.sent} reminder(s) sent, ${r.billing.recurring} recurring and ${r.billing.installments} instalment invoice(s).`,
    };
  });
}
export async function markNotificationsReadAction() {
  return studio(async ({ db }) => {
    await auto.markAllRead(db);
    return { message: "All marked read" };
  });
}
