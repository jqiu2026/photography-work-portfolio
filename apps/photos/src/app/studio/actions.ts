"use server";

import { actionError } from "@jerryqiu/auth/server";
import * as forms from "@jerryqiu/db/forms";
import * as st from "@jerryqiu/db/studio";
import { getSite } from "@jerryqiu/sites";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { schema } from "@jerryqiu/db";
import { galleryReadyAllowed } from "@jerryqiu/db/automation";
import { sendTemplate } from "@jerryqiu/email";
import { eq } from "drizzle-orm";
import { guarded } from "@/auth";
import { afterPayment } from "@/lib/after-payment";
import { publishAndNotify } from "@/lib/gallery-publish";
import { studio, studioMoney } from "@/lib/studio-run";
import { formatMoney } from "@jerryqiu/db/pricing";

/**
 * Owner-side studio actions (Phase 3). Every action re-checks the session and role (`studio.access`), rate limits, and
 * writes the audit log. Only async functions are exported from this "use server" file.
 */
const id = z.string().uuid();
const done = (message: string, extra: Record<string, unknown> = {}) => ({ ok: true as const, message, ...extra });
const fail = (e: unknown) => (e instanceof st.StudioError ? actionError(e.message) : null);
const back = () => revalidatePath("/studio", "layout");

export async function addClientAction(input: {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  notes?: string;
}) {
  return guarded("studio.access", async ({ db, audit }) => {
    try {
      const c = await st.createClient(db, input);
      await audit({
        action: "studio.client.create",
        entity: "studio_client",
        entityId: c.id,
        site: "photos",
        summary: `Added client ${c.name}`,
      });
      back();
      return done("Client added");
    } catch (e) {
      const f = fail(e);
      if (f) return f;
      throw e;
    }
  });
}

export async function addJobAction(input: {
  clientId: string;
  title: string;
  date?: string;
  location?: string;
  feeDollars?: string;
}) {
  return guarded("studio.access", async ({ db, audit }) => {
    const parsed = id.safeParse(input.clientId);
    if (!parsed.success) return actionError("Pick a client.");
    const dollars = input.feeDollars?.trim() ? Number(input.feeDollars) : 0;
    if (!Number.isFinite(dollars) || dollars < 0) return actionError("Enter the fee as a number of dollars.");
    try {
      const j = await st.createJob(db, {
        clientId: parsed.data,
        title: input.title,
        date: input.date || null,
        location: input.location,
        feeCents: Math.round(dollars * 100),
      });
      await audit({
        action: "studio.job.create",
        entity: "studio_job",
        entityId: j.id,
        site: "photos",
        summary: `Added job ${j.title}`,
      });
      back();
      return done("Shoot added");
    } catch (e) {
      const f = fail(e);
      if (f) return f;
      throw e;
    }
  });
}

export async function advanceJobAction(jobId: string) {
  return guarded("studio.access", async ({ db, audit }) => {
    const p = id.safeParse(jobId);
    if (!p.success) return actionError("Unknown shoot.");
    try {
      const j = await st.advanceJob(db, p.data);
      await audit({
        action: "studio.job.advance",
        entity: "studio_job",
        entityId: p.data,
        site: "photos",
        summary: `Job moved to ${j.status}`,
      });
      back();
      return done(`Shoot is now ${j.status}`);
    } catch (e) {
      const f = fail(e);
      if (f) return f;
      throw e;
    }
  });
}

export async function publishGalleryAction(galleryId: string) {
  return guarded("studio.access", async ({ db, audit }) => {
    const p = id.safeParse(galleryId);
    if (!p.success) return actionError("Unknown gallery.");
    await publishAndNotify(db, p.data);
    await audit({
      action: "studio.gallery.publish",
      entity: "studio_gallery",
      entityId: p.data,
      site: "photos",
      summary: "Published a client gallery",
    });
    back();
    return done("Gallery published");
  });
}

export async function createContractAction(jobId: string, templateId?: string) {
  return guarded("studio.access", async ({ db, audit }) => {
    const p = id.safeParse(jobId);
    if (!p.success) return actionError("Unknown shoot.");
    try {
      // The default is the SAMPLE event template (merged with the job, client and policies); pick another on the Forms page.
      await forms.seedSampleTemplates(db);
      const templates = await forms.listTemplates(db);
      const tpl =
        templates.find((t) => t.id === templateId) ??
        templates.find((t) => t.slug === "event") ??
        templates.find((t) => t.kind === "contract");
      if (!tpl) return actionError("There is no contract template yet. Add one on the Forms page.");
      const { contract: k } = await forms.createContractFromTemplate(db, { jobId: p.data, templateId: tpl.id });
      await audit({
        action: "studio.contract.create",
        entity: "studio_contract",
        entityId: k.id,
        site: "photos",
        summary: "Created a contract",
      });
      back();
      return done("Contract created (draft)");
    } catch (e) {
      const f = fail(e);
      if (f) return f;
      throw e;
    }
  });
}

export async function sendContractAction(contractId: string) {
  return guarded("studio.access", async ({ db, audit }) => {
    const p = id.safeParse(contractId);
    if (!p.success) return actionError("Unknown contract.");
    try {
      const { token } = await st.sendContract(db, p.data);
      await audit({
        action: "studio.contract.send",
        entity: "studio_contract",
        entityId: p.data,
        site: "photos",
        summary: "Contract sent for signature",
      });
      back();
      return done("Signing link ready. Copy it to the client.", {
        link: `${getSite("photos").url}/client/sign/${token}`,
      });
    } catch (e) {
      const f = fail(e);
      if (f) return f;
      throw e;
    }
  });
}

export async function updateClientAction(input: {
  clientId: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  notes?: string;
}) {
  return guarded("studio.access", async ({ db, audit }) => {
    const p = id.safeParse(input.clientId);
    if (!p.success) return actionError("Unknown client.");
    try {
      await st.updateClient(db, p.data, input);
      await audit({
        action: "studio.client.update",
        entity: "studio_client",
        entityId: p.data,
        site: "photos",
        summary: `Edited client ${input.name.trim()}`,
      });
      back();
      return done("Client saved");
    } catch (e) {
      const f = fail(e);
      if (f) return f;
      throw e;
    }
  });
}

export async function createInvoiceAction(input: {
  jobId: string;
  description: string;
  amountDollars: string;
  more?: { description: string; amountDollars: string }[];
  dueDate?: string;
}) {
  return guarded("studio.money", async ({ db, audit }) => {
    const p = id.safeParse(input.jobId);
    const dollars = Number(input.amountDollars);
    if (!p.success) return actionError("Unknown shoot.");
    if (!Number.isFinite(dollars) || dollars <= 0) return actionError("Enter the amount in dollars.");
    try {
      const inv = await st.createInvoice(db, {
        jobId: p.data,
        lines: [
          { description: input.description || "Photography services", amountCents: Math.round(dollars * 100) },
          ...(input.more ?? [])
            .filter((m) => m.description.trim() && Number(m.amountDollars) > 0)
            .map((m) => ({ description: m.description, amountCents: Math.round(Number(m.amountDollars) * 100) })),
        ],
        dueDate: input.dueDate?.trim() || null,
      });
      await audit({
        action: "studio.invoice.create",
        entity: "studio_invoice",
        entityId: inv.id,
        site: "photos",
        summary: `Created invoice ${inv.number}`,
      });
      back();
      return done(`Invoice ${inv.number} created (draft)`);
    } catch (e) {
      const f = fail(e);
      if (f) return f;
      throw e;
    }
  });
}

export async function sendInvoiceAction(invoiceId: string) {
  return guarded("studio.money", async ({ db, audit }) => {
    const p = id.safeParse(invoiceId);
    if (!p.success) return actionError("Unknown invoice.");
    try {
      const { token } = await st.sendInvoice(db, p.data);
      await audit({
        action: "studio.invoice.send",
        entity: "studio_invoice",
        entityId: p.data,
        site: "photos",
        summary: "Invoice sent",
      });
      back();
      return done("Payment link ready. Copy it to the client.", {
        link: `${getSite("photos").url}/client/pay/${token}`,
      });
    } catch (e) {
      const f = fail(e);
      if (f) return f;
      throw e;
    }
  });
}

export async function markInvoicePaidAction(invoiceId: string) {
  return guarded("studio.money", async ({ db, audit, user }) => {
    const p = id.safeParse(invoiceId);
    if (!p.success) return actionError("Unknown invoice.");
    try {
      // Manual payments (cash, Zelle, check): what is still owed, one record per invoice, idempotent by reference.
      const rec = await st.markInvoicePaidManually(db, p.data, user.email ?? "owner");
      if (rec.duplicate) return actionError("A cash payment is already recorded for this invoice.");
      await afterPayment(db, rec.invoice.id).catch((e) => console.error("[after-payment]", String(e)));
      await audit({
        action: "studio.invoice.paid-manual",
        entity: "studio_invoice",
        entityId: rec.invoice.id,
        site: "photos",
        summary: `Marked ${rec.invoice.number} paid manually (${formatMoney(rec.amountCents)})`,
      });
      back();
      return done(`Marked paid: ${formatMoney(rec.amountCents)} received`);
    } catch (e) {
      const f = fail(e);
      if (f) return f;
      throw e;
    }
  });
}

export async function voidInvoiceAction(invoiceId: string) {
  return studioMoney(async ({ db, user }) => {
    const p = id.safeParse(invoiceId);
    if (!p.success) throw new st.StudioError("Unknown invoice.");
    const inv = await st.voidInvoice(db, p.data, user.email ?? undefined);
    return {
      message: `Invoice ${inv.number} voided. Its payment link no longer works.`,
      audit: {
        action: "studio.invoice.void",
        entity: "studio_invoice",
        entityId: inv.id,
        summary: `Voided invoice ${inv.number}`,
      },
    };
  });
}

export async function updateJobAction(input: {
  jobId: string;
  title: string;
  date?: string;
  location?: string;
  feeDollars?: string;
  status: string;
}) {
  return studio(async ({ db, user }) => {
    const p = id.safeParse(input.jobId);
    if (!p.success) throw new st.StudioError("Unknown shoot.");
    const dollars = input.feeDollars?.trim() ? Number(input.feeDollars) : 0;
    if (!Number.isFinite(dollars) || dollars < 0) throw new st.StudioError("Enter the fee as a number of dollars.");
    const j = await st.updateJob(
      db,
      p.data,
      {
        title: input.title,
        date: input.date || null,
        location: input.location,
        feeCents: Math.round(dollars * 100),
        status: input.status,
      },
      user.email ?? undefined,
    );
    return {
      message: "Shoot saved",
      audit: {
        action: "studio.job.update",
        entity: "studio_job",
        entityId: j.id,
        summary: `Edited shoot ${j.title} (${j.status})`,
      },
    };
  });
}

export async function archiveBookingAction(bookingId: string, archived: boolean) {
  return studio(async ({ db }) => {
    const p = id.safeParse(bookingId);
    if (!p.success) throw new st.StudioError("Unknown inquiry.");
    const b = await st.setBookingArchived(db, p.data, archived);
    return {
      message: archived ? `Archived the inquiry from ${b.name}` : `${b.name} is back in New`,
      audit: {
        action: archived ? "studio.booking.archive" : "studio.booking.restore",
        entity: "studio_booking",
        entityId: b.id,
        summary: `${archived ? "Archived" : "Restored"} the inquiry from ${b.name}`,
      },
    };
  });
}

export async function convertBookingAction(bookingId: string) {
  return guarded("studio.access", async ({ db, audit }) => {
    const p = id.safeParse(bookingId);
    if (!p.success) return actionError("Unknown booking.");
    try {
      const c = await st.convertBooking(db, p.data);
      await audit({
        action: "studio.booking.convert",
        entity: "studio_booking",
        entityId: p.data,
        site: "photos",
        summary: `Converted a booking into client ${c.name}`,
      });
      back();
      return done("Converted to a client");
    } catch (e) {
      const f = fail(e);
      if (f) return f;
      throw e;
    }
  });
}

export async function updateContractAction(input: { contractId: string; title: string; body: string }) {
  return guarded("studio.access", async ({ db, audit }) => {
    const p = id.safeParse(input.contractId);
    if (!p.success) return actionError("Unknown contract.");
    try {
      await st.updateContract(db, p.data, input);
      await audit({
        action: "studio.contract.update",
        entity: "studio_contract",
        entityId: p.data,
        site: "photos",
        summary: "Edited a contract",
      });
      back();
      return done("Contract saved");
    } catch (e) {
      const f = fail(e);
      if (f) return f;
      throw e;
    }
  });
}
