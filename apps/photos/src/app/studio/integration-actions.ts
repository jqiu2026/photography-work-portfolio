"use server";

import * as keys from "@jerryqiu/db/api-keys";
import { StudioError } from "@jerryqiu/db/studio";
import * as hooks from "@jerryqiu/db/webhooks";
import { z } from "zod";
import { studio, studioOwner } from "@/lib/studio-run";

const id = z.string().uuid();

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

export async function createApiKeyAction(name: string) {
  return studioOwner(async ({ db }) => {
    const { key, row } = await keys.createApiKey(db, name);
    return {
      message: "Key made. Copy it now: it is shown only once.",
      extra: { key },
      audit: { action: "studio.apikey.add", entity: "api-key", entityId: row.id, summary: `Made API key ${row.name}` },
    };
  });
}
export async function revokeApiKeyAction(keyId: string) {
  return studioOwner(async ({ db }) => {
    const p = id.safeParse(keyId);
    if (!p.success) throw new StudioError("Unknown key.");
    await keys.revokeApiKey(db, p.data);
    return {
      message: "Key revoked",
      audit: { action: "studio.apikey.revoke", entity: "api-key", entityId: p.data, summary: "Revoked an API key" },
    };
  });
}
