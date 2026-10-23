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

describe("studio gallery tools", () => {
  it("duplicates a gallery as a draft with its albums, items and settings, a fresh passcode, and no schedule", async () => {
    await gal.updateGallery(db, gid, { layout: "masonry", theme: "light", density: "large", notes: "private" });
    const album = await gal.createAlbum(db, gid, "Dupe album");
    await gal.moveToAlbum(db, gid, [media[0]], album.id);
    const { gallery: copy, passcode } = await gal.duplicateGallery(db, gid, "owner@test");
    expect(copy.id).not.toBe(gid);
    expect(copy.status).toBe("draft");
    expect(copy.title).toMatch(/\(copy\)$/);
    expect([copy.layout, copy.theme, copy.density, copy.notes]).toEqual(["masonry", "light", "large", "private"]);
    expect(passcode.length).toBe(8);
    expect(await gal.checkDownloadPin({ downloadPinHash: null }, "x")).toBe(true);
    const items = await gal.galleryContents(db, copy.id, { includeHidden: true });
    expect(items.length).toBe((await gal.galleryContents(db, gid, { includeHidden: true })).length);
    const copyAlbums = await gal.listAlbums(db, copy.id);
    expect(copyAlbums.map((a) => a.name)).toContain("Dupe album");
    // the moved photograph is in the copy's own album, not the original's
    const moved = items.find((i) => i.media.id === media[0]);
    expect(copyAlbums.find((a) => a.id === moved?.item.albumId)?.name).toBe("Dupe album");
  });

  it("generates passcodes that are readable and unique", async () => {
    const seen = new Set<string>();
    for (let i = 0; i < 20; i++) seen.add(await gal.freshPasscode(db));
    expect(seen.size).toBe(20);
    for (const c of seen) expect(c).toMatch(/^[abcdefghjkmnpqrstuvwxyz23456789]{8}$/);
  });

  it("sorts by filename, moves chosen photographs to the front, and hides, shows or removes several at once", async () => {
    const c = await st.createClient(db, { name: "Sort Client", email: "sort@example.com" });
    const j = await st.createJob(db, { clientId: c.id, title: "Sort job" });
    const g = await st.createGallery(db, { jobId: j.id, passcode: "sort-pass-12" });
    await gal.addItems(db, g.id, [media[3], media[1], media[2], media[0]]);
    await gal.sortItems(db, g.id, "name");
    expect((await gal.galleryContents(db, g.id)).map((r) => r.media.filename)).toEqual([
      "p0.jpg",
      "p1.jpg",
      "p2.jpg",
      "p3.jpg",
    ]);
    await gal.moveToFront(db, g.id, [media[3], media[2]]);
    expect((await gal.galleryContents(db, g.id)).map((r) => r.media.filename)).toEqual([
      "p3.jpg",
      "p2.jpg",
      "p0.jpg",
      "p1.jpg",
    ]);
    await gal.setHiddenMany(db, g.id, [media[0], media[1]], true);
    expect((await gal.galleryContents(db, g.id)).length).toBe(2);
    expect((await gal.galleryContents(db, g.id, { includeHidden: true })).length).toBe(4);
    await gal.setHiddenMany(db, g.id, [media[0]], false);
    await gal.removeMany(db, g.id, [media[2], media[3]]);
    expect((await gal.galleryContents(db, g.id, { includeHidden: true })).map((r) => r.media.filename)).toEqual([
      "p0.jpg",
      "p1.jpg",
    ]);
    await gal.setHiddenMany(db, g.id, [], true); // empty lists are fine
    await gal.removeMany(db, g.id, []);
  });

  it("schedules publishing: only drafts whose time has passed are due, and a bad date is refused", async () => {
    const c = await st.createClient(db, { name: "Sched Client", email: "sched@example.com" });
    const j = await st.createJob(db, { clientId: c.id, title: "Sched job" });
    const g = await st.createGallery(db, { jobId: j.id, passcode: "sched-pass-1" });
    await expect(gal.updateGallery(db, g.id, { publishAt: "not a date" })).rejects.toThrow(/valid publish date/);
    const now = new Date("2026-10-20T12:00:00Z");
    await gal.updateGallery(db, g.id, { publishAt: "2026-10-20T13:00:00Z" });
    expect((await gal.dueToPublish(db, now)).map((x) => x.id)).not.toContain(g.id);
    expect((await gal.dueToPublish(db, new Date("2026-10-20T13:00:01Z"))).map((x) => x.id)).toContain(g.id);
    await st.publishGallery(db, g.id);
    expect((await gal.dueToPublish(db, new Date("2026-10-21T00:00:00Z"))).map((x) => x.id)).not.toContain(g.id);
    await gal.updateGallery(db, g.id, { publishAt: null });
  });

  it("counts photographs, favorites, downloads and views per gallery, and summarizes the views", async () => {
    const stats = await gal.galleryStats(db, [gid, "00000000-0000-4000-8000-000000000000"]);
    expect(stats.get(gid)?.photos).toBeGreaterThan(0);
    expect(stats.get("00000000-0000-4000-8000-000000000000")).toEqual({
      photos: 0,
      favorites: 0,
      downloads: 0,
      views: 0,
      viewers: 0,
      bytes: 0,
    });
    expect(stats.get(gid)?.bytes).toBeGreaterThanOrEqual(0);
    expect((await gal.galleryStats(db, [])).size).toBe(0);
    await db.insert(schema.studioViewEvents).values([
      { mediaId: media[1], viewer: "client:a", code: "c1" },
      { mediaId: media[1], viewer: "client:a", code: "c1" },
      { mediaId: media[2], viewer: "client:b", code: "c2" },
    ]);
    const v = await gal.viewSummary(db, gid);
    expect(v.total).toBe(3);
    expect(v.viewers).toBe(2);
    expect(v.perPhoto[media[1]]).toBe(2);
    expect((await gal.galleryStats(db, [gid])).get(gid)).toMatchObject({ views: 3, viewers: 2 });
  });

  it("deleting a gallery hides it from every list but keeps the photographs", async () => {
    const { gallery } = await gal.duplicateGallery(db, gid);
    await gal.deleteGallery(db, gallery.id, "owner");
    expect((await st.listGalleries(db)).map((r) => r.gallery.id)).not.toContain(gallery.id);
    expect((await db.select().from(schema.media)).length).toBeGreaterThanOrEqual(5);
    await expect(gal.deleteGallery(db, gallery.id)).rejects.toThrow(/Unknown gallery/);
  });
});

import * as sec from "../src/gallery-security";

describe("gallery security", () => {
  it("reads settings through defaults, rejects bad values, and merges patches", async () => {
    expect(sec.readSecurity({})).toMatchObject({
      level: "strict",
      onTrigger: "warn",
      strikes: 3,
      holdToView: false,
      notifyOwner: true,
    });
    expect(sec.readSecurity({ strikes: 999, level: "weird" })).toMatchObject({ strikes: 3, level: "strict" }); // invalid input falls back wholesale
    expect(sec.readStyle(null)).toMatchObject({ font: "sans", gap: "normal", corners: "soft", background: "" });
    const c = await st.createClient(db, { name: "Sec Client", email: "sec@example.com" });
    const j = await st.createJob(db, { clientId: c.id, title: "Sec job" });
    const g = await st.createGallery(db, { jobId: j.id, passcode: "secure-pass-9" });
    const saved = await sec.saveSecurity(db, g.id, { onTrigger: "lock", strikes: 2, holdToView: true });
    expect(saved).toMatchObject({ onTrigger: "lock", strikes: 2, holdToView: true, lockMinutes: 30 });
    expect(await sec.saveSecurity(db, g.id, { lockMinutes: 60 })).toMatchObject({ strikes: 2, lockMinutes: 60 }); // earlier values kept
    await expect(sec.saveSecurity(db, g.id, { strikes: 0 })).rejects.toThrow();
    await expect(sec.saveStyle(db, g.id, { background: "red" })).rejects.toThrow(/hex/);
    expect(await sec.saveStyle(db, g.id, { font: "serif", footer: "Thanks" })).toMatchObject({
      font: "serif",
      footer: "Thanks",
    });
  });

  it("counts strikes per viewer, locks at the limit (by viewer or address), tells the owner, and can be cleared", async () => {
    const c = await st.createClient(db, { name: "Lock Client", email: "lock@example.com" });
    const j = await st.createJob(db, { clientId: c.id, title: "Lock job" });
    const g = await st.createGallery(db, { jobId: j.id, passcode: "lock-pass-77" });
    await sec.saveSecurity(db, g.id, { onTrigger: "lock", strikes: 3, lockMinutes: 10 });
    const now = new Date("2026-10-20T12:00:00Z");
    const who = { viewer: "v1", ipHash: "ip1" };
    const a = await sec.recordSecurityEvent(
      db,
      { galleryId: g.id, ...who, kind: "screenshot", combo: "PrintScreen" },
      now,
    );
    expect(a).toMatchObject({ action: "warned", strikes: 1, locked: false });
    await sec.recordSecurityEvent(db, { galleryId: g.id, ...who, kind: "save", combo: "Ctrl+S" }, now);
    expect(await sec.lockedUntil(db, g.id, who, now)).toBeNull();
    const c3 = await sec.recordSecurityEvent(db, { galleryId: g.id, ...who, kind: "devtools", combo: "F12" }, now);
    expect(c3).toMatchObject({ action: "locked", strikes: 3, locked: true });
    expect(c3.until?.toISOString()).toBe("2026-10-20T12:10:00.000Z");
    expect(await sec.lockedUntil(db, g.id, who, now)).not.toBeNull();
    // the same address with a fresh session is still locked; another address and viewer is not
    expect(await sec.lockedUntil(db, g.id, { viewer: "v2", ipHash: "ip1" }, now)).not.toBeNull();
    expect(await sec.lockedUntil(db, g.id, { viewer: "v3", ipHash: "ip3" }, now)).toBeNull();
    // the lock ends by itself
    expect(await sec.lockedUntil(db, g.id, who, new Date("2026-10-20T12:11:00Z"))).toBeNull();
    // strikes are counted over 24 hours only
    const later = await sec.recordSecurityEvent(
      db,
      { galleryId: g.id, viewer: "v1", kind: "screenshot" },
      new Date("2026-10-22T12:00:00Z"),
    );
    expect(later.strikes).toBe(1);
    // unknown kinds are stored as a screenshot trigger, never as free text
    const log = await sec.securityLog(db, g.id);
    expect(log.every((e) => ["screenshot", "save", "devtools", "lock"].includes(e.kind))).toBe(true);
    // the owner heard about the first trigger and the lock, not every key press
    const notes = (await db.select().from(schema.studioNotifications)).filter((n) => n.kind === "security");
    expect(notes.map((n) => n.title).some((t) => t.startsWith("Locked a viewer out"))).toBe(true);
    expect(notes.filter((n) => n.title.startsWith("Capture attempt")).length).toBeGreaterThanOrEqual(1);
    expect(await sec.clearLocks(db, g.id, now)).toBe(1);
    expect(await sec.lockedUntil(db, g.id, who, now)).toBeNull();
  });

  it("log-only and warn modes never lock; a daily download cap counts the viewer's downloads", async () => {
    const c = await st.createClient(db, { name: "Warn Client", email: "warn@example.com" });
    const j = await st.createJob(db, { clientId: c.id, title: "Warn job" });
    const g = await st.createGallery(db, { jobId: j.id, passcode: "warn-pass-55" });
    for (let i = 0; i < 6; i++) {
      const r = await sec.recordSecurityEvent(db, { galleryId: g.id, viewer: "w", kind: "print" });
      expect(r.locked).toBe(false);
    }
    await sec.saveSecurity(db, g.id, { onTrigger: "log" });
    expect((await sec.recordSecurityEvent(db, { galleryId: g.id, viewer: "w", kind: "print" })).action).toBe("logged");
    await gal.logDownload(db, { galleryId: g.id, kind: "web", viewer: "w" });
    await gal.logDownload(db, { galleryId: g.id, kind: "web", viewer: "w" });
    await gal.logDownload(db, { galleryId: g.id, kind: "web", viewer: "someone-else" });
    expect(await sec.downloadsInLastDay(db, g.id, "w")).toBe(2);
    expect(await sec.activeLockCount(db, [g.id])).toBe(0);
    expect(await sec.activeLockCount(db, [])).toBe(0);
  });
});
