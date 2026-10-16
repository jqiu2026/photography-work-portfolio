"use client";

import { ProtectedImage } from "@halation/ui/media";
import type { GallerySecurity, GalleryStyle } from "@jerryqiu/db/gallery-security";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  archiveGalleryAction,
  bulkPhotosAction,
  clearLocksAction,
  createAlbumAction,
  deleteAlbumAction,
  deleteGalleryAction,
  duplicateGalleryAction,
  extendGalleryFreeAction,
  moveToAlbumAction,
  publishNowAction,
  regeneratePasscodeAction,
  removeItemAction,
  reopenSelectionAction,
  replyCommentAction,
  saveGallerySettingsAction,
  saveSecurityAction,
  saveStyleAction,
  sendExtensionInvoiceAction,
  sendGalleryLinkAction,
  setCoverAction,
  setDownloadPinAction,
  setGalleryPasscodeAction,
  setHiddenAction,
  sortGalleryAction,
  unpublishAction,
} from "@/app/studio/gallery-actions";
import { GalleryAlbums } from "./GalleryAlbums";
import { GalleryShopPanel } from "./GalleryShopPanel";
import { GalleryUploader } from "./GalleryUploader";
import { Frame, useAct } from "./StudioFrame";
import "./gallery-manager.css";

type Item = {
  mediaId: string;
  filename: string;
  albumId: string | null;
  hidden: boolean;
  cover: boolean;
  width: number;
  height: number;
  color: string | null;
  blur: string | null;
  views: number;
  rating: number | null;
  approved: boolean;
  rejected: boolean;
  favourite: boolean;
};
export type GalleryManagerData = {
  id: string;
  title: string;
  jobTitle: string;
  clientName: string;
  clientEmail: string;
  status: string;
  state: string;
  accessMode: string;
  expiresAt: string | null;
  publishAt: string;
  notes: string;
  security: GallerySecurity;
  style: GalleryStyle;
  lockedNow: boolean;
  securityEvents: { id: string; kind: string; combo: string | null; action: string; viewer: string; at: string }[];
  layout: string;
  theme: string;
  density: string;
  welcome: string;
  accent: string;
  downloadPolicy: string;
  selectionLimit: number | null;
  allowComments: boolean;
  allowRatings: boolean;
  watermark: boolean;
  hasPin: boolean;
  selectionSentAt: string | null;
  stats: { photos: number; favourites: number; downloads: number; views: number; viewers: number };
  views: {
    total: number;
    viewers: number;
    last: string | null;
    recent: { id: string; at: string; viewer: string; file: string }[];
  };
  albums: { id: string; name: string }[];
  albumList: {
    id: string;
    name: string;
    description: string;
    parentId: string | null;
    locked: boolean;
    hidden: boolean;
    coverMediaId: string | null;
  }[];
  slug: string;
  visibility: string;
  shop: {
    enabled: boolean;
    listed: boolean;
    sellDigital: boolean;
    sellPrints: boolean;
    freeDownloads: string;
    proofing: boolean;
    note: string;
  };
  orders: {
    id: string;
    number: string;
    status: string;
    buyer: string;
    totalCents: number;
    at: string;
    items: number;
  }[];
  items: Item[];
  comments: { id: string; mediaId: string; filename: string; body: string; author: string; at: string }[];
  downloads: { id: string; kind: string; part: number | null; file: string | null; at: string; bytes: number | null }[];
  counts: { favourites: number; approved: number; rejected: number };
};

const TABS = [
  ["photos", "Photos"],
  ["albums", "Albums"],
  ["shop", "Shop"],
  ["share", "Share"],
  ["design", "Design"],
  ["security", "Security"],
  ["proofing", "Proofing"],
  ["activity", "Activity"],
  ["settings", "Settings"],
] as const;
type Tab = (typeof TABS)[number][0];
const STATE_LABEL: Record<string, string> = {
  draft: "Draft",
  live: "Live",
  expiring: "Expiring",
  expired: "Expired",
  archived: "Archived",
};

const asset = (it: Item) => ({
  id: it.mediaId,
  width: it.width,
  height: it.height,
  color: it.color ?? undefined,
  blur: it.blur ?? undefined,
  files: [],
});

/** One client gallery as a workspace: Photos, Share, Design, Proofing, Activity and Settings. */
export function GalleryManager({ data }: { user?: string; data: GalleryManagerData }) {
  const router = useRouter();
  const { pending, note, act, submit } = useAct();
  const gid = data.id;
  const [tab, setTab] = useState<Tab>("photos");
  useEffect(() => {
    const h = location.hash.slice(1) as Tab;
    if (TABS.some(([k]) => k === h)) setTab(h);
  }, []);
  const pick = (t: Tab) => {
    setTab(t);
    history.replaceState(null, "", `#${t}`);
  };
  const [secret, setSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState("");
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(location.origin), []);
  const link = `${origin}/client`;
  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(""), 1800);
    } catch {
      setCopied("Copy failed: select and copy it by hand");
    }
  };
  const run = (fn: () => Promise<{ ok: boolean; [k: string]: unknown }>, after?: () => void) =>
    act(async () => {
      const r = await fn();
      if (r.ok && typeof r.passcode === "string") setSecret(r.passcode);
      if (r.ok && typeof r.galleryId === "string" && r.galleryId !== gid) router.push(`/studio/gallery/${r.galleryId}`);
      return r;
    }, after);

  /* ---- settings form state, shared by Design, Share and Settings ---- */
  const [f, setF] = useState({
    title: data.title,
    welcome: data.welcome,
    accent: data.accent,
    downloadPolicy: data.downloadPolicy,
    selectionLimit: data.selectionLimit ? String(data.selectionLimit) : "",
    months: "",
    layout: data.layout,
    theme: data.theme,
    density: data.density,
    publishAt: data.publishAt,
    notes: data.notes,
    comments: data.allowComments,
    ratings: data.allowRatings,
    watermark: data.watermark,
  });
  const upd = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  const save = (message?: string) =>
    run(() =>
      saveGallerySettingsAction({
        galleryId: gid,
        title: f.title,
        welcome: f.welcome,
        accent: f.accent.trim(),
        downloadPolicy: f.downloadPolicy,
        accessMonths: f.months,
        selectionLimit: f.selectionLimit,
        allowComments: f.comments,
        allowRatings: f.ratings,
        watermark: f.watermark,
        layout: f.layout,
        theme: f.theme,
        density: f.density,
        publishAt: f.publishAt ? new Date(f.publishAt).toISOString() : "",
        notes: f.notes,
      }).then((r) => (r.ok && message ? { ...r, message } : r)),
    );
  const [sec, setSec] = useState(data.security);
  const updSec = <K extends keyof GallerySecurity>(k: K, v: GallerySecurity[K]) => setSec((x) => ({ ...x, [k]: v }));
  const [sty, setSty] = useState(data.style);
  const updSty = <K extends keyof GalleryStyle>(k: K, v: GalleryStyle[K]) => setSty((x) => ({ ...x, [k]: v }));
  const saveSec = () =>
    run(() =>
      saveSecurityAction({
        galleryId: gid,
        level: sec.level,
        onTrigger: sec.onTrigger,
        strikes: String(sec.strikes),
        lockMinutes: String(sec.lockMinutes),
        blurOnLeave: sec.blurOnLeave,
        blockSelection: sec.blockSelection,
        blockContextMenu: sec.blockContextMenu,
        blockPrint: sec.blockPrint,
        detectDevtools: sec.detectDevtools,
        holdToView: sec.holdToView,
        viewerOverlay: sec.viewerOverlay,
        overlayOpacity: String(sec.overlayOpacity),
        idleMinutes: String(sec.idleMinutes),
        maxDownloadsPerDay: String(sec.maxDownloadsPerDay),
        notifyOwner: sec.notifyOwner,
      }),
    );
  const saveLook = () => run(() => saveStyleAction({ galleryId: gid, ...sty }));
  const [misc, setMisc] = useState<Record<string, string>>({});
  const m = (k: string) => ({
    value: misc[k] ?? "",
    onChange: (e: { target: { value: string } }) => setMisc((x) => ({ ...x, [k]: e.target.value })),
  });

  /* ---- photos ---- */
  const [album, setAlbum] = useState<string>("all");
  const [filter, setFilter] = useState("all");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [selecting, setSelecting] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(data.items.length === 0);
  const [uploadAlbum, setUploadAlbum] = useState("");
  const [viewing, setViewing] = useState<number | null>(null);
  const shown = useMemo(
    () =>
      data.items.filter(
        (i) =>
          (album === "all" || (album === "none" ? !i.albumId : i.albumId === album)) &&
          (filter === "all" ||
            (filter === "favourites" && i.favourite) ||
            (filter === "rated" && i.rating) ||
            (filter === "approved" && i.approved) ||
            (filter === "hidden" && i.hidden)),
      ),
    [data.items, album, filter],
  );
  const toggle = (id: string) =>
    setSel((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const bulk = (op: "hide" | "show" | "remove" | "album" | "front", albumId?: string) => {
    if (op === "remove" && !confirm(`Remove ${sel.size} photograph${sel.size === 1 ? "" : "s"} from this gallery?`))
      return;
    const ids = [...sel];
    run(
      () => bulkPhotosAction({ galleryId: gid, mediaIds: ids, op, albumId }),
      () => setSel(new Set()),
    );
  };
  const cur = viewing === null ? null : shown[viewing];

  const dlg = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    if (viewing !== null && !d.open) d.showModal();
    if (viewing === null && d.open) d.close();
  }, [viewing]);
  useEffect(() => {
    if (viewing === null) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setViewing((v) => (v === null ? v : Math.min(shown.length - 1, v + 1)));
      if (e.key === "ArrowLeft") setViewing((v) => (v === null ? v : Math.max(0, v - 1)));
    };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  }, [viewing, shown.length]);

  /* ---- proofing export ---- */
  const picked = data.items.filter((i) => i.favourite || i.approved);
  const csv = () => {
    const rows = [["filename", "favourite", "rating", "decision", "comments"]].concat(
      data.items
        .filter((i) => i.favourite || i.rating || i.approved || i.rejected)
        .map((i) => [
          i.filename,
          i.favourite ? "yes" : "",
          i.rating ? String(i.rating) : "",
          i.approved ? "approved" : i.rejected ? "rejected" : "",
          String(data.comments.filter((c) => c.mediaId === i.mediaId).length),
        ]),
    );
    const body = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([body], { type: "text/csv" }));
    a.download = `${data.title.replace(/[^\w]+/g, "-").toLowerCase()}-selection.csv`;
    a.click();
  };

  const live = data.status === "published";
  return (
    <Frame section="galleries" note={note} head={false}>
      <div className="gm">
        <p className="gm-back">
          <Link href="/studio/galleries">← Galleries</Link>
        </p>
        <header className="gm-head">
          <div>
            <h1 className="gm-title">{data.title}</h1>
            <p className="gm-meta" role="status">
              {data.clientName} · {data.jobTitle}{" "}
              <em data-state={data.state}>{STATE_LABEL[data.state] ?? data.state}</em>
              {data.expiresAt ? ` · until ${data.expiresAt}` : ""}
              {data.publishAt && !live ? ` · publishes ${data.publishAt.replace("T", " ")}` : ""}
            </p>
          </div>
          <div className="gm-actions">
            {live ? (
              <button
                type="button"
                className="st-btn st-btn--ghost"
                disabled={pending}
                onClick={() => run(() => unpublishAction(gid))}
              >
                Unpublish
              </button>
            ) : (
              <button
                type="button"
                className="st-btn"
                disabled={pending || !data.items.length}
                onClick={() => run(() => publishNowAction(gid))}
              >
                Publish
              </button>
            )}
            <button
              type="button"
              className="st-btn st-btn--ghost"
              disabled={pending}
              onClick={() => run(() => sendGalleryLinkAction(gid))}
            >
              Email the client
            </button>
          </div>
        </header>
        <dl className="gm-stats">
          <div>
            <dt>Photos</dt>
            <dd>{data.stats.photos}</dd>
          </div>
          <div>
            <dt>Views</dt>
            <dd>{data.stats.views}</dd>
          </div>
          <div>
            <dt>Visitors</dt>
            <dd>{data.stats.viewers}</dd>
          </div>
          <div>
            <dt>Favourites</dt>
            <dd>{data.stats.favourites}</dd>
          </div>
          <div>
            <dt>Downloads</dt>
            <dd>{data.stats.downloads}</dd>
          </div>
        </dl>

        <div className="gm-tabs" role="tablist" aria-label="Gallery sections">
          {TABS.map(([k, label]) => (
            <button
              key={k}
              type="button"
              role="tab"
              id={`gm-tab-${k}`}
              aria-selected={tab === k}
              aria-controls={`gm-${k}`}
              onClick={() => pick(k)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ---------------- Photos ---------------- */}
        <section id="gm-photos" role="tabpanel" aria-labelledby="gm-tab-photos" hidden={tab !== "photos"}>
          <div className="gm-bar">
            <button
              type="button"
              className="st-btn"
              aria-expanded={uploadOpen}
              onClick={() => setUploadOpen((v) => !v)}
            >
              Upload photographs
            </button>
            <div className="gm-chips" role="group" aria-label="Albums">
              <button type="button" aria-pressed={album === "all"} onClick={() => setAlbum("all")}>
                All
              </button>
              {data.albums.map((a) => (
                <button key={a.id} type="button" aria-pressed={album === a.id} onClick={() => setAlbum(a.id)}>
                  {a.name}
                </button>
              ))}
              {data.albums.length ? (
                <button type="button" aria-pressed={album === "none"} onClick={() => setAlbum("none")}>
                  No album
                </button>
              ) : null}
            </div>
            <select aria-label="Show" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">Everything</option>
              <option value="favourites">Favourites</option>
              <option value="rated">Rated</option>
              <option value="approved">Approved</option>
              <option value="hidden">Hidden</option>
            </select>
            <select
              aria-label="Sort photographs"
              value=""
              disabled={pending || !data.items.length}
              onChange={(e) => e.target.value && run(() => sortGalleryAction({ galleryId: gid, mode: e.target.value }))}
            >
              <option value="">Sort by…</option>
              <option value="name">Filename</option>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
            <button
              type="button"
              className="st-btn st-btn--ghost"
              aria-pressed={selecting}
              onClick={() => {
                setSelecting((v) => !v);
                setSel(new Set());
              }}
            >
              {selecting ? "Done" : "Select"}
            </button>
            {selecting ? (
              <button
                type="button"
                className="st-btn st-btn--ghost"
                onClick={() => setSel(new Set(shown.map((i) => i.mediaId)))}
              >
                Select all {shown.length}
              </button>
            ) : null}
          </div>

          {uploadOpen ? (
            <div className="gm-upload">
              {data.albums.length ? (
                <label>
                  Into album
                  <select value={uploadAlbum} onChange={(e) => setUploadAlbum(e.target.value)}>
                    <option value="">No album</option>
                    {data.albums.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <GalleryUploader galleryId={gid} albumId={uploadAlbum || undefined} />
            </div>
          ) : null}

          <form
            className="gm-inline"
            noValidate
            aria-label="New album"
            onSubmit={submit(
              () => createAlbumAction({ galleryId: gid, name: misc.album ?? "" }),
              () => setMisc((x) => ({ ...x, album: "" })),
            )}
          >
            <input aria-label="Album name" placeholder="New album" {...m("album")} />
            <button type="submit" className="st-btn st-btn--ghost" disabled={pending}>
              Add album
            </button>
            {album !== "all" && album !== "none" ? (
              <button
                type="button"
                className="st-btn st-btn--ghost"
                disabled={pending}
                onClick={() =>
                  run(
                    () => deleteAlbumAction({ galleryId: gid, albumId: album }),
                    () => setAlbum("all"),
                  )
                }
              >
                Delete this album
              </button>
            ) : null}
          </form>

          <ul className="gm-grid" aria-label="Gallery photographs" data-selecting={selecting || undefined}>
            {shown.map((it, n) => (
              <li
                key={it.mediaId}
                data-media-id={it.mediaId}
                data-hidden={it.hidden || undefined}
                data-selected={sel.has(it.mediaId) || undefined}
              >
                <button
                  type="button"
                  className="gm-photo"
                  aria-label={selecting ? `Select ${it.filename}` : `Open ${it.filename}`}
                  aria-pressed={selecting ? sel.has(it.mediaId) : undefined}
                  onClick={() => (selecting ? toggle(it.mediaId) : setViewing(n))}
                >
                  <ProtectedImage asset={asset(it)} alt={it.filename} fill fit="cover" />
                </button>
                <span className="gm-badges" aria-hidden="true">
                  {it.cover ? <b>Cover</b> : null}
                  {it.hidden ? <b>Hidden</b> : null}
                  {it.favourite ? <b>♥</b> : null}
                  {it.rating ? <b>{it.rating}★</b> : null}
                  {it.approved ? <b>✓</b> : null}
                  {it.rejected ? <b>✕</b> : null}
                </span>
                <span className="gm-tick" aria-hidden="true" />
                <small>{it.filename}</small>
              </li>
            ))}
          </ul>
          {!shown.length ? (
            <p className="gm-empty">
              {data.items.length
                ? "No photographs match this filter."
                : "No photographs yet. Upload some to get started."}
            </p>
          ) : null}

          {sel.size ? (
            <div className="gm-bulk" role="toolbar" aria-label="Selected photographs">
              <strong>{sel.size} selected</strong>
              <select
                aria-label="Move to album"
                value=""
                disabled={pending}
                onChange={(e) =>
                  e.target.value !== "" && bulk("album", e.target.value === "none" ? undefined : e.target.value)
                }
              >
                <option value="">Move to album…</option>
                <option value="none">No album</option>
                {data.albums.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <button type="button" className="st-btn st-btn--ghost" disabled={pending} onClick={() => bulk("front")}>
                Move to front
              </button>
              <button type="button" className="st-btn st-btn--ghost" disabled={pending} onClick={() => bulk("hide")}>
                Hide
              </button>
              <button type="button" className="st-btn st-btn--ghost" disabled={pending} onClick={() => bulk("show")}>
                Show
              </button>
              {sel.size === 1 ? (
                <button
                  type="button"
                  className="st-btn st-btn--ghost"
                  disabled={pending}
                  onClick={() => run(() => setCoverAction({ galleryId: gid, mediaId: [...sel][0] }))}
                >
                  Make cover
                </button>
              ) : null}
              <button type="button" className="st-btn st-btn--ghost" disabled={pending} onClick={() => bulk("remove")}>
                Remove
              </button>
              <button type="button" className="st-btn st-btn--ghost" onClick={() => setSel(new Set())}>
                Clear
              </button>
            </div>
          ) : null}

          <dialog ref={dlg} className="gm-view" aria-label="Photograph" onClose={() => setViewing(null)}>
            {cur ? (
              <>
                <div className="gm-view-stage">
                  <ProtectedImage asset={asset(cur)} alt={cur.filename} sizes="90vw" />
                </div>
                <div className="gm-view-side">
                  <p>
                    <strong>{cur.filename}</strong>
                    <small>
                      {cur.width} × {cur.height} · {cur.views} views{cur.rating ? ` · ${cur.rating}★` : ""}
                      {cur.favourite ? " · ♥" : ""}
                      {cur.approved ? " · approved" : ""}
                      {cur.rejected ? " · rejected" : ""}
                    </small>
                  </p>
                  {data.albums.length ? (
                    <select
                      aria-label={`Album for ${cur.filename}`}
                      value={cur.albumId ?? ""}
                      disabled={pending}
                      onChange={(e) =>
                        run(() => moveToAlbumAction({ galleryId: gid, mediaId: cur.mediaId, albumId: e.target.value }))
                      }
                    >
                      <option value="">No album</option>
                      {data.albums.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  ) : null}
                  <div className="gm-view-actions">
                    <button
                      type="button"
                      className="st-btn st-btn--ghost"
                      disabled={pending}
                      aria-label={`Make ${cur.filename} the cover`}
                      onClick={() => run(() => setCoverAction({ galleryId: gid, mediaId: cur.mediaId }))}
                    >
                      Make cover
                    </button>
                    <button
                      type="button"
                      className="st-btn st-btn--ghost"
                      disabled={pending}
                      aria-label={`${cur.hidden ? "Show" : "Hide"} ${cur.filename}`}
                      onClick={() =>
                        run(() => setHiddenAction({ galleryId: gid, mediaId: cur.mediaId, hidden: !cur.hidden }))
                      }
                    >
                      {cur.hidden ? "Show" : "Hide"}
                    </button>
                    <button
                      type="button"
                      className="st-btn st-btn--ghost"
                      disabled={pending}
                      aria-label={`Remove ${cur.filename}`}
                      onClick={() => {
                        run(() => removeItemAction({ galleryId: gid, mediaId: cur.mediaId }));
                        setViewing(null);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="gm-view-nav">
                    <button
                      type="button"
                      className="st-btn st-btn--ghost"
                      disabled={viewing === 0}
                      onClick={() => setViewing((v) => Math.max(0, (v ?? 0) - 1))}
                      aria-label="Previous photograph"
                    >
                      ← Prev
                    </button>
                    <span>
                      {(viewing ?? 0) + 1} / {shown.length}
                    </span>
                    <button
                      type="button"
                      className="st-btn st-btn--ghost"
                      disabled={viewing === shown.length - 1}
                      onClick={() => setViewing((v) => Math.min(shown.length - 1, (v ?? 0) + 1))}
                      aria-label="Next photograph"
                    >
                      Next →
                    </button>
                  </div>
                  <button type="button" className="st-btn st-btn--ghost" onClick={() => setViewing(null)}>
                    Close
                  </button>
                </div>
              </>
            ) : null}
          </dialog>
        </section>

        {/* ---------------- Albums ---------------- */}
        <section
          id="gm-albums"
          role="tabpanel"
          aria-labelledby="gm-tab-albums"
          hidden={tab !== "albums"}
          className="gm-panel"
        >
          <GalleryAlbums
            galleryId={gid}
            albums={data.albumList}
            items={data.items.map((i) => ({ mediaId: i.mediaId, filename: i.filename, albumId: i.albumId }))}
            run={run}
            pending={pending}
          />
        </section>

        {/* ---------------- Shop ---------------- */}
        <section
          id="gm-shop"
          role="tabpanel"
          aria-labelledby="gm-tab-shop"
          hidden={tab !== "shop"}
          className="gm-panel"
        >
          <GalleryShopPanel
            galleryId={gid}
            link={{ slug: data.slug, visibility: data.visibility }}
            shop={data.shop}
            orders={data.orders}
            live={live}
            origin={origin}
            run={run}
            pending={pending}
            copy={copy}
            copied={copied}
          />
        </section>

        {/* ---------------- Share ---------------- */}
        <section
          id="gm-share"
          role="tabpanel"
          aria-labelledby="gm-tab-share"
          hidden={tab !== "share"}
          className="gm-panel"
        >
          <div className="gm-block">
            <h2>Client link</h2>
            <p className="st-note">
              Clients open it, then enter the passcode.{" "}
              {live ? "The gallery is live." : "Publish the gallery before sending this."}
            </p>
            <div className="gm-row">
              <code>{link}</code>
              <button type="button" className="st-btn st-btn--ghost" onClick={() => copy(link, "Link copied")}>
                Copy link
              </button>
              <button
                type="button"
                className="st-btn st-btn--ghost"
                disabled={pending}
                onClick={() => run(() => sendGalleryLinkAction(gid))}
              >
                Email {data.clientName || "the client"}
              </button>
            </div>
            {data.clientEmail ? (
              <p className="st-note">Goes to {data.clientEmail}. The email has the link, not the passcode.</p>
            ) : null}
            {copied ? (
              <p className="st-note" role="status">
                {copied}
              </p>
            ) : null}
          </div>
          <div className="gm-block">
            <h2>Passcode</h2>
            <p className="st-note">
              Passcodes are stored hashed, so an existing one cannot be shown. Make a new one and give it to the client.
            </p>
            <div className="gm-row">
              <button
                type="button"
                className="st-btn"
                disabled={pending}
                onClick={() => run(() => regeneratePasscodeAction(gid))}
              >
                Generate a new passcode
              </button>
              {secret ? (
                <>
                  <code aria-label="New passcode">{secret}</code>
                  <button
                    type="button"
                    className="st-btn st-btn--ghost"
                    onClick={() => copy(secret, "Passcode copied")}
                  >
                    Copy
                  </button>
                </>
              ) : null}
            </div>
            <form
              noValidate
              className="gm-inline"
              aria-label="Passcode"
              onSubmit={submit(
                () => setGalleryPasscodeAction({ galleryId: gid, passcode: misc.pc ?? "" }),
                () => setMisc((x) => ({ ...x, pc: "" })),
              )}
            >
              <input
                aria-label="New passcode (6+ characters)"
                placeholder="Or choose your own (6+ characters)"
                autoComplete="off"
                {...m("pc")}
              />
              <button type="submit" className="st-btn st-btn--ghost" disabled={pending}>
                Change passcode
              </button>
            </form>
          </div>
          <div className="gm-block">
            <h2>Downloads</h2>
            <div className="gm-fields">
              <label>
                What clients can download
                <select value={f.downloadPolicy} onChange={(e) => upd("downloadPolicy", e.target.value)}>
                  <option value="none">Nothing</option>
                  <option value="preview">Protected previews only</option>
                  <option value="web">Web size</option>
                  <option value="full">Web size and full resolution</option>
                </select>
              </label>
              <button
                type="button"
                className="st-btn"
                disabled={pending}
                onClick={() => save("Download setting saved")}
              >
                Save
              </button>
            </div>
            <form
              noValidate
              className="gm-inline"
              aria-label="Download PIN"
              onSubmit={submit(
                () => setDownloadPinAction({ galleryId: gid, pin: misc.pin ?? "" }),
                () => setMisc((x) => ({ ...x, pin: "" })),
              )}
            >
              <input
                aria-label="Download PIN (4 to 8 digits, blank removes it)"
                placeholder={
                  data.hasPin ? "PIN set · enter a new one, or blank to remove" : "Download PIN (4 to 8 digits)"
                }
                inputMode="numeric"
                autoComplete="off"
                {...m("pin")}
              />
              <button type="submit" className="st-btn st-btn--ghost" disabled={pending}>
                Save PIN
              </button>
            </form>
          </div>
        </section>

        {/* ---------------- Design ---------------- */}
        <section
          id="gm-design"
          role="tabpanel"
          aria-labelledby="gm-tab-design"
          hidden={tab !== "design"}
          className="gm-panel"
        >
          <div className="gm-block">
            <h2>Layout</h2>
            <div className="gm-choice" role="radiogroup" aria-label="Layout">
              {(["grid", "masonry", "rows", "mosaic", "story"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={f.layout === k}
                  onClick={() => upd("layout", k)}
                  data-kind={k}
                >
                  <span className="gm-mini" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </span>
                  {k[0].toUpperCase() + k.slice(1)}
                </button>
              ))}
            </div>
            <div className="gm-fields">
              <label>
                Thumbnail size
                <select value={f.density} onChange={(e) => upd("density", e.target.value)}>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </label>
              <label>
                Theme
                <select value={f.theme} onChange={(e) => upd("theme", e.target.value)}>
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="paper">Paper (warm)</option>
                  <option value="slate">Slate (cool)</option>
                </select>
              </label>
              <label>
                Accent colour
                <span className="gm-colour">
                  <input
                    type="color"
                    aria-label="Pick accent colour"
                    value={/^#[0-9a-f]{6}$/i.test(f.accent) ? f.accent : "#ffffff"}
                    onChange={(e) => upd("accent", e.target.value)}
                  />
                  <input
                    aria-label="Accent colour (optional, like #cc3322)"
                    placeholder="#cc3322"
                    value={f.accent}
                    onChange={(e) => upd("accent", e.target.value)}
                  />
                </span>
              </label>
            </div>
          </div>
          <div className="gm-block">
            <h2>Welcome message</h2>
            <label className="gm-wide">
              Shown above the photographs
              <textarea rows={3} value={f.welcome} onChange={(e) => upd("welcome", e.target.value)} />
            </label>
            <p className="st-note">The cover is chosen in Photos: open a photograph and use Make cover.</p>
            <button type="button" className="st-btn" disabled={pending} onClick={() => save("Design saved")}>
              Save design
            </button>
          </div>
          <div className="gm-block">
            <h2>Look</h2>
            <div className="gm-fields">
              <label>
                Typeface
                <select value={sty.font} onChange={(e) => updSty("font", e.target.value as GalleryStyle["font"])}>
                  <option value="sans">Sans (clean)</option>
                  <option value="modern">Modern (geometric)</option>
                  <option value="serif">Serif (Georgia)</option>
                  <option value="editorial">Editorial (high contrast headlines)</option>
                  <option value="classic">Classic (light, elegant)</option>
                  <option value="display">Display (soft headlines)</option>
                  <option value="mono">Mono</option>
                </select>
              </label>
              <label>
                Opening
                <select value={sty.header} onChange={(e) => updSty("header", e.target.value as GalleryStyle["header"])}>
                  <option value="cinematic">Cinematic (full cover, title over it)</option>
                  <option value="split">Split (cover beside the title)</option>
                  <option value="minimal">Minimal (title only)</option>
                </select>
              </label>
              <label>
                Albums are shown as
                <select
                  value={sty.albumView}
                  onChange={(e) => updSty("albumView", e.target.value as GalleryStyle["albumView"])}
                >
                  <option value="tabs">Tabs above the photographs</option>
                  <option value="cards">A page of album cards first</option>
                </select>
              </label>
              <label>
                Spacing
                <select value={sty.gap} onChange={(e) => updSty("gap", e.target.value as GalleryStyle["gap"])}>
                  <option value="tight">Tight</option>
                  <option value="normal">Normal</option>
                  <option value="wide">Wide</option>
                </select>
              </label>
              <label>
                Corners
                <select
                  value={sty.corners}
                  onChange={(e) => updSty("corners", e.target.value as GalleryStyle["corners"])}
                >
                  <option value="square">Square</option>
                  <option value="soft">Soft</option>
                  <option value="round">Round</option>
                </select>
              </label>
              <label>
                Background colour (optional)
                <span className="gm-colour">
                  <input
                    type="color"
                    aria-label="Pick background colour"
                    value={/^#[0-9a-f]{6}$/i.test(sty.background) ? sty.background : "#000000"}
                    onChange={(e) => updSty("background", e.target.value)}
                  />
                  <input
                    aria-label="Background colour (hex, optional)"
                    placeholder="#101010"
                    value={sty.background}
                    onChange={(e) => updSty("background", e.target.value)}
                  />
                </span>
              </label>
              <label className="gm-check">
                <input
                  type="checkbox"
                  checked={sty.heroCover}
                  onChange={(e) => updSty("heroCover", e.target.checked)}
                />{" "}
                Legacy: cover above the photographs (the Opening setting replaces this)
              </label>
              <label className="gm-check">
                <input
                  type="checkbox"
                  checked={sty.showFilenames}
                  onChange={(e) => updSty("showFilenames", e.target.checked)}
                />{" "}
                Show filenames under photographs
              </label>
              <label className="gm-wide">
                Line above the title (for example your studio name)
                <input maxLength={60} value={sty.brandLine} onChange={(e) => updSty("brandLine", e.target.value)} />
              </label>
              <label className="gm-wide">
                Closing note under the photographs
                <textarea
                  rows={2}
                  maxLength={300}
                  value={sty.footer}
                  onChange={(e) => updSty("footer", e.target.value)}
                />
              </label>
            </div>
            <button type="button" className="st-btn" disabled={pending} onClick={saveLook}>
              Save look
            </button>
          </div>
        </section>

        {/* ---------------- Security ---------------- */}
        <section
          id="gm-security"
          role="tabpanel"
          aria-labelledby="gm-tab-security"
          hidden={tab !== "security"}
          className="gm-panel"
        >
          <p className="st-note">
            These settings deter and trace; they cannot stop everything. A web page can see screenshot, save and print
            keys, a screen-capture request from the page itself, and when the window loses focus. It cannot see a phone
            camera, another device or most recording tools. What it can do is hide the photographs, warn, log, and lock
            the viewer out.
          </p>
          <div className="gm-block">
            <h2>Protection</h2>
            <div className="gm-fields">
              <label>
                Level
                <select value={sec.level} onChange={(e) => updSec("level", e.target.value as GallerySecurity["level"])}>
                  <option value="off">Off</option>
                  <option value="light">Light: no right-click or drag on photographs</option>
                  <option value="strict">Strict: also watches for screenshot, save, print and devtools keys</option>
                </select>
              </label>
              <label>
                When a key or capture attempt is seen
                <select
                  value={sec.onTrigger}
                  onChange={(e) => updSec("onTrigger", e.target.value as GallerySecurity["onTrigger"])}
                  disabled={sec.level !== "strict"}
                >
                  <option value="log">Log it only (hide photographs briefly)</option>
                  <option value="warn">Warn the viewer</option>
                  <option value="lock">Warn, then lock them out after repeated attempts</option>
                </select>
              </label>
              {sec.onTrigger === "lock" ? (
                <>
                  <label>
                    Attempts before a lock
                    <input
                      inputMode="numeric"
                      value={sec.strikes}
                      onChange={(e) => updSec("strikes", Number(e.target.value) || 1)}
                    />
                  </label>
                  <label>
                    Lock for (minutes)
                    <input
                      inputMode="numeric"
                      value={sec.lockMinutes}
                      onChange={(e) => updSec("lockMinutes", Number(e.target.value) || 1)}
                    />
                  </label>
                </>
              ) : null}
            </div>
          </div>
          <div className="gm-block">
            <h2>What the page does</h2>
            <div className="gm-fields">
              <label className="gm-check">
                <input
                  type="checkbox"
                  checked={sec.holdToView}
                  onChange={(e) => updSec("holdToView", e.target.checked)}
                />{" "}
                Photographs stay blurred until the viewer presses and holds (or holds Shift)
              </label>
              <label className="gm-check">
                <input
                  type="checkbox"
                  checked={sec.blurOnLeave}
                  onChange={(e) => updSec("blurOnLeave", e.target.checked)}
                />{" "}
                Hide photographs when the window or tab loses focus
              </label>
              <label className="gm-check">
                <input
                  type="checkbox"
                  checked={sec.blockSelection}
                  onChange={(e) => updSec("blockSelection", e.target.checked)}
                />{" "}
                No text selection
              </label>
              <label className="gm-check">
                <input
                  type="checkbox"
                  checked={sec.blockContextMenu}
                  onChange={(e) => updSec("blockContextMenu", e.target.checked)}
                />{" "}
                No right-click menu or dragging photographs
              </label>
              <label className="gm-check">
                <input
                  type="checkbox"
                  checked={sec.blockPrint}
                  onChange={(e) => updSec("blockPrint", e.target.checked)}
                />{" "}
                Cancel Save and Print shortcuts
              </label>
              <label className="gm-check">
                <input
                  type="checkbox"
                  checked={sec.detectDevtools}
                  onChange={(e) => updSec("detectDevtools", e.target.checked)}
                />{" "}
                Treat a docked developer-tools panel as an attempt (can misfire)
              </label>
              <label className="gm-check">
                <input
                  type="checkbox"
                  checked={sec.viewerOverlay}
                  onChange={(e) => updSec("viewerOverlay", e.target.checked)}
                />{" "}
                Tile a faint viewer code over the page (traces a photographed screen)
              </label>
              {sec.viewerOverlay ? (
                <label>
                  Overlay strength
                  <input
                    type="range"
                    min={0.04}
                    max={0.4}
                    step={0.02}
                    value={sec.overlayOpacity}
                    onChange={(e) => updSec("overlayOpacity", Number(e.target.value))}
                    aria-label="Overlay strength"
                  />
                </label>
              ) : null}
            </div>
          </div>
          <div className="gm-block">
            <h2>Sessions and downloads</h2>
            <div className="gm-fields">
              <label>
                Close after idle minutes (0 = never)
                <input
                  inputMode="numeric"
                  value={sec.idleMinutes}
                  onChange={(e) => updSec("idleMinutes", Number(e.target.value) || 0)}
                />
              </label>
              <label>
                Most downloads per viewer per day (0 = unlimited)
                <input
                  inputMode="numeric"
                  value={sec.maxDownloadsPerDay}
                  onChange={(e) => updSec("maxDownloadsPerDay", Number(e.target.value) || 0)}
                />
              </label>
              <label className="gm-check">
                <input
                  type="checkbox"
                  checked={sec.notifyOwner}
                  onChange={(e) => updSec("notifyOwner", e.target.checked)}
                />{" "}
                Tell me in the activity feed (first attempt and every lock)
              </label>
            </div>
            <div className="gm-row">
              <button type="button" className="st-btn" disabled={pending} onClick={saveSec}>
                Save security
              </button>
              {data.lockedNow ? (
                <button
                  type="button"
                  className="st-btn st-btn--ghost"
                  disabled={pending}
                  onClick={() => run(() => clearLocksAction(gid))}
                >
                  Let locked-out viewers back in
                </button>
              ) : null}
            </div>
          </div>
        </section>

        {/* ---------------- Proofing ---------------- */}
        <section
          id="gm-proofing"
          role="tabpanel"
          aria-labelledby="gm-tab-proofing"
          hidden={tab !== "proofing"}
          className="gm-panel"
        >
          <div className="gm-block">
            <h2>What the client picked</h2>
            <p className="st-note">
              {data.counts.favourites} favourite{data.counts.favourites === 1 ? "" : "s"} · {data.counts.approved}{" "}
              approved · {data.counts.rejected} rejected
              {data.selectionLimit ? ` · limit ${data.selectionLimit}` : ""}
              {data.selectionSentAt ? ` · sent ${data.selectionSentAt}` : ""}
            </p>
            <div className="gm-row">
              <button
                type="button"
                className="st-btn st-btn--ghost"
                disabled={!picked.length}
                onClick={() => copy(picked.map((i) => i.filename).join("\n"), "Filenames copied")}
              >
                Copy filenames
              </button>
              <button type="button" className="st-btn st-btn--ghost" disabled={!picked.length} onClick={csv}>
                Download CSV
              </button>
              {data.selectionSentAt ? (
                <button
                  type="button"
                  className="st-btn st-btn--ghost"
                  disabled={pending}
                  onClick={() => run(() => reopenSelectionAction(gid))}
                >
                  Reopen the selection
                </button>
              ) : null}
            </div>
            {picked.length ? (
              <ul className="gm-thumbs" aria-label="Picked photographs">
                {picked.map((i) => (
                  <li key={i.mediaId} title={i.filename}>
                    <ProtectedImage asset={asset(i)} alt={i.filename} fill fit="cover" />
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="gm-fields">
              <label>
                Selection limit (blank = none)
                <input
                  inputMode="numeric"
                  value={f.selectionLimit}
                  onChange={(e) => upd("selectionLimit", e.target.value)}
                />
              </label>
              <label className="gm-check">
                <input type="checkbox" checked={f.comments} onChange={(e) => upd("comments", e.target.checked)} />{" "}
                Clients can comment
              </label>
              <label className="gm-check">
                <input type="checkbox" checked={f.ratings} onChange={(e) => upd("ratings", e.target.checked)} /> Clients
                can rate
              </label>
              <button type="button" className="st-btn" disabled={pending} onClick={() => save("Proofing saved")}>
                Save
              </button>
            </div>
          </div>
          <div className="gm-block">
            <h2>Comments</h2>
            <ul className="gm-list">
              {data.comments.map((c) => (
                <li key={c.id}>
                  <span>
                    <strong>{c.author === "client" ? "Client" : "You"}</strong> on {c.filename} <small>{c.at}</small>
                    <small>{c.body}</small>
                  </span>
                  {c.author === "client" ? (
                    <form
                      noValidate
                      className="gm-inline"
                      aria-label={`Reply about ${c.filename}`}
                      onSubmit={submit(
                        () => replyCommentAction({ galleryId: gid, mediaId: c.mediaId, body: misc[`r-${c.id}`] ?? "" }),
                        () => setMisc((x) => ({ ...x, [`r-${c.id}`]: "" })),
                      )}
                    >
                      <input aria-label={`Reply to ${c.filename}`} {...m(`r-${c.id}`)} />
                      <button type="submit" className="st-btn st-btn--ghost" disabled={pending}>
                        Reply
                      </button>
                    </form>
                  ) : null}
                </li>
              ))}
              {!data.comments.length ? <li className="st-note">No comments yet.</li> : null}
            </ul>
          </div>
        </section>

        {/* ---------------- Activity ---------------- */}
        <section
          id="gm-activity"
          role="tabpanel"
          aria-labelledby="gm-tab-activity"
          hidden={tab !== "activity"}
          className="gm-panel"
        >
          <div className="gm-block">
            <h2>Views</h2>
            <p className="st-note">
              {data.views.total} view{data.views.total === 1 ? "" : "s"} by {data.views.viewers} visitor
              {data.views.viewers === 1 ? "" : "s"}
              {data.views.last ? ` · last ${data.views.last}` : ""}
            </p>
            <ul className="gm-list">
              {data.views.recent.map((v) => (
                <li key={v.id}>
                  <span>
                    {v.file}
                    <small>
                      {v.viewer} · {v.at}
                    </small>
                  </span>
                </li>
              ))}
              {!data.views.recent.length ? <li className="st-note">Nobody has opened a photograph yet.</li> : null}
            </ul>
          </div>
          <div className="gm-block">
            <h2>Capture attempts</h2>
            <ul className="gm-list" aria-label="Capture attempts">
              {data.securityEvents.map((e) => (
                <li key={e.id}>
                  <span>
                    {e.kind === "lock"
                      ? "Locked out"
                      : e.kind === "idle"
                        ? "Closed after idle time"
                        : `${e.kind}${e.combo ? ` · ${e.combo}` : ""}`}
                    <small>
                      viewer …{e.viewer} · {e.action} · {e.at}
                    </small>
                  </span>
                </li>
              ))}
              {!data.securityEvents.length ? <li className="st-note">No attempts logged.</li> : null}
            </ul>
          </div>
          <div className="gm-block">
            <h2>Downloads</h2>
            <ul className="gm-list">
              {data.downloads.map((d) => (
                <li key={d.id}>
                  <span>
                    {d.kind}
                    {d.part ? ` part ${d.part}` : ""}
                    {d.file ? ` · ${d.file}` : ""}
                    <small>{d.at}</small>
                  </span>
                </li>
              ))}
              {!data.downloads.length ? <li className="st-note">Nothing downloaded yet.</li> : null}
            </ul>
          </div>
        </section>

        {/* ---------------- Settings ---------------- */}
        <section
          id="gm-settings"
          role="tabpanel"
          aria-labelledby="gm-tab-settings"
          hidden={tab !== "settings"}
          className="gm-panel"
        >
          <div className="gm-block">
            <h2>General</h2>
            <div className="gm-fields">
              <label className="gm-wide">
                Title
                <input value={f.title} onChange={(e) => upd("title", e.target.value)} />
              </label>
              <label className="gm-wide">
                Private notes (never shown to the client)
                <textarea rows={2} value={f.notes} onChange={(e) => upd("notes", e.target.value)} />
              </label>
              <label className="gm-check">
                <input type="checkbox" checked={f.watermark} onChange={(e) => upd("watermark", e.target.checked)} />{" "}
                Visible watermark on previews
              </label>
            </div>
            <button type="button" className="st-btn" disabled={pending} onClick={() => save("Gallery settings saved")}>
              Save settings
            </button>
          </div>
          <div className="gm-block">
            <h2>Publishing</h2>
            <div className="gm-fields">
              <label>
                Publish automatically at
                <input
                  type="datetime-local"
                  value={f.publishAt}
                  disabled={live}
                  onChange={(e) => upd("publishAt", e.target.value)}
                />
              </label>
              <label>
                Access from today, in months (blank = leave as is, 0 = no expiry)
                <input inputMode="numeric" value={f.months} onChange={(e) => upd("months", e.target.value)} />
              </label>
              <button type="button" className="st-btn" disabled={pending} onClick={() => save("Publishing saved")}>
                Save
              </button>
            </div>
            <p className="st-note">
              A scheduled gallery publishes and emails the client within the hour.{" "}
              {live ? "This one is already live." : ""}
            </p>
          </div>
          <div className="gm-block">
            <h2>Expiry and extensions</h2>
            <p className="st-note">
              Access is {data.state}
              {data.expiresAt ? ` until ${data.expiresAt}` : ""}. An expired or archived gallery offers the client a
              paid extension.
            </p>
            <div className="gm-row">
              <button
                type="button"
                className="st-btn"
                disabled={pending}
                onClick={() => run(() => sendExtensionInvoiceAction(gid))}
              >
                Send an extension invoice
              </button>
              <button
                type="button"
                className="st-btn st-btn--ghost"
                disabled={pending}
                onClick={() => run(() => archiveGalleryAction({ galleryId: gid, archive: data.status !== "archived" }))}
              >
                {data.status === "archived" ? "Publish again" : "Archive"}
              </button>
            </div>
            <form
              noValidate
              className="gm-inline"
              aria-label="Free extension"
              onSubmit={submit(() => extendGalleryFreeAction({ galleryId: gid, months: misc.fm ?? "" }))}
            >
              <input
                aria-label="Extend for free (months)"
                placeholder="Extend for free (months)"
                inputMode="numeric"
                {...m("fm")}
              />
              <button type="submit" className="st-btn st-btn--ghost" disabled={pending}>
                Extend
              </button>
            </form>
          </div>
          <div className="gm-block gm-danger">
            <h2>Duplicate or delete</h2>
            <div className="gm-row">
              <button
                type="button"
                className="st-btn st-btn--ghost"
                disabled={pending}
                onClick={() => run(() => duplicateGalleryAction(gid))}
              >
                Duplicate as a draft
              </button>
              <button
                type="button"
                className="st-btn st-btn--ghost"
                disabled={pending}
                onClick={() => {
                  if (confirm(`Delete "${data.title}"? Clients lose access. The photographs stay in your library.`))
                    run(
                      () => deleteGalleryAction(gid),
                      () => router.push("/studio/galleries"),
                    );
                }}
              >
                Delete gallery
              </button>
            </div>
          </div>
        </section>
      </div>
    </Frame>
  );
}
