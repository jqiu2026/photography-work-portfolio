"use server";

import { actionError } from "@jerryqiu/auth/server";
import * as st from "@jerryqiu/db/studio";
import { getSite } from "@jerryqiu/sites";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { guarded } from "@/auth";

/**
 * Owner-side studio actions (Phase 3). Every action re-checks the session and role (`studio.access`), rate limits, and
 * writes the audit log. Only async functions are exported from this "use server" file.
 */
const id = z.string().uuid();
const done = (message: string, extra: Record<string, unknown> = {}) => ({ ok: true as const, message, ...extra });
const fail = (e: unknown) => (e instanceof st.StudioError ? actionError(e.message) : null);
const back = () => revalidatePath("/studio", "layout");

export async function addClientAction(input: { name: string; email: string; phone?: string }) {
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
      return done("Job added");
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
    if (!p.success) return actionError("Unknown job.");
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
      return done(`Job is now ${j.status}`);
    } catch (e) {
      const f = fail(e);
      if (f) return f;
      throw e;
    }
  });
}

export async function createGalleryAction(input: { jobId: string; passcode: string; mediaIds: string[] }) {
  return guarded("studio.access", async ({ db, audit }) => {
    const j = id.safeParse(input.jobId);
    const m = z.array(id).max(500).safeParse(input.mediaIds);
    if (!j.success || !m.success) return actionError("Pick a job and valid photographs.");
    try {
      const g = await st.createGallery(db, { jobId: j.data, passcode: input.passcode, mediaIds: m.data });
      await audit({
        action: "studio.gallery.create",
        entity: "studio_gallery",
        entityId: g.id,
        site: "photos",
        summary: `Created client gallery ${g.title}`,
      });
      back();
      return done("Gallery created (draft). Publish it when it is ready.");
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
    await st.publishGallery(db, p.data);
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

export async function createContractAction(jobId: string) {
  return guarded("studio.access", async ({ db, audit }) => {
    const p = id.safeParse(jobId);
    if (!p.success) return actionError("Unknown job.");
    // TODO(owner, lawyer): replace this sample template with real terms (Q37).
    const body = `SAMPLE CONTRACT TEMPLATE (have a lawyer review before use)\n\n1. Services. The photographer will photograph the event described in the job.\n2. Delivery. Edited photographs are delivered in an online gallery.\n3. Licence. The client receives a personal, non-commercial licence unless agreed otherwise. All rights are reserved by the photographer.\n4. Payment. The invoice is due as stated; photographs are released when it is paid.\n5. Cancellation. TODO(owner): terms.`;
    try {
      const k = await st.createContract(db, { jobId: p.data, title: "Photography agreement", body });
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

/** Marks the contract sent and returns the signing link. No email is sent in this phase: the owner copies the link. */
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

export async function createInvoiceAction(input: { jobId: string; description: string; amountDollars: string }) {
  return guarded("studio.access", async ({ db, audit }) => {
    const p = id.safeParse(input.jobId);
    const dollars = Number(input.amountDollars);
    if (!p.success) return actionError("Unknown job.");
    if (!Number.isFinite(dollars) || dollars <= 0) return actionError("Enter the amount in dollars.");
    try {
      const inv = await st.createInvoice(db, {
        jobId: p.data,
        lines: [{ description: input.description || "Photography services", amountCents: Math.round(dollars * 100) }],
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
  return guarded("studio.access", async ({ db, audit }) => {
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
  return guarded("studio.access", async ({ db, audit, user }) => {
    const p = id.safeParse(invoiceId);
    if (!p.success) return actionError("Unknown invoice.");
    const rows = await st.listInvoices(db);
    const inv = rows.find((r) => r.invoice.id === p.data)?.invoice;
    if (!inv) return actionError("Unknown invoice.");
    // Manual payments (cash, Zelle, cheque): one record per invoice, idempotent by reference.
    await st.recordPayment(db, {
      invoiceId: inv.id,
      provider: "manual",
      providerRef: `manual:${inv.id}`,
      amountCents: inv.totalCents,
      status: "succeeded",
      receiptRef: `by ${user.email}`,
    });
    await audit({
      action: "studio.invoice.paid-manual",
      entity: "studio_invoice",
      entityId: inv.id,
      site: "photos",
      summary: `Marked ${inv.number} paid manually`,
    });
    back();
    return done("Marked paid");
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
