"use server";

import * as gal from "@jerryqiu/db/galleries";
import * as forms from "@jerryqiu/db/forms";
import { schema } from "@jerryqiu/db";
import { StudioError } from "@jerryqiu/db/studio";
import { sendTemplate } from "@jerryqiu/email";
import { getSite } from "@jerryqiu/sites";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { studio } from "@/lib/studio-run";

const id = z.string().uuid();
const gid = (v: string) => {
  const p = id.safeParse(v);
  if (!p.success) throw new StudioError("Unknown gallery.");
  return p.data;
};
const mid = (v: string) => {
  const p = id.safeParse(v);
  if (!p.success) throw new StudioError("Unknown photograph.");
  return p.data;
};

export async function saveGallerySettingsAction(input: {
  galleryId: string;
  title: string;
  welcome: string;
  accent: string;
  downloadPolicy: string;
  accessMonths: string;
  selectionLimit: string;
  allowComments: boolean;
  allowRatings: boolean;
  watermark: boolean;
}) {
  return studio(async ({ db, user }) => {
    const policy = (["none", "preview", "web", "full"] as const).find((p) => p === input.downloadPolicy) ?? "preview";
    const limit = input.selectionLimit.trim() ? Number(input.selectionLimit) : null;
    await gal.updateGallery(
      db,
      gid(input.galleryId),
      {
        title: input.title,
        welcome: input.welcome,
        accent: input.accent.trim(),
        downloadPolicy: policy,
        selectionLimit: limit,
        allowComments: input.allowComments,
        allowRatings: input.allowRatings,
        watermark: input.watermark,
        ...(input.accessMonths.trim() ? { accessMonths: Number(input.accessMonths) } : {}),
      },
      user.email ?? undefined,
    );
    return {
      message: "Gallery settings saved",
      audit: {
        action: "studio.gallery.settings",
        entity: "studio_gallery",
        entityId: input.galleryId,
        summary: "Updated gallery settings",
      },
    };
  });
}

export async function setGalleryPasscodeAction(input: { galleryId: string; passcode: string }) {
  return studio(async ({ db }) => {
    await gal.setPasscode(db, gid(input.galleryId), input.passcode);
    return {
      message: "Passcode changed",
      audit: {
        action: "studio.gallery.passcode",
        entity: "studio_gallery",
        entityId: input.galleryId,
        summary: "Changed a gallery passcode",
      },
    };
  });
}

export async function setDownloadPinAction(input: { galleryId: string; pin: string }) {
  return studio(async ({ db }) => {
    await gal.setDownloadPin(db, gid(input.galleryId), input.pin.trim());
    return {
      message: input.pin.trim() ? "Download PIN set" : "Download PIN removed",
      audit: {
        action: "studio.gallery.pin",
        entity: "studio_gallery",
        entityId: input.galleryId,
        summary: "Changed a download PIN",
      },
    };
  });
}

export async function createAlbumAction(input: { galleryId: string; name: string }) {
  return studio(async ({ db }) => {
    await gal.createAlbum(db, gid(input.galleryId), input.name);
    return { message: "Album added" };
  });
}
export async function deleteAlbumAction(input: { galleryId: string; albumId: string }) {
  return studio(async ({ db }) => {
    await gal.deleteAlbum(db, gid(input.galleryId), mid(input.albumId));
    return { message: "Album removed (its photographs stay in the gallery)" };
  });
}
export async function moveToAlbumAction(input: { galleryId: string; mediaId: string; albumId: string }) {
  return studio(async ({ db }) => {
    await gal.moveToAlbum(db, gid(input.galleryId), [mid(input.mediaId)], input.albumId ? mid(input.albumId) : null);
    return { message: "Moved" };
  });
}
export async function removeItemAction(input: { galleryId: string; mediaId: string }) {
  return studio(async ({ db }) => {
    await gal.removeItem(db, gid(input.galleryId), mid(input.mediaId));
    return {
      message: "Removed from the gallery",
      audit: {
        action: "studio.gallery.remove",
        entity: "studio_gallery",
        entityId: input.galleryId,
        summary: "Removed a photograph from a gallery",
      },
    };
  });
}
export async function setCoverAction(input: { galleryId: string; mediaId: string }) {
  return studio(async ({ db }) => {
    await gal.setCover(db, gid(input.galleryId), mid(input.mediaId));
    return { message: "Cover set" };
  });
}
export async function setHiddenAction(input: { galleryId: string; mediaId: string; hidden: boolean }) {
  return studio(async ({ db }) => {
    await gal.setHidden(db, gid(input.galleryId), mid(input.mediaId), input.hidden);
    return { message: input.hidden ? "Hidden from the client" : "Visible again" };
  });
}
export async function replyCommentAction(input: { galleryId: string; mediaId: string; body: string }) {
  return studio(async ({ db }) => {
    await gal.comment(db, gid(input.galleryId), mid(input.mediaId), input.body, "studio");
    return { message: "Reply added" };
  });
}
export async function reopenSelectionAction(galleryId: string) {
  return studio(async ({ db }) => {
    await gal.reopenSelection(db, gid(galleryId));
    return { message: "Selection reopened: the client can change their picks" };
  });
}
export async function archiveGalleryAction(input: { galleryId: string; archive: boolean }) {
  return studio(async ({ db }) => {
    await db
      .update(schema.studioGalleries)
      .set({ status: input.archive ? "archived" : "published", updatedAt: new Date() })
      .where(eq(schema.studioGalleries.id, gid(input.galleryId)));
    return {
      message: input.archive ? "Archived (clients are offered an extension)" : "Published again",
      audit: {
        action: "studio.gallery.archive",
        entity: "studio_gallery",
        entityId: input.galleryId,
        summary: input.archive ? "Archived a gallery" : "Unarchived a gallery",
      },
    };
  });
}
export async function extendGalleryFreeAction(input: { galleryId: string; months: string }) {
  return studio(async ({ db }) => {
    const months = Number(input.months);
    if (!Number.isInteger(months) || months < 1 || months > 60) throw new StudioError("Extend by 1 to 60 months.");
    const g = await gal.extendGallery(db, gid(input.galleryId), months);
    return {
      message: `Extended to ${g?.expiresAt?.toISOString().slice(0, 10)}`,
      audit: {
        action: "studio.gallery.extend",
        entity: "studio_gallery",
        entityId: input.galleryId,
        summary: `Extended a gallery by ${months} months (no charge)`,
      },
    };
  });
}

/** Creates (or reuses) the open extension invoice, emails the pay link to the client, and shows the link here too. */
export async function sendExtensionInvoiceAction(galleryId: string) {
  return studio(async ({ db }) => {
    const r = await gal.createExtensionInvoice(db, gid(galleryId));
    const [row] = await db
      .select({ client: schema.studioClients, gallery: schema.studioGalleries })
      .from(schema.studioGalleries)
      .innerJoin(schema.studioJobs, eq(schema.studioJobs.id, schema.studioGalleries.jobId))
      .innerJoin(schema.studioClients, eq(schema.studioClients.id, schema.studioJobs.clientId))
      .where(eq(schema.studioGalleries.id, gid(galleryId)));
    const link = `${getSite("photos").url}/client/pay/${r.token}`;
    if (row)
      await sendTemplate(
        db,
        row.client.email,
        "invoice-sent",
        {
          name: row.client.name,
          title: r.invoice.number,
          amount: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(r.cents / 100),
          link,
          linkLabel: "Extend gallery access",
        },
        { related: { type: "invoice", id: r.invoice.id } },
      );
    void forms;
    return {
      message: `Extension invoice ${r.invoice.number} sent`,
      extra: { link },
      audit: {
        action: "studio.gallery.extension-invoice",
        entity: "studio_invoice",
        entityId: r.invoice.id,
        summary: "Sent a gallery extension invoice",
      },
    };
  });
}
