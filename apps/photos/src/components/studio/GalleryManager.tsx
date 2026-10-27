"use client";

import { DateField, DateTimeField } from "@/components/DateField";
import { ProtectedImage } from "@/components/media";
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
import { publishToPortfolioAction } from "@/app/studio/business-actions";
import {
  ArrowLeftIcon,
  Button,
  Checkbox,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  EmptyState,
  Field,
  Input,
  MailIcon,
  PageActions,
  PageDescription,
  PageEyebrow,
  PageHeader,
  PageTitle,
  Segment,
  SegmentedControl,
  Select,
  SettingsSection,
  Slider,
  Stat,
  StatGroup,
  Status,
  Surface,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Text,
  Textarea,
  useToast,
} from "@holominimal/ui";
import { GalleryAlbums } from "./GalleryAlbums";
import { GalleryBranding } from "./GalleryBranding";
import { type DownloadRuleRow, GalleryDownloads } from "./GalleryDownloads";
import { GalleryLinkPanel } from "./GalleryLinkPanel";
import { GalleryShopPanel, type StoreSettings } from "./GalleryShopPanel";
import { GalleryUploader } from "./GalleryUploader";
import { FormDialog, Frame, useAct, useConfirm } from "./StudioFrame";
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
  favorite: boolean;
};
export type GalleryManagerData = {
  /** The portfolio subjects photographs can be published to (empty unless the viewer is the owner). */
  portfolioSubjects: { id: string; title: string }[];
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
  shootDate: string;
  orderDueDate: string;
  emailRequired: boolean;
  autoArchive: boolean;
  rules: DownloadRuleRow[];
  watermarks: { id: string; name: string }[];
  tracks: { id: string; title: string; artist: string }[];
  notes: string;
  security: GallerySecurity;
  style: GalleryStyle;
  lockedNow: boolean;
  securityEvents: {
    id: string;
    kind: string;
    combo: string | null;
    action: string;
    viewer: string;
    via: string;
    device: string;
    at: string;
  }[];
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
  stats: { photos: number; favorites: number; downloads: number; views: number; viewers: number };
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
  shop: StoreSettings;
  sheets: { id: string; name: string; isDefault: boolean }[];
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
  counts: { favorites: number; approved: number; rejected: number };
};

const TABS = [
  ["photos", "Photos"],
  ["albums", "Albums"],
  ["share", "Share"],
  ["design", "Branding"],
  ["downloads", "Downloads"],
  ["shop", "Store"],
  ["security", "Security"],
  ["proofing", "Proofing"],
  ["activity", "Activity"],
  ["settings", "Settings"],
] as const;
type TabId = (typeof TABS)[number][0];
const STATE_LABEL: Record<string, string> = {
  draft: "Draft",
  live: "Live",
  expiring: "Expiring",
  expired: "Expired",
  archived: "Archived",
};

const STATE_TONE: Record<string, "success" | "warning" | "neutral" | "muted"> = {
  live: "success",
  expiring: "warning",
  draft: "neutral",
  expired: "muted",
  archived: "muted",
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
  const [tab, setTab] = useState<TabId>("photos");
  useEffect(() => {
    const h = location.hash.slice(1) as TabId;
    if (TABS.some(([k]) => k === h)) setTab(h);
  }, []);
  const pick = (t: TabId) => {
    setTab(t);
    history.replaceState(null, "", `#${t}`);
  };
  const [secret, setSecret] = useState<string | null>(null);
  const { toast } = useToast();
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(location.origin), []);
  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: what, tone: "success", duration: 2500 });
    } catch {
      toast({ title: "Copy failed", description: "Select it and copy it by hand.", tone: "danger" });
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
    shootDate: data.shootDate,
    orderDueDate: data.orderDueDate,
    emailRequired: data.emailRequired,
    autoArchive: data.autoArchive,
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
        shootDate: f.shootDate,
        orderDueDate: f.orderDueDate,
        emailRequired: f.emailRequired,
        autoArchive: f.autoArchive,
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
            (filter === "favorites" && i.favorite) ||
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
  const [ask, confirmEl] = useConfirm();
  const [pub, setPub] = useState(false);
  const [dupe, setDupe] = useState<{ photos: boolean } | null>(null);
  const [pubSubject, setPubSubject] = useState("");
  const [pubConsent, setPubConsent] = useState("");
  const bulk = async (op: "hide" | "show" | "remove" | "album" | "front", albumId?: string) => {
    if (
      op === "remove" &&
      !(await ask({
        title: `Remove ${sel.size} photograph${sel.size === 1 ? "" : "s"}?`,
        body: "They leave this gallery. The files stay in your library.",
        action: "Remove",
      }))
    )
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
  const picked = data.items.filter((i) => i.favorite || i.approved);
  const csv = () => {
    const rows = [["filename", "favorite", "rating", "decision", "comments"]].concat(
      data.items
        .filter((i) => i.favorite || i.rating || i.approved || i.rejected)
        .map((i) => [
          i.filename,
          i.favorite ? "yes" : "",
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
        <Button asChild variant="ghost" size="sm" className="gm-back">
          <Link href="/studio/galleries">
            <ArrowLeftIcon /> Galleries
          </Link>
        </Button>
        <PageHeader className="gm-head">
          <PageEyebrow>
            {data.clientName} · {data.jobTitle}
          </PageEyebrow>
          <PageTitle>{data.title}</PageTitle>
          <PageDescription className="gm-meta" role="status">
            <Status tone={STATE_TONE[data.state] ?? "neutral"}>{STATE_LABEL[data.state] ?? data.state}</Status>
            {data.expiresAt ? ` · until ${data.expiresAt}` : ""}
            {data.publishAt && !live ? ` · publishes ${data.publishAt.replace("T", " ")}` : ""}
          </PageDescription>
          <PageActions>
            {data.slug ? (
              <Button asChild variant="secondary">
                <a href={`/g/${data.slug}`} target="_blank" rel="noreferrer">
                  View gallery
                </a>
              </Button>
            ) : null}
            <Button variant="secondary" disabled={pending} onClick={() => run(() => sendGalleryLinkAction(gid))}>
              <MailIcon /> Email the client
            </Button>
            {live ? (
              <Button
                variant="secondary"
                disabled={pending}
                onClick={async () =>
                  (await ask({
                    title: "Unpublish this gallery?",
                    body: "The client's link stops working until you publish again. Nothing is deleted.",
                    action: "Unpublish",
                  })) && run(() => unpublishAction(gid))
                }
              >
                Unpublish
              </Button>
            ) : (
              <Button disabled={pending || !data.items.length} onClick={() => run(() => publishNowAction(gid))}>
                Publish
              </Button>
            )}
          </PageActions>
        </PageHeader>
        <StatGroup className="gm-stats">
          <Stat label="Photos" value={data.stats.photos} />
          <Stat label="Views" value={data.stats.views} />
          <Stat label="Visitors" value={data.stats.viewers} />
          <Stat label="Favorites" value={data.stats.favorites} />
          <Stat label="Downloads" value={data.stats.downloads} />
        </StatGroup>

        <Tabs value={tab} onValueChange={(v) => pick(v as TabId)}>
          <TabList aria-label="Gallery sections" className="gm-tabs">
            {TABS.map(([k, label]) => (
              <Tab key={k} value={k}>
                {label}
              </Tab>
            ))}
          </TabList>
          {/* ---------------- Photos ---------------- */}
          <TabPanel value="photos" keepMounted className="gm-panel gm-panel--photos">
            <div className="gm-bar">
              <Button aria-expanded={uploadOpen} onClick={() => setUploadOpen((v) => !v)}>
                Upload photographs
              </Button>
              {data.albums.length ? (
                <SegmentedControl aria-label="Albums" value={album} onValueChange={setAlbum}>
                  <Segment value="all">All</Segment>
                  {data.albums.map((a) => (
                    <Segment key={a.id} value={a.id}>
                      {a.name}
                    </Segment>
                  ))}
                  {data.albums.length ? <Segment value="none">No album</Segment> : null}
                </SegmentedControl>
              ) : null}
              <Select aria-label="Show" value={filter} onValueChange={(v) => setFilter(v)}>
                <option value="all">Everything</option>
                <option value="favorites">Favorites</option>
                <option value="rated">Rated</option>
                <option value="approved">Approved</option>
                <option value="hidden">Hidden</option>
              </Select>
              <Select
                aria-label="Sort photographs"
                value=""
                disabled={pending || !data.items.length}
                onValueChange={(v) => v && run(() => sortGalleryAction({ galleryId: gid, mode: v }))}
              >
                <option value="">Sort by…</option>
                <option value="name">Filename</option>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </Select>
              <Button
                variant="secondary"
                aria-pressed={selecting}
                onClick={() => {
                  setSelecting((v) => !v);
                  setSel(new Set());
                }}
              >
                {selecting ? "Done" : "Select"}
              </Button>
              {selecting ? (
                <Button variant="secondary" onClick={() => setSel(new Set(shown.map((i) => i.mediaId)))}>
                  Select all {shown.length}
                </Button>
              ) : null}
            </div>

            {uploadOpen ? (
              <div className="gm-upload">
                {data.albums.length ? (
                  <Field label="Into album">
                    <Select value={uploadAlbum} onValueChange={(v) => setUploadAlbum(v)}>
                      <option value="">No album</option>
                      {data.albums.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
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
              <Input aria-label="Album name" placeholder="New album" {...m("album")} />
              <Button type="submit" variant="secondary" disabled={pending}>
                Add album
              </Button>
              {album !== "all" && album !== "none" ? (
                <Button
                  variant="danger"
                  disabled={pending}
                  onClick={async () => {
                    if (
                      await ask({
                        title: "Delete this album?",
                        body: "Its photographs stay in the gallery, outside any album.",
                        action: "Delete album",
                      })
                    )
                      run(
                        () => deleteAlbumAction({ galleryId: gid, albumId: album }),
                        () => setAlbum("all"),
                      );
                  }}
                >
                  Delete this album
                </Button>
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
                    {it.favorite ? <b>♥</b> : null}
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
              <EmptyState>
                {data.items.length
                  ? "No photographs match this filter."
                  : "No photographs yet. Upload some to get started."}
              </EmptyState>
            ) : null}

            {sel.size ? (
              <div className="gm-bulk" role="toolbar" aria-label="Selected photographs">
                <strong>{sel.size} selected</strong>
                <Select
                  aria-label="Move to album"
                  value=""
                  disabled={pending}
                  onValueChange={(v) => v !== "" && bulk("album", v === "none" ? undefined : v)}
                >
                  <option value="">Move to album…</option>
                  <option value="none">No album</option>
                  {data.albums.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </Select>
                <Button variant="secondary" disabled={pending} onClick={() => bulk("front")}>
                  Move to front
                </Button>
                <Button variant="secondary" disabled={pending} onClick={() => bulk("hide")}>
                  Hide
                </Button>
                <Button variant="secondary" disabled={pending} onClick={() => bulk("show")}>
                  Show
                </Button>
                {sel.size === 1 ? (
                  <Button
                    variant="secondary"
                    disabled={pending}
                    onClick={() => run(() => setCoverAction({ galleryId: gid, mediaId: [...sel][0] }))}
                  >
                    Make cover
                  </Button>
                ) : null}
                {data.portfolioSubjects.length ? (
                  <Button variant="secondary" disabled={pending} onClick={() => setPub(true)}>
                    Publish to portfolio…
                  </Button>
                ) : null}
                <Button variant="danger" disabled={pending} onClick={() => bulk("remove")}>
                  Remove
                </Button>
                <Button variant="secondary" onClick={() => setSel(new Set())}>
                  Clear
                </Button>
              </div>
            ) : null}

            <dialog
              ref={dlg}
              className="gm-view hm-theme"
              data-hm-scheme="dark"
              aria-label="Photograph"
              onClose={() => setViewing(null)}
            >
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
                        {cur.favorite ? " · ♥" : ""}
                        {cur.approved ? " · approved" : ""}
                        {cur.rejected ? " · rejected" : ""}
                      </small>
                    </p>
                    {data.albums.length ? (
                      <Field label="Album">
                        <Select
                          aria-label={`Album for ${cur.filename}`}
                          value={cur.albumId ?? ""}
                          disabled={pending}
                          onValueChange={(v) =>
                            run(() => moveToAlbumAction({ galleryId: gid, mediaId: cur.mediaId, albumId: v }))
                          }
                        >
                          <option value="">No album</option>
                          {data.albums.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                        </Select>
                      </Field>
                    ) : null}
                    <div className="gm-view-actions">
                      <Button
                        variant="secondary"
                        disabled={pending}
                        aria-label={`Make ${cur.filename} the cover`}
                        onClick={() => run(() => setCoverAction({ galleryId: gid, mediaId: cur.mediaId }))}
                      >
                        Make cover
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={pending}
                        aria-label={`${cur.hidden ? "Show" : "Hide"} ${cur.filename}`}
                        onClick={() =>
                          run(() => setHiddenAction({ galleryId: gid, mediaId: cur.mediaId, hidden: !cur.hidden }))
                        }
                      >
                        {cur.hidden ? "Show" : "Hide"}
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={pending}
                        aria-label={`Remove ${cur.filename}`}
                        onClick={async () => {
                          if (
                            !(await ask({
                              title: `Remove ${cur.filename}?`,
                              body: "It leaves this gallery. The file stays in your library.",
                              action: "Remove",
                            }))
                          )
                            return;
                          run(() => removeItemAction({ galleryId: gid, mediaId: cur.mediaId }));
                          setViewing(null);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="gm-view-nav">
                      <Button
                        variant="secondary"
                        disabled={viewing === 0}
                        onClick={() => setViewing((v) => Math.max(0, (v ?? 0) - 1))}
                        aria-label="Previous photograph"
                      >
                        <ChevronLeftIcon />
                      </Button>
                      <span>
                        {(viewing ?? 0) + 1} / {shown.length}
                      </span>
                      <Button
                        variant="secondary"
                        disabled={viewing === shown.length - 1}
                        onClick={() => setViewing((v) => Math.min(shown.length - 1, (v ?? 0) + 1))}
                        aria-label="Next photograph"
                      >
                        <ChevronRightIcon />
                      </Button>
                    </div>
                    <Button variant="secondary" onClick={() => setViewing(null)}>
                      <CloseIcon /> Close
                    </Button>
                  </div>
                </>
              ) : null}
            </dialog>
          </TabPanel>

          {/* ---------------- Albums ---------------- */}
          <TabPanel value="albums" keepMounted className="gm-panel">
            <GalleryAlbums
              galleryId={gid}
              albums={data.albumList}
              items={data.items.map((i) => ({ mediaId: i.mediaId, filename: i.filename, albumId: i.albumId }))}
              run={run}
              pending={pending}
            />
          </TabPanel>

          {/* ---------------- Shop ---------------- */}
          <TabPanel value="shop" keepMounted className="gm-panel">
            <GalleryShopPanel
              galleryId={gid}
              shop={data.shop}
              sheets={data.sheets}
              orders={data.orders}
              run={run}
              pending={pending}
            />
          </TabPanel>

          {/* ---------------- Share ---------------- */}
          <TabPanel value="share" keepMounted className="gm-panel">
            <GalleryLinkPanel
              galleryId={gid}
              link={{ slug: data.slug, visibility: data.visibility }}
              live={live}
              origin={origin}
              clientName={data.clientName}
              clientEmail={data.clientEmail}
              run={run}
              pending={pending}
              copy={copy}
            />
            <SettingsSection title="Passcode" className="gm-block">
              <Text size="sm" tone="muted">
                Passcodes are stored hashed, so an existing one cannot be shown. Make a new one and give it to the
                client.
              </Text>
              <div className="gm-row">
                <Button
                  disabled={pending}
                  onClick={async () =>
                    (await ask({
                      title: "Make a new passcode?",
                      body: "The old passcode stops working at once. Give the new one to the client.",
                      action: "Make a new passcode",
                    })) && run(() => regeneratePasscodeAction(gid))
                  }
                >
                  Generate a new passcode
                </Button>
                {secret ? (
                  <>
                    <code aria-label="New passcode">{secret}</code>
                    <Button variant="secondary" onClick={() => copy(secret, "Passcode copied")}>
                      Copy
                    </Button>
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
                <Input
                  aria-label="New passcode (6+ characters)"
                  placeholder="Or choose your own (6+ characters)"
                  autoComplete="off"
                  {...m("pc")}
                />
                <Button type="submit" variant="secondary" disabled={pending}>
                  Change passcode
                </Button>
              </form>
            </SettingsSection>
            <SettingsSection title="Access and privacy" className="gm-block">
              <div className="gm-fields">
                <Checkbox
                  checked={f.emailRequired}
                  onChange={(e) => upd("emailRequired", e.target.checked)}
                  label="Ask visitors for their email address before they see the gallery"
                />
              </div>
              <Text size="sm" tone="muted">
                Their emails are collected under Galleries, Visitors.{" "}
                {live ? "The gallery is live." : "The gallery is not live yet."} Publish and unpublish are at the top of
                this page.
              </Text>
              <Button disabled={pending} onClick={() => save("Access settings saved")}>
                Save
              </Button>
            </SettingsSection>
          </TabPanel>

          {/* ---------------- Downloads ---------------- */}
          <TabPanel value="downloads" keepMounted className="gm-panel">
            <GalleryDownloads
              galleryId={gid}
              rules={data.rules}
              albums={data.albums}
              watermarks={data.watermarks}
              run={run}
              pending={pending}
            />
            <SettingsSection title="Downloads" className="gm-block">
              <div className="gm-fields">
                <Field label="What clients can download">
                  <Select value={f.downloadPolicy} onValueChange={(v) => upd("downloadPolicy", v)}>
                    <option value="none">Nothing</option>
                    <option value="preview">Protected previews only</option>
                    <option value="web">Web size</option>
                    <option value="full">Web size and full resolution</option>
                  </Select>
                </Field>
                <Button disabled={pending} onClick={() => save("Download setting saved")}>
                  Save
                </Button>
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
                <Input
                  aria-label="Download PIN (4 to 8 digits, blank removes it)"
                  placeholder={
                    data.hasPin ? "PIN set · enter a new one, or blank to remove" : "Download PIN (4 to 8 digits)"
                  }
                  inputMode="numeric"
                  autoComplete="off"
                  {...m("pin")}
                />
                <Button type="submit" variant="secondary" disabled={pending}>
                  Save PIN
                </Button>
              </form>
            </SettingsSection>
          </TabPanel>

          {/* ---------------- Design ---------------- */}
          <TabPanel value="design" keepMounted className="gm-panel">
            <SettingsSection title="Layout" className="gm-block">
              <div className="gm-choice" role="radiogroup" aria-label="Layout">
                {(["grid", "masonry", "rows", "mosaic", "story"] as const).map((k) => (
                  <Surface asChild key={k} variant="outlined" padding="sm" interactive selected={f.layout === k}>
                    <button
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
                  </Surface>
                ))}
              </div>
              <div className="gm-fields">
                <Field label="Thumbnail size">
                  <Select value={f.density} onValueChange={(v) => upd("density", v)}>
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </Select>
                </Field>
                <Field label="Theme">
                  <Select value={f.theme} onValueChange={(v) => upd("theme", v)}>
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="paper">Paper (warm)</option>
                    <option value="slate">Slate (cool)</option>
                  </Select>
                </Field>
                <div className="hm-field gm-color-field" role="group" aria-label="Accent color">
                  <span className="hm-field-label">Accent color</span>
                  <span className="gm-color">
                    <input
                      className="gm-swatch"
                      type="color"
                      aria-label="Pick accent color"
                      value={/^#[0-9a-f]{6}$/i.test(f.accent) ? f.accent : "#ffffff"}
                      onChange={(e) => upd("accent", e.target.value)}
                    />
                    <Input
                      aria-label="Accent color (optional, like #cc3322)"
                      placeholder="#cc3322"
                      value={f.accent}
                      onChange={(e) => upd("accent", e.target.value)}
                    />
                  </span>
                </div>
              </div>
            </SettingsSection>
            <SettingsSection title="Welcome message" className="gm-block">
              <Field label="Shown above the photographs" className="gm-wide">
                <Textarea rows={3} value={f.welcome} onChange={(e) => upd("welcome", e.target.value)} />
              </Field>
              <Text size="sm" tone="muted">
                The cover is chosen in Photos: open a photograph and use Make cover.
              </Text>
              <Button disabled={pending} onClick={() => save("Design saved")}>
                Save design
              </Button>
            </SettingsSection>
            <SettingsSection title="Look" className="gm-block">
              <div className="gm-fields">
                <Field label="Typeface">
                  <Select value={sty.font} onValueChange={(v) => updSty("font", v as GalleryStyle["font"])}>
                    <option value="sans">Sans (clean)</option>
                    <option value="modern">Modern (geometric)</option>
                    <option value="serif">Serif (Georgia)</option>
                    <option value="editorial">Editorial (high contrast headlines)</option>
                    <option value="classic">Classic (light, elegant)</option>
                    <option value="display">Display (soft headlines)</option>
                    <option value="mono">Mono</option>
                  </Select>
                </Field>
                <Field label="Opening">
                  <Select value={sty.header} onValueChange={(v) => updSty("header", v as GalleryStyle["header"])}>
                    <option value="cinematic">Cinematic (full cover, title over it)</option>
                    <option value="split">Split (cover beside the title)</option>
                    <option value="minimal">Minimal (title only)</option>
                  </Select>
                </Field>
                <Field label="Albums are shown as">
                  <Select
                    value={sty.albumView}
                    onValueChange={(v) => updSty("albumView", v as GalleryStyle["albumView"])}
                  >
                    <option value="tabs">Tabs above the photographs</option>
                    <option value="cards">A page of album cards first</option>
                  </Select>
                </Field>
                <Field label="Spacing">
                  <Select value={sty.gap} onValueChange={(v) => updSty("gap", v as GalleryStyle["gap"])}>
                    <option value="tight">Tight</option>
                    <option value="normal">Normal</option>
                    <option value="wide">Wide</option>
                  </Select>
                </Field>
                <Field label="Corners">
                  <Select value={sty.corners} onValueChange={(v) => updSty("corners", v as GalleryStyle["corners"])}>
                    <option value="square">Square</option>
                    <option value="soft">Soft</option>
                    <option value="round">Round</option>
                  </Select>
                </Field>
                <div className="hm-field gm-color-field" role="group" aria-label="Background color (optional)">
                  <span className="hm-field-label">Background color (optional)</span>
                  <span className="gm-color">
                    <input
                      className="gm-swatch"
                      type="color"
                      aria-label="Pick background color"
                      value={/^#[0-9a-f]{6}$/i.test(sty.background) ? sty.background : "#000000"}
                      onChange={(e) => updSty("background", e.target.value)}
                    />
                    <Input
                      aria-label="Background color (hex, optional)"
                      placeholder="#101010"
                      value={sty.background}
                      onChange={(e) => updSty("background", e.target.value)}
                    />
                  </span>
                </div>
                <Field label="Line above the title (for example your studio name)" className="gm-wide">
                  <Input maxLength={60} value={sty.brandLine} onChange={(e) => updSty("brandLine", e.target.value)} />
                </Field>
                <Field label="Closing note under the photographs" className="gm-wide">
                  <Textarea
                    rows={2}
                    maxLength={300}
                    value={sty.footer}
                    onChange={(e) => updSty("footer", e.target.value)}
                  />
                </Field>
              </div>
              <Button disabled={pending} onClick={saveLook}>
                Save look
              </Button>
            </SettingsSection>
            <GalleryBranding sty={sty} updSty={updSty} tracks={data.tracks} onSave={saveLook} pending={pending} />
          </TabPanel>

          {/* ---------------- Security ---------------- */}
          <TabPanel value="security" keepMounted className="gm-panel">
            <Text size="sm" tone="muted">
              These settings deter and trace; they cannot stop everything. A web page can see screenshot, save and print
              keys, a screen-capture request from the page itself, and when the window loses focus. It cannot see a
              phone camera, another device or most recording tools. What it can do is hide the photographs, warn, log,
              and lock the viewer out.
            </Text>
            <SettingsSection title="Protection" className="gm-block">
              <div className="gm-fields">
                <Field label="Level">
                  <Select value={sec.level} onValueChange={(v) => updSec("level", v as GallerySecurity["level"])}>
                    <option value="off">Off</option>
                    <option value="light">Light: no right-click or drag on photographs</option>
                    <option value="strict">Strict: also watches for screenshot, save, print and devtools keys</option>
                  </Select>
                </Field>
                <Field label="When a key or capture attempt is seen">
                  <Select
                    value={sec.onTrigger}
                    onValueChange={(v) => updSec("onTrigger", v as GallerySecurity["onTrigger"])}
                    disabled={sec.level !== "strict"}
                  >
                    <option value="log">Log it only (hide photographs briefly)</option>
                    <option value="warn">Warn the viewer</option>
                    <option value="lock">Warn, then lock them out after repeated attempts</option>
                  </Select>
                </Field>
                {sec.onTrigger === "lock" ? (
                  <>
                    <Field label="Attempts before a lock">
                      <Input
                        inputMode="numeric"
                        value={sec.strikes}
                        onChange={(e) => updSec("strikes", Number(e.target.value) || 1)}
                      />
                    </Field>
                    <Field label="Lock for (minutes)">
                      <Input
                        inputMode="numeric"
                        value={sec.lockMinutes}
                        onChange={(e) => updSec("lockMinutes", Number(e.target.value) || 1)}
                      />
                    </Field>
                  </>
                ) : null}
              </div>
            </SettingsSection>
            <SettingsSection title="What the page does" className="gm-block">
              <div className="gm-fields">
                <Checkbox
                  checked={sec.holdToView}
                  onChange={(e) => updSec("holdToView", e.target.checked)}
                  label="Photographs stay blurred until the viewer presses and holds (or holds Shift)"
                />
                <Checkbox
                  checked={sec.blurOnLeave}
                  onChange={(e) => updSec("blurOnLeave", e.target.checked)}
                  label="Hide photographs when the window or tab loses focus"
                />
                <Checkbox
                  checked={sec.blockSelection}
                  onChange={(e) => updSec("blockSelection", e.target.checked)}
                  label="No text selection"
                />
                <Checkbox
                  checked={sec.blockContextMenu}
                  onChange={(e) => updSec("blockContextMenu", e.target.checked)}
                  label="No right-click menu or dragging photographs"
                />
                <Checkbox
                  checked={sec.blockPrint}
                  onChange={(e) => updSec("blockPrint", e.target.checked)}
                  label="Cancel Save and Print shortcuts"
                />
                <Checkbox
                  checked={sec.detectDevtools}
                  onChange={(e) => updSec("detectDevtools", e.target.checked)}
                  label="Hide photos when developer tools are open"
                />
                <Checkbox
                  checked={sec.viewerOverlay}
                  onChange={(e) => updSec("viewerOverlay", e.target.checked)}
                  label="Tile a faint viewer code over the page (traces a photographed screen)"
                />
                {sec.viewerOverlay ? (
                  <div className="hm-field">
                    <span className="hm-field-label" aria-hidden="true">
                      Overlay strength
                    </span>
                    <Slider
                      aria-label="Overlay strength"
                      min={0.04}
                      max={0.4}
                      step={0.02}
                      value={sec.overlayOpacity}
                      onValueChange={(v) => updSec("overlayOpacity", v)}
                      showValue
                      formatValue={(v) => `${Math.round(v * 100)}%`}
                    />
                  </div>
                ) : null}
              </div>
            </SettingsSection>
            <SettingsSection title="Sessions and downloads" className="gm-block">
              <div className="gm-fields">
                <Field label="Close after idle minutes (0 = never)">
                  <Input
                    inputMode="numeric"
                    value={sec.idleMinutes}
                    onChange={(e) => updSec("idleMinutes", Number(e.target.value) || 0)}
                  />
                </Field>
                <Field label="Most downloads per viewer per day (0 = unlimited)">
                  <Input
                    inputMode="numeric"
                    value={sec.maxDownloadsPerDay}
                    onChange={(e) => updSec("maxDownloadsPerDay", Number(e.target.value) || 0)}
                  />
                </Field>
                <Checkbox
                  checked={sec.notifyOwner}
                  onChange={(e) => updSec("notifyOwner", e.target.checked)}
                  label="Tell me in the activity feed (first attempt and every lock)"
                />
              </div>
              <div className="gm-row">
                <Button disabled={pending} onClick={saveSec}>
                  Save security
                </Button>
                {data.lockedNow ? (
                  <Button variant="secondary" disabled={pending} onClick={() => run(() => clearLocksAction(gid))}>
                    Let locked-out viewers back in
                  </Button>
                ) : null}
              </div>
            </SettingsSection>
          </TabPanel>

          {/* ---------------- Proofing ---------------- */}
          <TabPanel value="proofing" keepMounted className="gm-panel">
            <SettingsSection title="What the client picked" className="gm-block">
              <Text size="sm" tone="muted">
                {data.counts.favorites} favorite{data.counts.favorites === 1 ? "" : "s"} · {data.counts.approved}{" "}
                approved · {data.counts.rejected} rejected
                {data.selectionLimit ? ` · limit ${data.selectionLimit}` : ""}
                {data.selectionSentAt ? ` · sent ${data.selectionSentAt}` : ""}
              </Text>
              <div className="gm-row">
                <Button
                  variant="secondary"
                  disabled={!picked.length}
                  onClick={() => copy(picked.map((i) => i.filename).join("\n"), "Filenames copied")}
                >
                  Copy filenames
                </Button>
                <Button variant="secondary" disabled={!picked.length} onClick={csv}>
                  Download CSV
                </Button>
                {data.selectionSentAt ? (
                  <Button variant="secondary" disabled={pending} onClick={() => run(() => reopenSelectionAction(gid))}>
                    Reopen the selection
                  </Button>
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
                <Field label="Selection limit (blank = none)">
                  <Input
                    inputMode="numeric"
                    value={f.selectionLimit}
                    onChange={(e) => upd("selectionLimit", e.target.value)}
                  />
                </Field>
                <Checkbox
                  checked={f.comments}
                  onChange={(e) => upd("comments", e.target.checked)}
                  label="Clients can comment"
                />
                <Checkbox
                  checked={f.ratings}
                  onChange={(e) => upd("ratings", e.target.checked)}
                  label="Clients can rate"
                />
                <Button disabled={pending} onClick={() => save("Proofing saved")}>
                  Save
                </Button>
              </div>
            </SettingsSection>
            <SettingsSection title="Comments" className="gm-block">
              <ul className="hm-data-list gm-list">
                {data.comments.map((c) => (
                  <li className="hm-data-list-item" key={c.id}>
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
                          () =>
                            replyCommentAction({ galleryId: gid, mediaId: c.mediaId, body: misc[`r-${c.id}`] ?? "" }),
                          () => setMisc((x) => ({ ...x, [`r-${c.id}`]: "" })),
                        )}
                      >
                        <Input aria-label={`Reply to ${c.filename}`} {...m(`r-${c.id}`)} />
                        <Button type="submit" variant="secondary" disabled={pending}>
                          Reply
                        </Button>
                      </form>
                    ) : null}
                  </li>
                ))}
                {!data.comments.length ? <li className="hm-empty">No comments yet.</li> : null}
              </ul>
            </SettingsSection>
          </TabPanel>

          {/* ---------------- Activity ---------------- */}
          <TabPanel value="activity" keepMounted className="gm-panel">
            <SettingsSection title="Views" className="gm-block">
              <Text size="sm" tone="muted">
                {data.views.total} view{data.views.total === 1 ? "" : "s"} by {data.views.viewers} visitor
                {data.views.viewers === 1 ? "" : "s"}
                {data.views.last ? ` · last ${data.views.last}` : ""}
              </Text>
              <ul className="hm-data-list gm-list">
                {data.views.recent.map((v) => (
                  <li className="hm-data-list-item" key={v.id}>
                    <span>
                      {v.file}
                      <small>
                        {v.viewer} · {v.at}
                      </small>
                    </span>
                  </li>
                ))}
                {!data.views.recent.length ? <li className="hm-empty">Nobody has opened a photograph yet.</li> : null}
              </ul>
            </SettingsSection>
            <SettingsSection title="Capture attempts" className="gm-block">
              <ul className="hm-data-list gm-list" aria-label="Capture attempts">
                {data.securityEvents.map((e) => (
                  <li className="hm-data-list-item" key={e.id}>
                    <span>
                      {e.kind === "lock"
                        ? "Locked out"
                        : e.kind === "idle"
                          ? "Closed after idle time"
                          : `${e.kind}${e.combo ? ` · ${e.combo}` : ""}`}
                      <small>
                        {e.at} · {e.action}
                      </small>
                      <small>{e.via || `Session …${e.viewer} (recorded before access details were kept)`}</small>
                      {e.device ? <small>{e.device}</small> : null}
                    </span>
                  </li>
                ))}
                {!data.securityEvents.length ? <li className="hm-empty">No attempts logged.</li> : null}
              </ul>
            </SettingsSection>
            <SettingsSection title="Downloads" className="gm-block">
              <ul className="hm-data-list gm-list">
                {data.downloads.map((d) => (
                  <li className="hm-data-list-item" key={d.id}>
                    <span>
                      {d.kind}
                      {d.part ? ` part ${d.part}` : ""}
                      {d.file ? ` · ${d.file}` : ""}
                      <small>{d.at}</small>
                    </span>
                  </li>
                ))}
                {!data.downloads.length ? <li className="hm-empty">Nothing downloaded yet.</li> : null}
              </ul>
            </SettingsSection>
          </TabPanel>

          {/* ---------------- Settings ---------------- */}
          <TabPanel value="settings" keepMounted className="gm-panel">
            <SettingsSection title="General" className="gm-block">
              <div className="gm-fields">
                <Field label="Title" className="gm-wide">
                  <Input value={f.title} onChange={(e) => upd("title", e.target.value)} />
                </Field>
                <Field label="Private notes (never shown to the client)" className="gm-wide">
                  <Textarea rows={2} value={f.notes} onChange={(e) => upd("notes", e.target.value)} />
                </Field>
                <Field label="Shoot date">
                  <DateField value={f.shootDate} onChange={(e) => upd("shootDate", e.target.value)} />
                </Field>
                <Field label="Orders due by (optional)">
                  <DateField value={f.orderDueDate} onChange={(e) => upd("orderDueDate", e.target.value)} />
                </Field>
                <Checkbox
                  checked={f.watermark}
                  onChange={(e) => upd("watermark", e.target.checked)}
                  label="Visible watermark on previews"
                />
                <Checkbox
                  checked={f.autoArchive}
                  onChange={(e) => upd("autoArchive", e.target.checked)}
                  label="Archive the gallery by itself after it expires"
                />
              </div>
              <Button disabled={pending} onClick={() => save("Gallery settings saved")}>
                Save settings
              </Button>
            </SettingsSection>
            <SettingsSection title="Advanced" className="gm-block">
              <div className="gm-fields">
                {(
                  [
                    ["allowSharing", "Show the Share button"],
                    ["showDownloadAll", "Show the Download all button"],
                    ["showFilenames", "Show filenames under photographs"],
                    ["hideAllPhotos", 'Hide the "All photos" album'],
                    ["hideAlbumCount", "Hide the photo count on albums"],
                    ["hideAlbums", 'Hide albums (visitors only see "All photos")'],
                  ] as const
                ).map(([k, label]) => (
                  <Checkbox key={k} label={label} checked={sty[k]} onChange={(e) => updSty(k, e.target.checked)} />
                ))}
              </div>
              <Button disabled={pending} onClick={saveLook}>
                Save advanced settings
              </Button>
            </SettingsSection>
            <SettingsSection title="Publishing" className="gm-block">
              <div className="gm-fields">
                <Field label="Publish automatically at">
                  <DateTimeField
                    value={f.publishAt}
                    disabled={live}
                    onChange={(e) => upd("publishAt", e.target.value)}
                  />
                </Field>
                <Field label="Access from today, in months (blank = leave as is, 0 = no expiry)">
                  <Input inputMode="numeric" value={f.months} onChange={(e) => upd("months", e.target.value)} />
                </Field>
                <Button disabled={pending} onClick={() => save("Publishing saved")}>
                  Save
                </Button>
              </div>
              <Text size="sm" tone="muted">
                A scheduled gallery publishes and emails the client within the hour.{" "}
                {live ? "This one is already live." : ""}
              </Text>
            </SettingsSection>
            <SettingsSection title="Expiry and extensions" className="gm-block">
              <Text size="sm" tone="muted">
                Access is {data.state}
                {data.expiresAt ? ` until ${data.expiresAt}` : ""}. An expired or archived gallery offers the client a
                paid extension.
              </Text>
              <div className="gm-row">
                <Button
                  disabled={pending}
                  onClick={async () =>
                    (await ask({
                      title: "Email the client an extension invoice?",
                      body: "They get an invoice by email. When it is paid, the gallery stays open for longer.",
                      action: "Send invoice",
                    })) && run(() => sendExtensionInvoiceAction(gid))
                  }
                >
                  Send an extension invoice
                </Button>
                <Button
                  variant="secondary"
                  disabled={pending}
                  onClick={() =>
                    run(() => archiveGalleryAction({ galleryId: gid, archive: data.status !== "archived" }))
                  }
                >
                  {data.status === "archived" ? "Publish again" : "Archive"}
                </Button>
              </div>
              <form
                noValidate
                className="gm-inline"
                aria-label="Free extension"
                onSubmit={submit(() => extendGalleryFreeAction({ galleryId: gid, months: misc.fm ?? "" }))}
              >
                <Input
                  aria-label="Extend for free (months)"
                  placeholder="Extend for free (months)"
                  inputMode="numeric"
                  {...m("fm")}
                />
                <Button type="submit" variant="secondary" disabled={pending}>
                  Extend
                </Button>
              </form>
            </SettingsSection>
            <SettingsSection title="Duplicate or delete" className="gm-block gm-danger">
              <div className="gm-row">
                <Button variant="secondary" disabled={pending} onClick={() => setDupe({ photos: false })}>
                  Duplicate…
                </Button>
                <Button
                  variant="danger"
                  disabled={pending}
                  onClick={async () => {
                    if (
                      await ask({
                        title: `Delete "${data.title}"?`,
                        body: "Clients lose access straight away. The photographs stay in your library.",
                        action: "Delete gallery",
                      })
                    )
                      run(
                        () => deleteGalleryAction(gid),
                        () => router.push("/studio/galleries"),
                      );
                  }}
                >
                  Delete gallery
                </Button>
              </div>
            </SettingsSection>
          </TabPanel>
        </Tabs>
      </div>
      {confirmEl}
      <FormDialog
        open={dupe !== null}
        onOpenChange={(o) => !o && setDupe(null)}
        title="Duplicate this gallery"
        description="A new draft with these settings: design, albums, download rules, privacy and expiry. It gets its own link and passcode."
        submitLabel="Duplicate"
        size="sm"
        pending={pending}
        onSubmit={() => dupe && run(() => duplicateGalleryAction(gid, dupe.photos))}
      >
        <Checkbox
          label="Also copy the photographs"
          checked={dupe?.photos ?? false}
          onChange={(e) => setDupe({ photos: e.target.checked })}
        />
        <Text size="sm" tone="muted">
          The copy shows the same files: nothing is uploaded or stored again. Leave it off to start a new client's
          gallery with this look.
        </Text>
      </FormDialog>
      <Dialog open={pub} onOpenChange={setPub}>
        <DialogContent size="sm">
          <DialogTitle>Publish to the portfolio</DialogTitle>
          <DialogDescription>
            {sel.size} photograph{sel.size === 1 ? "" : "s"} will appear on the public site. Write down how the people
            in them (or their parents) agreed, or that nobody can be identified. It is kept with the photographs.
          </DialogDescription>
          <form
            className="st-stack"
            aria-label="Publish to the portfolio"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              run(
                () => publishToPortfolioAction({ mediaIds: [...sel], subjectId: pubSubject, consentNote: pubConsent }),
                () => {
                  setPub(false);
                  setSel(new Set());
                  setPubConsent("");
                },
              );
            }}
          >
            <Field label="Where in the portfolio">
              <Select value={pubSubject} onValueChange={setPubSubject}>
                <option value="">Choose</option>
                {data.portfolioSubjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="How they agreed">
              <Input
                value={pubConsent}
                onChange={(e) => setPubConsent(e.target.value)}
                placeholder="Model release signed, 3 March"
              />
            </Field>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setPub(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                Publish
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Frame>
  );
}
