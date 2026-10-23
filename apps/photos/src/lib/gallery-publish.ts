import { emit } from "@jerryqiu/db/webhooks";
import "server-only";
import { type Database, schema } from "@jerryqiu/db";
import { galleryReadyAllowed } from "@jerryqiu/db/automation";
import * as gal from "@jerryqiu/db/galleries";
import { publishGallery } from "@jerryqiu/db/studio";
import { sendTemplate } from "@jerryqiu/email";
import { getSite } from "@jerryqiu/sites";
import { eq } from "drizzle-orm";

/** The client behind a gallery (through its job). */
export async function galleryClient(db: Database, galleryId: string) {
  const [row] = await db
    .select({ client: schema.studioClients, gallery: schema.studioGalleries })
    .from(schema.studioGalleries)
    .innerJoin(schema.studioJobs, eq(schema.studioJobs.id, schema.studioGalleries.jobId))
    .innerJoin(schema.studioClients, eq(schema.studioClients.id, schema.studioJobs.clientId))
    .where(eq(schema.studioGalleries.id, galleryId));
  return row;
}

/** Emails the client that the gallery is ready. The passcode is not in the email: it is stored hashed, so the studio shares it. */
export async function emailGalleryLink(db: Database, galleryId: string, opts: { force?: boolean } = {}) {
  const row = await galleryClient(db, galleryId);
  if (!row) return false;
  if (!opts.force && !(await galleryReadyAllowed(db, row.client.id))) return false;
  await sendTemplate(
    db,
    row.client.email,
    "gallery-ready",
    {
      name: row.client.name,
      title: row.gallery.title,
      link: `${getSite("photos").url}${row.gallery.slug ? `/g/${row.gallery.slug}` : ""}`,
      linkLabel: "Open your gallery",
    },
    { related: { type: "gallery", id: row.gallery.id } },
  );
  return true;
}

/** Publishes a gallery and tells the client (unless they switched "gallery ready" emails off). */
export async function publishAndNotify(db: Database, galleryId: string, by?: string) {
  const g = await publishGallery(db, galleryId, by);
  if (g) {
    await emailGalleryLink(db, g.id);
    await emit(db, "gallery.published", { id: g.id, title: g.title, slug: g.slug });
    await db.update(schema.studioGalleries).set({ publishAt: null }).where(eq(schema.studioGalleries.id, g.id));
  }
  return g;
}

/** Cron step: publish every draft whose scheduled time has come. */
export async function publishScheduled(db: Database, now = new Date()) {
  const due = await gal.dueToPublish(db, now);
  for (const g of due) await publishAndNotify(db, g.id, "schedule");
  return due.length;
}
