"use server";

import * as biz from "@jerryqiu/db/business";
import * as news from "@jerryqiu/db/newsletter";
import * as privacy from "@jerryqiu/db/privacy";
import { StudioError } from "@jerryqiu/db/studio";
import { z } from "zod";
import { created, mayRemove, studio, studioMoney, studioOwner } from "@/lib/studio-run";

const id = z.string().uuid();
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** "12.50" or "$1,200" to cents; refuses anything else. */
function cents(v: string): number {
  const t = v.replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(t)) throw new StudioError("Enter the amount as dollars, like 24.50.");
  return Math.round(Number(t) * 100);
}

export async function addExpenseAction(input: {
  kind: "expense" | "mileage";
  spentOn: string;
  category?: string;
  description?: string;
  vendor?: string;
  amount?: string;
  miles?: string;
  rate?: string;
  jobId?: string;
  receiptNote?: string;
}) {
  return studioMoney(async ({ db }) => {
    if (!day.safeParse(input.spentOn).success) throw new StudioError("Enter the date.");
    const job = input.jobId ? id.safeParse(input.jobId) : null;
    await biz.addExpense(db, {
      kind: input.kind,
      spentOn: input.spentOn,
      category: input.category,
      description: input.description,
      vendor: input.vendor,
      amountCents: input.kind === "mileage" ? 0 : cents(input.amount ?? ""),
      miles: input.kind === "mileage" ? Number(input.miles) : undefined,
      rateCentsPerMile: input.rate ? Math.round(Number(input.rate) * 100) : undefined,
      jobId: job?.success ? job.data : null,
      receiptNote: input.receiptNote,
    });
    return { message: input.kind === "mileage" ? "Trip added" : "Expense added" };
  });
}
export async function deleteExpenseAction(expenseId: string) {
  return studioMoney(async ({ db }) => {
    const p = id.safeParse(expenseId);
    if (!p.success) throw new StudioError("Unknown entry.");
    await biz.deleteExpense(db, p.data);
    return { message: "Entry removed" };
  });
}

export async function addTestimonialAction(input: {
  displayName: string;
  quote: string;
  role?: string;
  consentNote?: string;
}) {
  return studioOwner(async ({ db }) => {
    await biz.addTestimonial(db, {
      displayName: input.displayName,
      quote: input.quote,
      role: input.role,
      consent: input.consentNote?.trim() ? { note: input.consentNote } : undefined,
    });
    return { message: "Testimonial saved" };
  });
}
export async function consentAction(input: { testimonialId: string; note: string }) {
  return studioOwner(async ({ db }) => {
    const p = id.safeParse(input.testimonialId);
    if (!p.success) throw new StudioError("Unknown testimonial.");
    await biz.recordConsent(db, p.data, input.note);
    return { message: "Consent recorded" };
  });
}
export async function publishTestimonialAction(input: { testimonialId: string; on: boolean }) {
  return studioOwner(async ({ db }) => {
    const p = id.safeParse(input.testimonialId);
    if (!p.success) throw new StudioError("Unknown testimonial.");
    await biz.setTestimonialPublished(db, p.data, input.on);
    return {
      message: input.on ? "Published on the About page" : "Taken down",
      audit: {
        action: input.on ? "studio.testimonial.publish" : "studio.testimonial.unpublish",
        entity: "studio_testimonial",
        entityId: p.data,
        summary: input.on ? "Published a testimonial" : "Took down a testimonial",
      },
    };
  });
}
export async function withdrawConsentAction(testimonialId: string) {
  return studioOwner(async ({ db }) => {
    const p = id.safeParse(testimonialId);
    if (!p.success) throw new StudioError("Unknown testimonial.");
    await biz.withdrawConsent(db, p.data);
    return { message: "Consent withdrawn and the testimonial is down" };
  });
}
export async function deleteTestimonialAction(testimonialId: string) {
  return studioOwner(async ({ db }) => {
    const p = id.safeParse(testimonialId);
    if (!p.success) throw new StudioError("Unknown testimonial.");
    await biz.deleteTestimonial(db, p.data);
    return { message: "Testimonial deleted" };
  });
}

export async function addGearAction(input: { name: string; kind: string; notes?: string }) {
  return studio(async ({ db }) => {
    await biz.addGear(db, input);
    return { message: "Gear added" };
  });
}
export async function retireGearAction(input: { gearId: string; retired: boolean }) {
  return studio(async ({ db }) => {
    const p = id.safeParse(input.gearId);
    if (!p.success) throw new StudioError("Unknown gear.");
    await biz.retireGear(db, p.data, input.retired);
    return { message: input.retired ? "Retired" : "Back in the bag" };
  });
}
export async function assignGearAction(input: { gearId: string; jobId: string; onDate: string }) {
  return studio(async ({ db }) => {
    const g = id.safeParse(input.gearId);
    const j = id.safeParse(input.jobId);
    if (!g.success || !j.success) throw new StudioError("Pick the gear and the job.");
    const clash = await biz.assignGear(db, { gearId: g.data, jobId: j.data, onDate: input.onDate });
    return {
      message: clash.length
        ? `Assigned, but it is also on ${clash
            .filter((c) => c.jobId !== j.data)
            .map((c) => `"${c.title}"`)
            .join(", ")} that day`
        : "Assigned",
    };
  });
}
export async function unassignGearAction(input: { gearId: string; jobId: string; onDate: string }) {
  return studio(async ({ db }) => {
    const g = id.safeParse(input.gearId);
    const j = id.safeParse(input.jobId);
    if (!g.success || !j.success) throw new StudioError("Unknown assignment.");
    await biz.unassignGear(db, { gearId: g.data, jobId: j.data, onDate: input.onDate });
    return { message: "Removed from the job" };
  });
}

export async function saveCallSheetAction(input: {
  jobId: string;
  callTime?: string;
  location?: string;
  notes?: string;
  shots: { text: string; done: boolean }[];
  contacts: { name: string; role: string; phone: string }[];
}) {
  return studio(async ({ db }) => {
    const p = id.safeParse(input.jobId);
    if (!p.success) throw new StudioError("Pick a job.");
    await biz.saveCallSheet(db, p.data, input);
    return { message: "Call sheet saved" };
  });
}

export async function deleteSubscriberAction(subscriberId: string) {
  return studioOwner(async ({ db }) => {
    const p = id.safeParse(subscriberId);
    if (!p.success) throw new StudioError("Unknown subscriber.");
    await news.deleteSubscriber(db, p.data);
    return { message: "Removed from the list" };
  });
}

export async function resolvePrivacyAction(input: {
  requestId: string;
  status: "done" | "declined";
  resolution: string;
}) {
  return studioOwner(async ({ db }) => {
    const p = id.safeParse(input.requestId);
    if (!p.success) throw new StudioError("Unknown request.");
    if (input.status !== "done" && input.status !== "declined") throw new StudioError("Pick done or declined.");
    await biz.resolvePrivacyRequest(db, p.data, input.status, input.resolution);
    return {
      message: input.status === "done" ? "Marked done" : "Marked declined",
      audit: {
        action: "studio.privacy.resolve",
        entity: "privacy_request",
        entityId: p.data,
        summary: `Privacy request ${input.status}`,
      },
    };
  });
}
export async function reopenPrivacyAction(requestId: string) {
  return studioOwner(async ({ db }) => {
    const p = id.safeParse(requestId);
    if (!p.success) throw new StudioError("Unknown request.");
    await biz.reopenPrivacyRequest(db, p.data);
    return { message: "Reopened" };
  });
}

/** Owner only: puts selected client-gallery photographs in the public portfolio, with how the people agreed written down. */
export async function publishToPortfolioAction(input: { mediaIds: string[]; subjectId: string; consentNote: string }) {
  return studioOwner(async ({ db, user }) => {
    const ids = z.array(id).max(500).safeParse(input.mediaIds);
    const subject = id.safeParse(input.subjectId);
    if (!ids.success) throw new StudioError("Select some photographs first.");
    if (!subject.success) throw new StudioError("Pick where in the portfolio they go.");
    const r = await biz.publishToPortfolio(db, {
      mediaIds: ids.data,
      subjectId: subject.data,
      consentNote: input.consentNote,
    });
    return {
      message: r.added
        ? `${r.added} photograph${r.added === 1 ? "" : "s"} added to ${r.subject}${r.skipped ? ` (${r.skipped} already there)` : ""}`
        : `Already in ${r.subject}`,
      audit: {
        action: "studio.portfolio.publish",
        entity: "gallery",
        entityId: subject.data,
        summary: `Published ${r.added} photograph(s) to the portfolio (${r.subject}). Consent: ${input.consentNote.trim().slice(0, 200)} (by ${user.email})`,
      },
    };
  });
}

/** Owner only: everything held about one client, as JSON text the page offers as a download. */
export async function exportClientDataAction(clientId: string) {
  return studioOwner(async ({ db }) => {
    const p = id.safeParse(clientId);
    if (!p.success) throw new StudioError("Unknown client.");
    const data = await privacy.exportClientData(db, p.data);
    return {
      message: "Data export ready",
      extra: { json: JSON.stringify(data, null, 2) },
      audit: { action: "client.export", entity: "client", entityId: p.data, summary: "Exported a client's data" },
    };
  });
}

/** Owner only: erases a client's contact details; invoices, payments and contracts stay without a name. */
export async function eraseClientAction(clientId: string) {
  return studioOwner(async ({ db }) => {
    const p = id.safeParse(clientId);
    if (!p.success) throw new StudioError("Unknown client.");
    await privacy.eraseClient(db, p.data);
    return {
      message: "Client erased",
      audit: {
        action: "client.erase",
        entity: "client",
        entityId: p.data,
        summary: "Erased a client's contact details",
      },
    };
  });
}
