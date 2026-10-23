"use server";

import * as drone from "@jerryqiu/db/drone";
import { StudioError } from "@jerryqiu/db/studio";
import * as hooks from "@jerryqiu/db/webhooks";
import { z } from "zod";
import { studio, studioOwner } from "@/lib/studio-run";

const id = z.string().uuid();

export async function saveDroneAction(input: {
  jobId: string;
  items: { text: string; done: boolean }[];
  weather: { windMph?: string; gustMph?: string; visibilityMi?: string; precipitation?: boolean; note?: string };
  decision: "go" | "no-go" | null;
}) {
  return studio(async ({ db }) => {
    const p = id.safeParse(input.jobId);
    if (!p.success) throw new StudioError("Pick a job.");
    await drone.saveChecklist(db, p.data, {
      items: input.items,
      weather: input.weather,
      decision: input.decision,
    });
    return {
      message: input.decision === "go" ? "Marked go" : input.decision === "no-go" ? "Marked no-go" : "Checklist saved",
    };
  });
}

export async function addWebhookAction(input: { url: string; events: string[] }) {
  return studioOwner(async ({ db }) => {
    const h = await hooks.addWebhook(db, input);
    return {
      message: "Webhook added. Copy the secret now: it is shown only once.",
      extra: { secret: h.secret },
      audit: {
        action: "studio.webhook.add",
        entity: "webhook",
        entityId: h.id,
        summary: `Added a webhook to ${new URL(h.url).host}`,
      },
    };
  });
}
export async function setWebhookActiveAction(input: { webhookId: string; active: boolean }) {
  return studioOwner(async ({ db }) => {
    const p = id.safeParse(input.webhookId);
    if (!p.success) throw new StudioError("Unknown webhook.");
    await hooks.setWebhookActive(db, p.data, input.active);
    return { message: input.active ? "Webhook on" : "Webhook off" };
  });
}
export async function deleteWebhookAction(webhookId: string) {
  return studioOwner(async ({ db }) => {
    const p = id.safeParse(webhookId);
    if (!p.success) throw new StudioError("Unknown webhook.");
    await hooks.deleteWebhook(db, p.data);
    return { message: "Webhook deleted" };
  });
}
