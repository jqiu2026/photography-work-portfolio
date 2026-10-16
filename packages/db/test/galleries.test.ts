import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, describe, expect, it } from "vitest";
import type { Database } from "../src/client";
import { savePolicies } from "../src/forms";
import * as gal from "../src/galleries";
import * as schema from "../src/schema";
import * as st from "../src/studio";

const here = path.dirname(fileURLToPath(import.meta.url));
let db: Database;
let jobId: string;
let gid: string;
let media: string[] = [];
beforeAll(async () => {
  const d = drizzle(await PGlite.create(), { schema, casing: "snake_case" });
  await migrate(d, { migrationsFolder: path.join(here, "../drizzle") });
  db = d as unknown as Database;
  const c = await st.createClient(db, { name: "Gal Client", email: "gal@example.com" });
  jobId = (await st.createJob(db, { clientId: c.id, title: "Gallery job" })).id;
  const rows = await db
    .insert(schema.media)
    .values(
      Array.from({ length: 5 }, (_, i) => ({
        filename: `p${i}.jpg`,
        mime: "image/jpeg",
        originalKey: `o/${i}`,
        derivatives: [],
      })),
    )
    .returning();
  media = rows.map((r) => r.id);
  const g = await st.createGallery(db, { jobId, passcode: "gallery-pass-1" });
  gid = g.id;
  await gal.addItems(db, gid, media);
  await st.publishGallery(db, gid);
});

describe("settings", () => {
  it("validates and saves settings, expiry months, passcode and PIN", async () => {
    const g = await gal.updateGallery(db, gid, {
      title: "Spring",
      welcome: "Thanks for coming",
      accent: "#cc3322",
      downloadPolicy: "web",
      accessMonths: 3,
      selectionLimit: 2,
      allowComments: true,
    });
    expect(g).toMatchObject({ title: "Spring", accent: "#cc3322", downloadPolicy: "web", selectionLimit: 2 });
    expect(g.expiresAt && g.expiresAt > new Date()).toBe(true);
    await expect(gal.updateGallery(db, gid, { accent: "red" })).rejects.toThrow(/hex/);
    await expect(gal.updateGallery(db, gid, { accessMonths: 500 })).rejects.toThrow();
    await expect(gal.updateGallery(db, gid, { title: "x" })).rejects.toThrow();
    await expect(gal.setPasscode(db, gid, "short")).rejects.toThrow(/6 characters/);
    const other = await st.createGallery(db, { jobId, passcode: "another-pass-2" });
    await expect(gal.setPasscode(db, other.id, "gallery-pass-1")).rejects.toThrow(/already used/);
    await expect(gal.setDownloadPin(db, gid, "12")).rejects.toThrow(/4 to 8/);
    await gal.setDownloadPin(db, gid, "4821");
    const [row] = await db.select().from(schema.studioGalleries).where(eq(schema.studioGalleries.id, gid));
    expect(await gal.checkDownloadPin(row, "4821")).toBe(true);
    expect(await gal.checkDownloadPin(row, "0000")).toBe(false);
    await gal.setDownloadPin(db, gid, "");
    const [cleared] = await db.select().from(schema.studioGalleries).where(eq(schema.studioGalleries.id, gid));
    expect(await gal.checkDownloadPin(cleared, "anything")).toBe(true);
  });

  it("download rules follow the policy", () => {
    expect(gal.downloadAllowed({ downloadPolicy: "none" }, "web")).toBe(false);
    expect(gal.downloadAllowed({ downloadPolicy: "preview" }, "web")).toBe(false);
    expect(gal.downloadAllowed({ downloadPolicy: "web" }, "web")).toBe(true);
    expect(gal.downloadAllowed({ downloadPolicy: "web" }, "full")).toBe(false);
    expect(gal.downloadAllowed({ downloadPolicy: "full" }, "full")).toBe(true);
  });
});

describe("albums and items", () => {
  it("creates albums, moves photographs, removing an album keeps the photographs, hidden ones leave the client's view", async () => {
    const a = await gal.createAlbum(db, gid, "Ceremony");
    await expect(gal.createAlbum(db, gid, "x")).rejects.toThrow();
    await gal.moveToAlbum(db, gid, [media[0], media[1]], a.id);
    let items = await gal.galleryContents(db, gid);
    expect(items.filter((i) => i.item.albumId === a.id)).toHaveLength(2);
    await gal.setHidden(db, gid, media[1], true);
    expect((await gal.galleryContents(db, gid)).map((i) => i.media.id)).not.toContain(media[1]);
    expect((await gal.galleryContents(db, gid, { includeHidden: true })).map((i) => i.media.id)).toContain(media[1]);
    await gal.deleteAlbum(db, gid, a.id);
    items = await gal.galleryContents(db, gid, { includeHidden: true });
    expect(items).toHaveLength(5);
    expect(items.every((i) => i.item.albumId === null)).toBe(true);
    await gal.setHidden(db, gid, media[1], false);
    await gal.setCover(db, gid, media[2]);
  });
});

describe("proofing and selections", () => {
  it("rates, approves, comments (validated), and the owner sees a summary; hidden photos cannot be touched", async () => {
    await gal.rate(db, gid, media[0], 4);
    await gal.rate(db, gid, media[0], 5);
    await expect(gal.rate(db, gid, media[0], 9)).rejects.toThrow(/1 to 5/);
    await gal.decide(db, gid, media[0], "approved");
    await gal.decide(db, gid, media[3], "rejected");
    await gal.comment(db, gid, media[0], "Love this one, can it be brighter?");
    await expect(gal.comment(db, gid, media[0], " ")).rejects.toThrow();
    await expect(gal.comment(db, gid, media[0], "x".repeat(1001))).rejects.toThrow(/1000/);
    await gal.comment(db, gid, media[0], "Sure, will do.", "studio");
    await gal.setHidden(db, gid, media[4], true);
    await expect(gal.rate(db, gid, media[4], 3)).rejects.toThrow(/not in this gallery/);
    await gal.setHidden(db, gid, media[4], false);
    const sum = await gal.proofSummary(db, gid);
    expect(sum.ratings[media[0]]).toBe(5);
    expect(sum.approved).toEqual([media[0]]);
    expect(sum.rejected).toEqual([media[3]]);
    expect(sum.comments.map((c) => c.author)).toEqual(["client", "studio"]);
    await gal.updateGallery(db, gid, { allowComments: false, allowRatings: false });
    await expect(gal.comment(db, gid, media[0], "another one")).rejects.toThrow(/off/);
    await expect(gal.rate(db, gid, media[0], 3)).rejects.toThrow(/off/);
    await gal.updateGallery(db, gid, { allowComments: true, allowRatings: true });
  });

  it("selection limit is enforced, sending locks the picks, and the owner can reopen", async () => {
    await st.toggleFavorite(db, gid, media[0]);
    await st.toggleFavorite(db, gid, media[1]);
    await expect(st.toggleFavorite(db, gid, media[2])).rejects.toThrow(/up to 2/);
    await st.toggleFavorite(db, gid, media[1]); // remove one
    await st.toggleFavorite(db, gid, media[2]);
    const sent = await gal.sendSelection(db, gid);
    expect(sent.count).toBe(2);
    await expect(gal.sendSelection(db, gid)).rejects.toThrow(/already sent/);
    await expect(st.toggleFavorite(db, gid, media[3])).rejects.toThrow(/already sent/);
    await expect(gal.decide(db, gid, media[3], "approved")).rejects.toThrow(/already sent/);
    await gal.reopenSelection(db, gid);
    await st.toggleFavorite(db, gid, media[2]);
    await expect(
      gal.sendSelection(db, (await st.createGallery(db, { jobId, passcode: "empty-pass-123" })).id),
    ).rejects.toThrow(/at least one/);
  });
});

describe("downloads log", () => {
  it("records downloads", async () => {
    await gal.logDownload(db, { galleryId: gid, mediaId: media[0], kind: "web", viewer: "v", bytes: 1234 });
    await gal.logDownload(db, { galleryId: gid, kind: "zip-web", part: 1 });
    const log = await gal.downloadLog(db, gid);
    expect(log.map((l) => l.kind).sort()).toEqual(["web", "zip-web"]);
  });
});

describe("expiry, reactivation and extension payments", () => {
  it("states: live, expiring, expired, archived; an extension counts from the end date or from today", async () => {
    const now = new Date("2027-06-01T00:00:00Z");
    const g = (status: "draft" | "published" | "archived", expiresAt: Date | null) => ({ status, expiresAt });
    expect(gal.galleryState(g("draft", null), now)).toBe("draft");
    expect(gal.galleryState(g("published", null), now)).toBe("live");
    expect(gal.galleryState(g("published", new Date("2027-06-10T00:00:00Z")), now)).toBe("expiring");
    expect(gal.galleryState(g("published", new Date("2027-08-01T00:00:00Z")), now)).toBe("live");
    expect(gal.galleryState(g("published", new Date("2027-05-01T00:00:00Z")), now)).toBe("expired");
    expect(gal.galleryState(g("archived", null), now)).toBe("archived");
    const live = await st.createGallery(db, { jobId, passcode: "extend-pass-77" });
    await st.publishGallery(db, live.id);
    await db
      .update(schema.studioGalleries)
      .set({ expiresAt: new Date("2027-07-01T00:00:00Z") })
      .where(eq(schema.studioGalleries.id, live.id));
    const ext = await gal.extendGallery(db, live.id, 3, now);
    expect(ext?.expiresAt?.toISOString().slice(0, 10)).toBe("2027-10-01"); // from the end date
    await db
      .update(schema.studioGalleries)
      .set({ expiresAt: new Date("2027-01-01T00:00:00Z"), status: "archived" })
      .where(eq(schema.studioGalleries.id, live.id));
    const back = await gal.extendGallery(db, live.id, 3, now);
    expect(back?.expiresAt?.toISOString().slice(0, 10)).toBe("2027-09-01"); // from today
    expect(back?.status).toBe("published");
    expect(back?.reactivatedAt).toBeTruthy();
  });

  it("finds an expired gallery by passcode, and paying the extension invoice extends it exactly once", async () => {
    const g = await st.createGallery(db, { jobId, passcode: "expired-pass-9" });
    await st.publishGallery(db, g.id);
    await db
      .update(schema.studioGalleries)
      .set({ expiresAt: new Date("2020-01-01T00:00:00Z"), title: "Old shoot" })
      .where(eq(schema.studioGalleries.id, g.id));
    expect(await st.openGalleryWithPasscode(db, "expired-pass-9")).toBeNull(); // normal opening refuses it
    expect((await gal.findGalleryByPasscode(db, "expired-pass-9"))?.id).toBe(g.id); // but it can be found to offer an extension
    await expect(gal.createExtensionInvoice(db, g.id)).rejects.toThrow(/not been set/);
    await savePolicies(db, { extensionFeeCents: 3000, extensionFeeIsSample: false, extensionMonths: 3 });
    const a = await gal.createExtensionInvoice(db, g.id);
    const again = await gal.createExtensionInvoice(db, g.id);
    expect(again.invoice.id).toBe(a.invoice.id); // one open extension invoice at a time
    expect(a.invoice.totalCents).toBe(3000);
    const rec = await st.recordPayment(db, {
      invoiceId: a.invoice.id,
      provider: "mock",
      providerRef: "ext-1",
      amountCents: 3000,
      status: "succeeded",
    });
    expect(rec.duplicate).toBe(false);
    const [after] = await db.select().from(schema.studioGalleries).where(eq(schema.studioGalleries.id, g.id));
    expect(after.expiresAt && after.expiresAt > new Date()).toBe(true);
    const first = after.expiresAt?.getTime();
    await st.recordPayment(db, {
      invoiceId: a.invoice.id,
      provider: "mock",
      providerRef: "ext-1",
      amountCents: 3000,
      status: "succeeded",
    }); // replay
    const [replay] = await db.select().from(schema.studioGalleries).where(eq(schema.studioGalleries.id, g.id));
    expect(replay.expiresAt?.getTime()).toBe(first);
    expect((await st.openGalleryWithPasscode(db, "expired-pass-9"))?.id).toBe(g.id);
    const [job] = await db.select().from(schema.studioJobs).where(eq(schema.studioJobs.id, jobId));
    expect(job.status).not.toBe("paid"); // an extension never marks the whole job paid
  });
});
