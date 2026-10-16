"use server";

import * as gal from "@jerryqiu/db/galleries";
import * as forms from "@jerryqiu/db/forms";
import { schema } from "@jerryqiu/db";
import { StudioError, createGallery } from "@jerryqiu/db/studio";
import { sendTemplate } from "@jerryqiu/email";
import { getSite } from "@jerryqiu/sites";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { emailGalleryLink, publishAndNotify } from "@/lib/gallery-publish";
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
  layout?: string;
  theme?: string;
  density?: string;
  publishAt?: string;
  notes?: string;
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
        ...(input.layout ? { layout: (["grid", "masonry", "rows"] as const).find((x) => x === input.layout) } : {}),
        ...(input.theme ? { theme: input.theme === "light" ? ("light" as const) : ("dark" as const) } : {}),
        ...(input.density ? { density: (["small", "medium", "large"] as const).find((x) => x === input.density) } : {}),
        ...(input.publishAt !== undefined ? { publishAt: input.publishAt ? input.publishAt : null } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
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

/** A new empty gallery for a job. Photographs and every setting come after, inside the gallery page. */
export async function newGalleryAction(input: { jobId: string; title: string }) {
  return studio(async ({ db, user }) => {
    const job = id.safeParse(input.jobId);
    if (!job.success) throw new StudioError("Pick a job.");
    const passcode = await gal.freshPasscode(db);
    const g = await createGallery(
      db,
      { jobId: job.data, title: input.title.trim() || undefined, passcode },
      user.email ?? undefined,
    );
    return {
      message: "Gallery created as a draft",
      extra: { galleryId: g.id, passcode },
      audit: {
        action: "studio.gallery.create",
        entity: "studio_gallery",
        entityId: g.id,
        summary: `Created client gallery ${g.title}`,
      },
    };
  });
}

/** A new random passcode for the client (shown once: only its hash is stored). */
export async function regeneratePasscodeAction(galleryId: string) {
  return studio(async ({ db }) => {
    const passcode = await gal.freshPasscode(db);
    await gal.setPasscode(db, gid(galleryId), passcode);
    return {
      message: "New passcode set",
      extra: { passcode },
      audit: {
        action: "studio.gallery.passcode",
        entity: "studio_gallery",
        entityId: galleryId,
        summary: "Generated a new gallery passcode",
      },
    };
  });
}

export async function publishNowAction(galleryId: string) {
  return studio(async ({ db, user }) => {
    await publishAndNotify(db, gid(galleryId), user.email ?? undefined);
    return {
      message: "Published, and the client was emailed",
      audit: {
        action: "studio.gallery.publish",
        entity: "studio_gallery",
        entityId: galleryId,
        summary: "Published a gallery",
      },
    };
  });
}

export async function unpublishAction(galleryId: string) {
  return studio(async ({ db }) => {
    await db
      .update(schema.studioGalleries)
      .set({ status: "draft", updatedAt: new Date() })
      .where(eq(schema.studioGalleries.id, gid(galleryId)));
    return {
      message: "Back to draft: clients can no longer open it",
      audit: {
        action: "studio.gallery.unpublish",
        entity: "studio_gallery",
        entityId: galleryId,
        summary: "Unpublished a gallery",
      },
    };
  });
}

export async function sendGalleryLinkAction(galleryId: string) {
  return studio(async ({ db }) => {
    const sent = await emailGalleryLink(db, gid(galleryId), { force: true });
    if (!sent) throw new StudioError("This gallery has no client with an email address.");
    return {
      message: "Email sent to the client",
      audit: {
        action: "studio.gallery.email",
        entity: "studio_gallery",
        entityId: galleryId,
        summary: "Emailed the gallery link",
      },
    };
  });
}

export async function duplicateGalleryAction(galleryId: string) {
  return studio(async ({ db, user }) => {
    const r = await gal.duplicateGallery(db, gid(galleryId), user.email ?? undefined);
    return {
      message: "Duplicated as a draft",
      extra: { galleryId: r.gallery.id, passcode: r.passcode },
      audit: {
        action: "studio.gallery.duplicate",
        entity: "studio_gallery",
        entityId: r.gallery.id,
        summary: "Duplicated a gallery",
      },
    };
  });
}

export async function deleteGalleryAction(galleryId: string) {
  return studio(async ({ db, user }) => {
    await gal.deleteGallery(db, gid(galleryId), user.email ?? undefined);
    return {
      message: "Gallery deleted (the photographs stay in your library)",
      audit: {
        action: "studio.gallery.delete",
        entity: "studio_gallery",
        entityId: galleryId,
        summary: "Deleted a gallery",
      },
    };
  });
}

export async function sortGalleryAction(input: { galleryId: string; mode: string }) {
  return studio(async ({ db }) => {
    const mode = (["name", "newest", "oldest"] as const).find((m) => m === input.mode);
    if (!mode) throw new StudioError("Pick a sort order.");
    const n = await gal.sortItems(db, gid(input.galleryId), mode);
    return { message: `Sorted ${n} photographs` };
  });
}

/** One action over several photographs at once. */
export async function bulkPhotosAction(input: {
  galleryId: string;
  mediaIds: string[];
  op: "hide" | "show" | "remove" | "album" | "front";
  albumId?: string;
}) {
  return studio(async ({ db }) => {
    const g = gid(input.galleryId);
    const ids = z.array(id).max(2000).parse(input.mediaIds);
    if (!ids.length) throw new StudioError("Select some photographs first.");
    if (input.op === "hide" || input.op === "show") await gal.setHiddenMany(db, g, ids, input.op === "hide");
    else if (input.op === "remove") await gal.removeMany(db, g, ids);
    else if (input.op === "front") await gal.moveToFront(db, g, ids);
    else await gal.moveToAlbum(db, g, ids, input.albumId ? gid(input.albumId) : null);
    const verb = { hide: "Hid", show: "Showed", remove: "Removed", album: "Moved", front: "Moved to the front:" }[
      input.op
    ];
    return { message: `${verb} ${ids.length} photograph${ids.length === 1 ? "" : "s"}` };
  });
}
