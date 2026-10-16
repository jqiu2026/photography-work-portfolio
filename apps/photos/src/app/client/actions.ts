"use server";

import { getDb, hitRateLimit, schema } from "@jerryqiu/db";
import { and, eq } from "drizzle-orm";
import { accountSession } from "@/lib/account-session";
import * as bill from "@jerryqiu/db/billing";
import * as gal from "@jerryqiu/db/galleries";
import * as st from "@jerryqiu/db/studio";
import { sha256Hex } from "@jerryqiu/db/studio-crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { endPortalSession, portalSession, requestIpHash, startPortalSession } from "@/lib/portal";
import { resolveRef } from "@/lib/portal-links";

/** Client-side actions: no staff login. Everything is bound to a link token or a portal session cookie. */
export type ClientResult = { ok: true; message?: string } | { ok: false; error: string };
const no = (error: string): ClientResult => ({ ok: false, error });

export async function openGalleryAction(_prev: ClientResult | null, formData: FormData): Promise<ClientResult> {
  const db = getDb();
  if (!db) return no("Galleries are not available right now.");
  const passcode = String(formData.get("passcode") ?? "");
  if (!passcode.trim()) return no("Enter your passcode.");
  const ip = await requestIpHash();
  const rl = await hitRateLimit(db, `portal:${ip}`, 8, 600);
  if (!rl.allowed) return no("Too many tries. Wait a few minutes and try again.");
  // Expired and archived galleries are found too: the passcode proves who you are, and the gallery page offers an extension.
  const g = await gal.findGalleryByPasscode(db, passcode);
  if (!g) return no("That passcode doesn't match a gallery.");
  await startPortalSession(g.id);
  redirect("/client/gallery");
}

export async function leaveGalleryAction() {
  await endPortalSession();
  redirect("/client");
}

export async function toggleFavoriteAction(mediaId: string, galleryId?: string): Promise<ClientResult> {
  const db = getDb();
  const session = await portalSession();
  if (!db) return no("Open your gallery again to continue.");
  if (!z.string().uuid().safeParse(mediaId).success) return no("Unknown photograph.");
  // A signed-in portal account may favourite in any published gallery of its own jobs; a passcode session only in its gallery.
  let gid = session?.g;
  if (galleryId) {
    const me = await accountSession();
    if (!z.string().uuid().safeParse(galleryId).success || !me) return no("Open your gallery again to continue.");
    const [row] = await db
      .select({ id: schema.studioGalleries.id })
      .from(schema.studioGalleries)
      .innerJoin(schema.studioJobs, eq(schema.studioJobs.id, schema.studioGalleries.jobId))
      .where(
        and(
          eq(schema.studioGalleries.id, galleryId),
          eq(schema.studioGalleries.status, "published"),
          eq(schema.studioJobs.clientId, me.client.id),
        ),
      );
    if (!row) return no("Open your gallery again to continue.");
    gid = row.id;
  }
  if (!gid) return no("Open your gallery again to continue.");
  try {
    await st.toggleFavorite(db, gid, mediaId);
    return { ok: true };
  } catch (e) {
    return no(e instanceof st.StudioError ? e.message : "Could not save your favourite.");
  }
}

export async function signContractAction(
  token: string,
  _prev: ClientResult | null,
  formData: FormData,
): Promise<ClientResult> {
  const db = getDb();
  if (!db) return no("Signing is not available right now.");
  const ip = await requestIpHash();
  const rl = await hitRateLimit(db, `sign:${ip}`, 20, 600);
  if (!rl.allowed) return no("Too many tries. Wait a few minutes and try again.");
  const ref = await resolveRef(token, "contract");
  if (!ref) return no("This signing link is not valid.");
  try {
    await st.signContract(db, ref, {
      signerName: String(formData.get("name") ?? ""),
      agree: formData.get("agree") === "on",
      consentElectronic: formData.get("consent") === "on",
      guardianName: String(formData.get("guardian") ?? ""),
      ipHash: sha256Hex(ip),
      userAgent: undefined,
    });
    return { ok: true, message: "Signed. Thank you." };
  } catch (e) {
    return no(e instanceof st.StudioError ? e.message : "Could not sign. Try again.");
  }
}

/** Pays an invoice: Stripe Checkout when configured, the labelled local mock otherwise, nothing in production without either. */
export async function payInvoiceAction(
  token: string,
  _prev: ClientResult | null,
  formData: FormData,
): Promise<ClientResult> {
  const { paymentMode } = await import("@/lib/payment-config");
  const { createCheckoutSession } = await import("@jerryqiu/payments");
  const { MockPaymentProvider } = await import("@jerryqiu/mocks");
  const { getSite } = await import("@jerryqiu/sites");
  const db = getDb();
  if (!db) return no("Payments are not available right now.");
  const ip = await requestIpHash();
  const rl = await hitRateLimit(db, `pay:${ip}`, 20, 600);
  if (!rl.allowed) return no("Too many tries. Wait a few minutes and try again.");
  const ref = await resolveRef(token, "invoice");
  const inv = ref ? await st.invoiceByToken(db, ref) : null;
  if (!inv) return no("This payment link is not valid.");
  if (inv.status === "paid") return no("This invoice is already paid.");
  const mode = paymentMode();
  if (mode === "none") return no("Online payment is not set up yet. Please contact the photographer.");
  const billing = await bill.getBillingSettings(db);
  const net = await st.invoiceNetCents(db, inv.id);
  const due = inv.totalCents - net;
  if (due <= 0) return no("This invoice is already paid.");
  // Tip, method and surcharge are decided here from the settings; the browser only says which option was picked.
  const method = String(formData.get("method") ?? "card") === "ach" && billing.achEnabled ? "ach" : "card";
  const tipChoice = String(formData.get("tip") ?? "0");
  let tipCents = 0;
  if (billing.tipsEnabled) {
    if (/^\d+$/.test(tipChoice) && billing.tipPercents.includes(Number(tipChoice)))
      tipCents = bill.tipFor(due, Number(tipChoice));
    else if (tipChoice === "custom") {
      const d = Number(String(formData.get("tipCustom") ?? "").replace(/[$,\s]/g, ""));
      if (Number.isFinite(d) && d > 0) tipCents = Math.min(Math.round(d * 100), due);
    }
  }
  const surchargeCents =
    method === "card" && billing.surchargeEnabled ? bill.surchargeFor(due, billing.surchargeBp) : 0;
  if (mode === "stripe") {
    let url: string;
    try {
      const base = getSite("photos").url;
      const session = await createCheckoutSession(
        { secretKey: process.env.STRIPE_SECRET_KEY as string },
        {
          invoiceId: inv.id,
          invoiceNumber: inv.number,
          amountCents: due,
          currency: inv.currency,
          description: inv.lines.map((l) => l.description).join(", "),
          methods: method === "ach" ? ["us_bank_account"] : ["card"],
          tipCents,
          surchargeCents,
          successUrl: `${base}/client/pay/${token}?paid=1`,
          cancelUrl: `${base}/client/pay/${token}`,
        },
        `inv-${inv.id}-${inv.updatedAt.getTime()}-${method}-${tipCents}-${surchargeCents}`,
      );
      url = session.url;
    } catch (error) {
      console.error("[pay] could not start checkout", String(error));
      return no("Could not start the payment. Try again in a moment.");
    }
    redirect(url);
  }
  // mock
  const provider = new MockPaymentProvider();
  const intent = await provider.createIntent({
    amount: due + tipCents + surchargeCents,
    description: `Invoice ${inv.number}`,
    metadata: { invoice: inv.id },
  });
  // Mock bank transfer: no card to check. Mock card: only 4242 succeeds.
  const r = await provider.confirm(
    intent,
    method === "ach"
      ? { number: "4242 4242 4242 4242", exp: "12 / 99", cvc: "123" }
      : {
          number: String(formData.get("number") ?? ""),
          exp: String(formData.get("exp") ?? ""),
          cvc: String(formData.get("cvc") ?? ""),
        },
  );
  if (!r.ok) return no(r.error);
  const rec = await st.recordPayment(db, {
    invoiceId: inv.id,
    provider: "mock",
    providerRef: r.intent.id,
    amountCents: due + tipCents + surchargeCents,
    tipCents,
    surchargeCents,
    method,
    status: "succeeded",
    receiptRef: r.receiptId,
  });
  if (!rec.duplicate) {
    const { afterPayment } = await import("@/lib/after-payment");
    await afterPayment(db, inv.id).catch((e) => console.error("[after-payment]", String(e)));
  }
  return { ok: true, message: `Paid. Receipt ${r.receiptId} (mock).` };
}
