"use server";

import * as m from "@jerryqiu/db/music";
import { StudioError } from "@jerryqiu/db/studio";
import { createRefund } from "@jerryqiu/payments";
import { sendEmail } from "@jerryqiu/email";
import { z } from "zod";
import { afterOrderPaid, stripeKey } from "@/lib/checkout";
import { validEmbedId } from "@/lib/embed";
import { sendRefundNotice, siteUrl } from "@/lib/mail";
import { type StudioResult, studio } from "@/lib/studio-run";

const id = z.string().uuid();
const str = (f: FormData, k: string) => {
  const v = f.get(k);
  return typeof v === "string" ? v.trim() : "";
};
const opt = (f: FormData, k: string) => str(f, k) || null;
const num = (f: FormData, k: string) => (str(f, k) === "" ? null : Number(str(f, k)));
const dollars = (f: FormData, k: string) => {
  const n = Number(str(f, k).replace(/[$,\s]/g, ""));
  if (!Number.isFinite(n) || n < 0) throw new StudioError("Enter a price like 12 or 12.50.");
  return Math.round(n * 100);
};
const uuid = (v: string, what: string) => {
  const p = id.safeParse(v);
  if (!p.success) throw new StudioError(`Unknown ${what}.`);
  return p.data;
};

/* ---------- pieces ---------- */
export async function saveWorkAction(form: FormData): Promise<StudioResult> {
  return studio(async ({ db }) => {
    const workId = str(form, "id") ? uuid(str(form, "id"), "piece") : undefined;
    const w = await m.saveWork(
      db,
      {
        title: str(form, "title"),
        slug: str(form, "slug") || undefined,
        year: num(form, "year"),
        forces: opt(form, "forces"),
        instruments: str(form, "instruments")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        genre: opt(form, "genre"),
        difficulty: (opt(form, "difficulty") as "easy" | "medium" | "advanced" | null) ?? null,
        durationSec: num(form, "durationMin") === null ? null : Math.round((num(form, "durationMin") as number) * 60),
        summary: opt(form, "summary"),
        programNote: opt(form, "programNote"),
        rightsType: (str(form, "rightsType") || "original") as "original",
        licenseOnFile: form.get("licenseOnFile") === "on",
        licenseNote: opt(form, "licenseNote"),
        status: str(form, "status") === "published" ? "published" : "draft",
        featured: form.get("featured") === "on",
      },
      workId,
    );
    return {
      message: workId ? "Saved." : "Piece created.",
      audit: {
        action: workId ? "music.work.save" : "music.work.create",
        entity: "music_work",
        entityId: w.id,
        summary: `${workId ? "Saved" : "Created"} ${w.title}`,
      },
      extra: workId ? {} : { redirect: `/studio/pieces/${w.id}` },
    };
  });
}

export async function deleteWorkAction(form: FormData): Promise<StudioResult> {
  return studio(async ({ db }) => {
    await m.deleteWork(db, uuid(str(form, "id"), "piece"));
    return {
      message: "Deleted.",
      audit: {
        action: "music.work.delete",
        entity: "music_work",
        entityId: str(form, "id"),
        summary: "Deleted a piece",
      },
      extra: { redirect: "/studio/pieces" },
    };
  });
}

export async function removeFileAction(form: FormData): Promise<StudioResult> {
  return studio(async ({ db }) => {
    await m.removeScoreFile(db, uuid(str(form, "id"), "file"));
    return {
      message: "File removed.",
      audit: {
        action: "music.file.remove",
        entity: "music_score_file",
        entityId: str(form, "id"),
        summary: "Removed a score file",
      },
    };
  });
}

export async function previewPagesAction(form: FormData): Promise<StudioResult> {
  return studio(async ({ db }) => {
    await m.setPreviewPages(db, uuid(str(form, "id"), "file"), Number(str(form, "pages")));
    return { message: "Saved." };
  });
}

/* ---------- products and bundles ---------- */
export async function saveProductAction(form: FormData): Promise<StudioResult> {
  return studio(async ({ db }) => {
    const productId = str(form, "id") ? uuid(str(form, "id"), "product") : undefined;
    const workId = uuid(str(form, "workId"), "piece");
    const p = await m.saveProduct(
      db,
      workId,
      {
        title: str(form, "title"),
        description: opt(form, "description"),
        tier: (str(form, "tier") || "personal") as "personal",
        priceCents: dollars(form, "price"),
        fileIds: form
          .getAll("fileIds")
          .map(String)
          .filter((x) => id.safeParse(x).success),
        active: form.get("active") !== null ? form.get("active") === "on" : true,
      },
      productId,
    );
    return {
      message: productId ? "Saved." : "Product added.",
      audit: { action: "music.product.save", entity: "music_product", entityId: p.id, summary: `Saved ${p.title}` },
    };
  });
}

export async function removeProductAction(form: FormData): Promise<StudioResult> {
  return studio(async ({ db }) => {
    await m.removeProduct(db, uuid(str(form, "id"), "product"));
    return {
      message: "Removed.",
      audit: {
        action: "music.product.remove",
        entity: "music_product",
        entityId: str(form, "id"),
        summary: "Removed a product",
      },
    };
  });
}

export async function saveBundleAction(form: FormData): Promise<StudioResult> {
  return studio(async ({ db }) => {
    const bundleId = str(form, "id") ? uuid(str(form, "id"), "bundle") : undefined;
    const b = await m.saveBundle(
      db,
      {
        title: str(form, "title"),
        description: opt(form, "description"),
        priceCents: dollars(form, "price"),
        productIds: form.getAll("productIds").map(String),
        active: form.get("active") !== null ? form.get("active") === "on" : true,
      },
      bundleId,
    );
    return {
      message: bundleId ? "Saved." : "Bundle created.",
      audit: {
        action: "music.bundle.save",
        entity: "music_product",
        entityId: b,
        summary: `Saved bundle ${str(form, "title")}`,
      },
    };
  });
}

/* ---------- recordings and performances ---------- */
export async function addMediaAction(form: FormData): Promise<StudioResult> {
  return studio(async ({ db }) => {
    const kind = str(form, "kind") === "performance" ? "performance" : "recording";
    const provider = opt(form, "provider");
    const embedId = opt(form, "embedId");
    if (kind === "recording" && !(provider && embedId && validEmbedId(provider, embedId)))
      throw new StudioError(
        "That recording id does not look right for the provider. Use the id only, not the whole link.",
      );
    const row = await m.addMediaItem(db, {
      kind,
      title: str(form, "title"),
      workId: opt(form, "workId"),
      date: opt(form, "date"),
      venue: opt(form, "venue"),
      ensemble: opt(form, "ensemble"),
      note: opt(form, "note"),
      provider: provider as "youtube" | null,
      embedId,
    });
    return {
      message: "Added.",
      audit: {
        action: "music.media.add",
        entity: "music_item",
        entityId: row.id,
        summary: `Added ${kind} ${row.title}`,
      },
    };
  });
}

export async function removeMediaAction(form: FormData): Promise<StudioResult> {
  return studio(async ({ db }) => {
    await m.removeMediaItem(db, uuid(str(form, "id"), "item"));
    return {
      message: "Removed.",
      audit: {
        action: "music.media.remove",
        entity: "music_item",
        entityId: str(form, "id"),
        summary: "Removed a recording or performance",
      },
    };
  });
}

/* ---------- orders ---------- */
export async function refundOrderAction(form: FormData): Promise<StudioResult> {
  return studio(async ({ db }) => {
    const orderId = uuid(str(form, "id"), "order");
    const d = await m.orderDetail(db, orderId);
    if (!d) throw new StudioError("Order not found.");
    if (d.order.status !== "paid") throw new StudioError("Only a paid order can be refunded.");
    let via = "recorded here (no card was refunded)";
    if (d.order.provider === "stripe" && d.order.providerRef?.startsWith("pi_") && stripeKey()) {
      try {
        await createRefund(
          { secretKey: stripeKey() },
          { paymentIntent: d.order.providerRef, amountCents: d.order.totalCents, reason: "requested_by_customer" },
          `music-refund-${orderId}`,
        );
        via = "refunded on the card through Stripe";
      } catch (e) {
        console.error("[music] stripe refund failed", String(e));
        throw new StudioError("Stripe did not accept the refund. Nothing was changed. Try the Stripe dashboard.");
      }
    } else if (d.order.provider === "stripe")
      throw new StudioError(
        "This order was paid with Stripe but cannot be refunded from here (no payment reference or key). Refund it in Stripe; the license ends when Stripe reports it.",
      );
    await m.refundOrder(db, orderId);
    await sendRefundNotice(d.order.email, d.number);
    return {
      message: `Refund ${via}. The licenses are revoked.`,
      audit: {
        action: "music.order.refund",
        entity: "music_order",
        entityId: orderId,
        summary: `Refunded ${d.number}`,
      },
    };
  });
}

export async function resendReceiptAction(form: FormData): Promise<StudioResult> {
  return studio(async ({ db }) => {
    const orderId = uuid(str(form, "id"), "order");
    const d = await m.orderDetail(db, orderId);
    if (!d || d.order.status !== "paid") throw new StudioError("Only a paid order has a receipt.");
    await afterOrderPaid(db, orderId);
    return { message: `Receipt sent to ${d.order.email}.` };
  });
}

export async function downloadLimitAction(form: FormData): Promise<StudioResult> {
  return studio(async ({ db }) => {
    await m.setLicenseDownloadLimit(db, uuid(str(form, "id"), "license"), Number(str(form, "limit")));
    return { message: "Saved." };
  });
}

/* ---------- commissions ---------- */
export async function commissionStatusAction(form: FormData): Promise<StudioResult> {
  return studio(async ({ db }) => {
    const status = str(form, "status") as "new" | "talking" | "accepted" | "declined" | "done";
    if (!["new", "talking", "accepted", "declined", "done"].includes(status)) throw new StudioError("Unknown status.");
    await m.setCommissionStatus(db, uuid(str(form, "id"), "inquiry"), status, opt(form, "note"));
    return {
      message: "Saved.",
      audit: {
        action: "music.commission.status",
        entity: "music_commission",
        entityId: str(form, "id"),
        summary: `Set to ${status}`,
      },
    };
  });
}

/* ---------- newsletter ---------- */
export async function sendNewsletterAction(form: FormData): Promise<StudioResult> {
  return studio(async ({ db }) => {
    const subject = str(form, "subject");
    const body = str(form, "body");
    if (subject.length < 3 || body.length < 10) throw new StudioError("Write a subject and a message.");
    const subs = await m.confirmedSubscribers(db);
    if (!subs.length) throw new StudioError("There are no confirmed subscribers yet.");
    if (str(form, "confirmCount") !== String(subs.length))
      throw new StudioError(`Type ${subs.length} (the number of subscribers) to confirm sending.`);
    let sent = 0;
    for (const sub of subs) {
      const link = `${siteUrl()}/newsletter/unsubscribe?token=${encodeURIComponent(m.subscriberTokenFor(sub.id))}`;
      const r = await sendEmail(
        db,
        {
          to: sub.email,
          subject,
          text: `${body}\n\n--\nUnsubscribe: ${link}`,
          html: `<div style="font-family:system-ui,sans-serif;max-width:34rem;line-height:1.55">${body
            .split(/\n{2,}/)
            .map(
              (p) => `<p>${p.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] as string)}</p>`,
            )
            .join("")}<p style="color:#666;font-size:.85rem"><a href="${link}">Unsubscribe</a></p></div>`,
          from:
            process.env.MUSIC_EMAIL_FROM?.trim() ||
            process.env.EMAIL_FROM?.trim() ||
            "Jerry Qiu Music <music@music.invalid>",
        },
        { kind: "music-newsletter" },
      );
      if (r.ok) sent++;
    }
    return {
      message: `Sent to ${sent} of ${subs.length} subscribers.`,
      audit: { action: "music.newsletter.send", entity: "music_newsletter", summary: `Sent "${subject}" to ${sent}` },
    };
  });
}
