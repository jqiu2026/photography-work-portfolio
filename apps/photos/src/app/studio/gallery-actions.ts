"use server";

import * as gal from "@jerryqiu/db/galleries";
import * as forms from "@jerryqiu/db/forms";
import { schema } from "@jerryqiu/db";
import { StudioError, createGallery } from "@jerryqiu/db/studio";
import { sendTemplate } from "@jerryqiu/email";
import { getSite } from "@jerryqiu/sites";
import { eq } from "drizzle-orm";
import { type GalleryStyle, clearLocks, saveSecurity, saveStyle } from "@jerryqiu/db/gallery-security";
import * as shop from "@jerryqiu/db/gallery-shop";
import * as extras from "@jerryqiu/db/gallery-extras";
import { assertPlan } from "@jerryqiu/db/plan";
import { z } from "zod";
import { emailGalleryLink, publishAndNotify } from "@/lib/gallery-publish";
import { htmlToText } from "@/lib/html-text";
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
  shootDate?: string;
  orderDueDate?: string;
  emailRequired?: boolean;
  autoArchive?: boolean;
}) {
  return studio(async ({ db, user }) => {
    if (input.emailRequired) await assertPlan(db, "emailGate");
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
        ...(input.layout
          ? { layout: (["grid", "masonry", "rows", "story", "mosaic"] as const).find((x) => x === input.layout) }
          : {}),
        ...(input.theme
          ? { theme: (["dark", "light", "paper", "slate"] as const).find((x) => x === input.theme) ?? "dark" }
          : {}),
        ...(input.density ? { density: (["small", "medium", "large"] as const).find((x) => x === input.density) } : {}),
        ...(input.publishAt !== undefined ? { publishAt: input.publishAt ? input.publishAt : null } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.shootDate !== undefined ? { shootDate: input.shootDate } : {}),
        ...(input.orderDueDate !== undefined ? { orderDueDate: input.orderDueDate } : {}),
        ...(input.emailRequired !== undefined ? { emailRequired: input.emailRequired } : {}),
        ...(input.autoArchive !== undefined ? { autoArchive: input.autoArchive } : {}),
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

export async function createAlbumAction(input: { galleryId: string; name: string; parentId?: string }) {
  return studio(async ({ db }) => {
    await gal.createAlbum(db, gid(input.galleryId), input.name, input.parentId ? mid(input.parentId) : null);
    return { message: input.parentId ? "Sub-album added" : "Album added" };
  });
}
export async function updateAlbumAction(input: {
  galleryId: string;
  albumId: string;
  name?: string;
  description?: string;
  hidden?: boolean;
  parentId?: string | null;
  coverMediaId?: string | null;
  passcode?: string;
}) {
  return studio(async ({ db }) => {
    await gal.updateAlbum(db, gid(input.galleryId), mid(input.albumId), {
      name: input.name,
      description: input.description,
      hidden: input.hidden,
      parentId: input.parentId === undefined ? undefined : input.parentId ? mid(input.parentId) : null,
      coverMediaId: input.coverMediaId === undefined ? undefined : input.coverMediaId ? mid(input.coverMediaId) : null,
      passcode: input.passcode,
    });
    return {
      message:
        input.passcode === undefined
          ? "Album saved"
          : input.passcode
            ? "Album locked with that passcode"
            : "Album unlocked",
    };
  });
}
export async function sortAlbumsAction(input: { galleryId: string; ids: string[] }) {
  return studio(async ({ db }) => {
    await gal.sortAlbums(db, gid(input.galleryId), input.ids.map(mid));
    return { message: "Order saved" };
  });
}

/* ---- the gallery's own address, shop and price list ---- */
export async function saveLinkAction(input: { galleryId: string; slug: string; visibility: string }) {
  return studio(async ({ db }) => {
    await shop.setLink(db, gid(input.galleryId), { slug: input.slug, visibility: input.visibility });
    return { message: "Link saved" };
  });
}
export async function saveShopAction(input: {
  galleryId: string;
  enabled: boolean;
  listed?: boolean;
  sellDigital: boolean;
  sellPrints: boolean;
  freeDownloads?: string;
  proofing?: boolean;
  note: string;
  priceSheetId?: string;
  minOrder?: string;
  abandonedCart?: boolean;
  checkoutMessage?: string;
  printRelease?: string;
}) {
  return studio(async ({ db }) => {
    if (input.enabled) await assertPlan(db, "shop");
    const minDollars = input.minOrder?.trim() ? Number(input.minOrder.replace(/[$,\s]/g, "")) : 0;
    if (!Number.isFinite(minDollars) || minDollars < 0)
      throw new StudioError("Enter the smallest order as an amount like 25.");
    await shop.saveShop(db, gid(input.galleryId), {
      enabled: input.enabled,
      ...(input.listed === undefined ? {} : { listed: input.listed }),
      sellDigital: input.sellDigital,
      sellPrints: input.sellPrints,
      ...(input.freeDownloads === undefined ? {} : { freeDownloads: input.freeDownloads }),
      ...(input.proofing === undefined ? {} : { proofing: input.proofing }),
      note: input.note,
      ...(input.priceSheetId === undefined ? {} : { priceSheetId: input.priceSheetId }),
      ...(input.minOrder === undefined ? {} : { minOrderCents: Math.round(minDollars * 100) }),
      ...(input.abandonedCart === undefined ? {} : { abandonedCart: input.abandonedCart }),
      ...(input.checkoutMessage === undefined ? {} : { checkoutMessage: input.checkoutMessage }),
      ...(input.printRelease === undefined ? {} : { printRelease: htmlToText(input.printRelease) }),
    });
    return { message: "Store settings saved" };
  });
}
export async function saveProductAction(input: {
  id: string;
  name?: string;
  description?: string;
  price?: string;
  active?: boolean;
}) {
  return studio(async ({ db }) => {
    const cents = input.price === undefined ? undefined : Math.round(Number(input.price.replace(/[$,\s]/g, "")) * 100);
    if (cents !== undefined && !Number.isFinite(cents)) throw new StudioError("Enter a price like 12.50.");
    await shop.saveProduct(db, mid(input.id), {
      name: input.name,
      description: input.description,
      priceCents: cents,
      active: input.active,
    });
    return { message: "Product saved" };
  });
}
export async function cancelOrderAction(orderId: string) {
  return studio(async ({ db }) => {
    await shop.cancelOrder(db, mid(orderId));
    return { message: "Order cancelled" };
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
    await assertPlan(db, "galleries");
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
    await assertPlan(db, "galleries");
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

const num = (v: string | number | undefined) => (v === undefined || v === "" ? undefined : Number(v));

/** Protection settings for one gallery (what the page guard does and how strictly). Validated by the schema in the db package. */
export async function saveSecurityAction(input: {
  galleryId: string;
  level: string;
  onTrigger: string;
  strikes: string;
  lockMinutes: string;
  blurOnLeave: boolean;
  blockSelection: boolean;
  blockContextMenu: boolean;
  blockPrint: boolean;
  detectDevtools: boolean;
  holdToView: boolean;
  viewerOverlay: boolean;
  overlayOpacity: string;
  idleMinutes: string;
  maxDownloadsPerDay: string;
  notifyOwner: boolean;
}) {
  return studio(async ({ db }) => {
    await saveSecurity(db, gid(input.galleryId), {
      level: input.level as "off" | "light" | "strict",
      onTrigger: input.onTrigger as "log" | "warn" | "lock",
      strikes: num(input.strikes),
      lockMinutes: num(input.lockMinutes),
      blurOnLeave: input.blurOnLeave,
      blockSelection: input.blockSelection,
      blockContextMenu: input.blockContextMenu,
      blockPrint: input.blockPrint,
      detectDevtools: input.detectDevtools,
      holdToView: input.holdToView,
      viewerOverlay: input.viewerOverlay,
      overlayOpacity: num(input.overlayOpacity),
      idleMinutes: num(input.idleMinutes) ?? 0,
      maxDownloadsPerDay: num(input.maxDownloadsPerDay) ?? 0,
      notifyOwner: input.notifyOwner,
    });
    return {
      message: "Security settings saved",
      audit: {
        action: "studio.gallery.security",
        entity: "studio_gallery",
        entityId: input.galleryId,
        summary: "Changed gallery security settings",
      },
    };
  });
}

/** Saves any of the gallery's look and branding fields (validated and merged by the db layer). Plain-text messages may arrive as simple HTML and are converted. */
export async function saveStyleAction(input: { galleryId: string } & Partial<Record<keyof GalleryStyle, unknown>>) {
  return studio(async ({ db }) => {
    const { galleryId, ...patch } = input;
    const clean = { ...patch } as Record<string, unknown>;
    for (const k of ["introMessage", "aboutText"] as const)
      if (typeof clean[k] === "string") clean[k] = htmlToText(clean[k] as string);
    if (Array.isArray(clean.playlist) && clean.playlist.length) await assertPlan(db, "music");
    await saveStyle(db, gid(galleryId), clean as Partial<GalleryStyle>);
    return { message: "Look saved" };
  });
}

/** Lets locked-out viewers back in straight away. */
export async function clearLocksAction(galleryId: string) {
  return studio(async ({ db }) => {
    const n = await clearLocks(db, gid(galleryId));
    return {
      message: n ? "Let them back in" : "Nobody is locked out",
      audit: {
        action: "studio.gallery.unlock",
        entity: "studio_gallery",
        entityId: galleryId,
        summary: "Cleared gallery lock-outs",
      },
    };
  });
}

/* ---- free downloads: rules per gallery or album ---- */
export async function saveRuleAction(input: {
  galleryId: string;
  id?: string;
  albumId?: string;
  name: string;
  maxPx: string;
  perVisitor: string;
  watermarkId?: string;
  pin?: string;
  printRelease?: string;
  showAll?: boolean;
}) {
  return studio(async ({ db }) => {
    await extras.saveRule(db, {
      id: input.id,
      galleryId: gid(input.galleryId),
      albumId: input.albumId ? mid(input.albumId) : null,
      name: input.name,
      maxPx: input.maxPx.trim() ? Number(input.maxPx) : null,
      perVisitor: input.perVisitor.trim() ? Number(input.perVisitor) : null,
      watermarkId: input.watermarkId ? mid(input.watermarkId) : null,
      pin: input.pin,
      printRelease: input.printRelease === undefined ? undefined : htmlToText(input.printRelease),
      showAll: input.showAll,
    });
    return { message: "Download rule saved" };
  });
}
export async function deleteRuleAction(input: { galleryId: string; id: string }) {
  return studio(async ({ db }) => {
    await extras.deleteRule(db, gid(input.galleryId), mid(input.id));
    return { message: "Rule removed" };
  });
}

/* ---- watermarks, music and price sheets (studio-wide) ---- */
export async function setDefaultWatermarkAction(id: string) {
  return studio(async ({ db }) => {
    await extras.setDefaultWatermark(db, mid(id));
    return { message: "Default watermark set" };
  });
}
export async function deleteWatermarkAction(id: string) {
  return studio(async ({ db }) => {
    await extras.deleteWatermark(db, mid(id));
    return { message: "Watermark deleted" };
  });
}
export async function deleteTrackAction(id: string) {
  return studio(async ({ db }) => {
    await extras.deleteTrack(db, mid(id));
    return { message: "Track removed" };
  });
}
export async function createSheetAction(input: { name: string; copyFrom?: string }) {
  return studio(async ({ db }) => {
    await shop.createSheet(db, input.name, input.copyFrom ? mid(input.copyFrom) : undefined);
    return { message: "Price sheet created" };
  });
}
export async function renameSheetAction(input: { id: string; name: string }) {
  return studio(async ({ db }) => {
    await shop.renameSheet(db, mid(input.id), input.name);
    return { message: "Price sheet renamed" };
  });
}
export async function makeDefaultSheetAction(id: string) {
  return studio(async ({ db }) => {
    await shop.makeDefaultSheet(db, mid(id));
    return { message: "Default price sheet changed" };
  });
}
export async function deleteSheetAction(id: string) {
  return studio(async ({ db }) => {
    await shop.deleteSheet(db, mid(id));
    return { message: "Price sheet deleted" };
  });
}
