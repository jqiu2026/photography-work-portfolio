"use server";

import { schema } from "@jerryqiu/db";
import * as portal from "@jerryqiu/db/portal";
import { StudioError } from "@jerryqiu/db/studio";
import { sendTemplate } from "@jerryqiu/email";
import { getSite } from "@jerryqiu/sites";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { studio } from "@/lib/studio-run";

const id = z.string().uuid();

export async function inviteClientAction(clientId: string) {
  return studio(async ({ db }) => {
    const p = id.safeParse(clientId);
    if (!p.success) throw new StudioError("Pick a client.");
    const { token, account } = await portal.inviteClient(db, p.data);
    const [c] = await db.select().from(schema.studioClients).where(eq(schema.studioClients.id, p.data));
    await sendTemplate(
      db,
      account.email,
      "portal-invite",
      { name: c?.name, link: `${getSite("photos").url}/client/login/reset?t=${token}` },
      { related: { type: "account", id: account.id } },
    );
    return {
      message: `Invitation sent to ${account.email} (see the Inbox).`,
      audit: {
        action: "studio.portal.invite",
        entity: "client_account",
        entityId: account.id,
        summary: `Invited ${account.email} to the portal`,
      },
    };
  });
}

export async function replyMessageAction(input: { clientId: string; body: string }) {
  return studio(async ({ db }) => {
    const p = id.safeParse(input.clientId);
    if (!p.success) throw new StudioError("Pick a client.");
    const [c] = await db.select().from(schema.studioClients).where(eq(schema.studioClients.id, p.data));
    if (!c) throw new StudioError("Unknown client.");
    await portal.postMessage(db, { clientId: c.id, direction: "out", body: input.body });
    await portal.markRead(db, c.id, "in");
    await sendTemplate(
      db,
      c.email,
      "client-message",
      {
        title: "A message from your photographer",
        summary: input.body.slice(0, 1500),
        link: `${getSite("photos").url}/client/messages`,
        linkLabel: "Read and reply in your portal",
      },
      { related: { type: "client", id: c.id } },
    );
    return { message: "Sent" };
  });
}

export async function setEtaAction(input: { jobId: string; date: string }) {
  return studio(async ({ db }) => {
    const p = id.safeParse(input.jobId);
    if (!p.success) throw new StudioError("Unknown job.");
    if (input.date && !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new StudioError("Pick a date.");
    await db
      .update(schema.studioJobs)
      .set({ deliveryEta: input.date || null, updatedAt: new Date() })
      .where(eq(schema.studioJobs.id, p.data));
    return {
      message: input.date ? "Estimated delivery saved" : "Estimated delivery cleared",
      audit: {
        action: "studio.job.eta",
        entity: "studio_job",
        entityId: p.data,
        summary: `Set estimated delivery ${input.date || "(none)"}`,
      },
    };
  });
}
