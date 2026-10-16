"use client";

import { ProtectedImage } from "@halation/ui/media";
import Link from "next/link";
import { useState } from "react";
import {
  archiveGalleryAction,
  createAlbumAction,
  deleteAlbumAction,
  extendGalleryFreeAction,
  moveToAlbumAction,
  removeItemAction,
  reopenSelectionAction,
  replyCommentAction,
  saveGallerySettingsAction,
  sendExtensionInvoiceAction,
  setCoverAction,
  setDownloadPinAction,
  setGalleryPasscodeAction,
  setHiddenAction,
} from "@/app/studio/gallery-actions";
import { GalleryUploader } from "./GalleryUploader";
import { Card, Frame, useAct } from "./StudioFrame";

export type GalleryManagerData = {
  id: string;
  title: string;
  jobTitle: string;
  status: string;
  state: string;
  expiresAt: string | null;
  welcome: string;
  accent: string;
  downloadPolicy: string;
  selectionLimit: number | null;
  allowComments: boolean;
  allowRatings: boolean;
  watermark: boolean;
  hasPin: boolean;
  selectionSentAt: string | null;
  albums: { id: string; name: string }[];
  items: {
    mediaId: string;
    filename: string;
    albumId: string | null;
    hidden: boolean;
    cover: boolean;
    width: number;
    height: number;
    color: string | null;
    blur: string | null;
    rating: number | null;
    approved: boolean;
    rejected: boolean;
    favourite: boolean;
  }[];
  comments: { id: string; mediaId: string; filename: string; body: string; author: string; at: string }[];
  downloads: { id: string; kind: string; part: number | null; file: string | null; at: string; bytes: number | null }[];
  counts: { favourites: number; approved: number; rejected: number };
};

/** One client gallery: upload, settings, albums, the photographs, what the client picked and said, downloads, expiry. */
export function GalleryManager({ user, data }: { user: string; data: GalleryManagerData }) {
  const { pending, note, act, submit } = useAct();
  const [f, setF] = useState<Record<string, string>>({});
  const [flags, setFlags] = useState({
    comments: data.allowComments,
    ratings: data.allowRatings,
    watermark: data.watermark,
  });
  const [album, setAlbum] = useState("");
  const set = (k: string) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const gid = data.id;
  return (
    <Frame section="galleries" user={user} note={note}>
      <p className="st-note">
        <Link href="/studio/galleries">← All galleries</Link>
      </p>
      <h1 className="st-title">{data.title}</h1>
      <p className="st-note" role="status">
        {data.jobTitle} · {data.status} · access: {data.state}
        {data.expiresAt ? ` · until ${data.expiresAt}` : " · no expiry"}
        {data.selectionSentAt ? ` · selection sent ${data.selectionSentAt}` : ""}
      </p>
      <div className="st-grid">
        <Card title="Upload photographs" id="gm-up">
          <div className="st-form">
            <label>
              Into album
              <select value={album} onChange={(e) => setAlbum(e.target.value)}>
                <option value="">No album</option>
                {data.albums.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <GalleryUploader galleryId={gid} albumId={album || undefined} />
        </Card>

        <Card title="Settings" id="gm-set">
          <form
            noValidate
            className="st-form"
            aria-label="Gallery settings"
            onSubmit={submit(() =>
              saveGallerySettingsAction({
                galleryId: gid,
                title: f.t ?? data.title,
                welcome: f.w ?? data.welcome,
                accent: f.a ?? data.accent,
                downloadPolicy: f.d ?? data.downloadPolicy,
                accessMonths: f.m ?? "",
                selectionLimit: f.l ?? (data.selectionLimit ? String(data.selectionLimit) : ""),
                allowComments: flags.comments,
                allowRatings: flags.ratings,
                watermark: flags.watermark,
              }),
            )}
          >
            <label>
              Title
              <input value={f.t ?? data.title} onChange={set("t")} />
            </label>
            <label>
              Welcome message
              <textarea rows={2} value={f.w ?? data.welcome} onChange={set("w")} />
            </label>
            <label>
              Accent colour (optional, like #cc3322)
              <input value={f.a ?? data.accent} onChange={set("a")} />
            </label>
            <label>
              Downloads
              <select value={f.d ?? data.downloadPolicy} onChange={set("d")}>
                <option value="none">None</option>
                <option value="preview">Protected previews only</option>
                <option value="web">Web size</option>
                <option value="full">Web size and full resolution</option>
              </select>
            </label>
            <label>
              Access from today, in months (blank = leave as is, 0 = no expiry)
              <input inputMode="numeric" value={f.m ?? ""} onChange={set("m")} />
            </label>
            <label>
              Selection limit (blank = none)
              <input
                inputMode="numeric"
                value={f.l ?? (data.selectionLimit ? String(data.selectionLimit) : "")}
                onChange={set("l")}
              />
            </label>
            <label className="st-check">
              <input
                type="checkbox"
                checked={flags.comments}
                onChange={(e) => setFlags({ ...flags, comments: e.target.checked })}
              />{" "}
              Clients can comment
            </label>
            <label className="st-check">
              <input
                type="checkbox"
                checked={flags.ratings}
                onChange={(e) => setFlags({ ...flags, ratings: e.target.checked })}
              />{" "}
              Clients can rate
            </label>
            <label className="st-check">
              <input
                type="checkbox"
                checked={flags.watermark}
                onChange={(e) => setFlags({ ...flags, watermark: e.target.checked })}
              />{" "}
              Visible watermark on previews
            </label>
            <button type="submit" className="st-btn" disabled={pending}>
              Save settings
            </button>
          </form>
          <form
            noValidate
            className="st-form"
            aria-label="Passcode"
            onSubmit={submit(
              () => setGalleryPasscodeAction({ galleryId: gid, passcode: f.pc ?? "" }),
              () => setF((x) => ({ ...x, pc: "" })),
            )}
          >
            <label>
              New passcode (6+ characters)
              <input value={f.pc ?? ""} onChange={set("pc")} autoComplete="off" />
            </label>
            <button type="submit" className="st-btn st-btn--ghost" disabled={pending}>
              Change passcode
            </button>
          </form>
          <form
            noValidate
            className="st-form"
            aria-label="Download PIN"
            onSubmit={submit(
              () => setDownloadPinAction({ galleryId: gid, pin: f.pin ?? "" }),
              () => setF((x) => ({ ...x, pin: "" })),
            )}
          >
            <label>
              Download PIN (4 to 8 digits, blank removes it){data.hasPin ? " · currently set" : ""}
              <input inputMode="numeric" value={f.pin ?? ""} onChange={set("pin")} autoComplete="off" />
            </label>
            <button type="submit" className="st-btn st-btn--ghost" disabled={pending}>
              Save PIN
            </button>
          </form>
        </Card>

        <Card title="Albums" id="gm-alb">
          <ul className="st-list">
            {data.albums.map((a) => (
              <li key={a.id}>
                <span>{a.name}</span>
                <button
                  type="button"
                  className="st-btn st-btn--ghost"
                  disabled={pending}
                  onClick={() => act(() => deleteAlbumAction({ galleryId: gid, albumId: a.id }))}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <form
            noValidate
            className="st-form"
            aria-label="New album"
            onSubmit={submit(
              () => createAlbumAction({ galleryId: gid, name: f.an ?? "" }),
              () => setF((x) => ({ ...x, an: "" })),
            )}
          >
            <label>
              Album name
              <input value={f.an ?? ""} onChange={set("an")} />
            </label>
            <button type="submit" className="st-btn" disabled={pending}>
              Add album
            </button>
          </form>
        </Card>

        <Card title="Expiry and extensions" id="gm-exp">
          <p className="st-note">
            Access is {data.state}
            {data.expiresAt ? ` until ${data.expiresAt}` : ""}. An expired or archived gallery offers the client a paid
            extension (the fee in Forms, policies).
          </p>
          <div className="st-actions">
            <button
              type="button"
              className="st-btn"
              disabled={pending}
              onClick={() => act(() => sendExtensionInvoiceAction(gid))}
            >
              Send an extension invoice
            </button>
            <button
              type="button"
              className="st-btn st-btn--ghost"
              disabled={pending}
              onClick={() => act(() => archiveGalleryAction({ galleryId: gid, archive: data.status !== "archived" }))}
            >
              {data.status === "archived" ? "Publish again" : "Archive"}
            </button>
          </div>
          <form
            noValidate
            className="st-form"
            aria-label="Free extension"
            onSubmit={submit(() => extendGalleryFreeAction({ galleryId: gid, months: f.fm ?? "" }))}
          >
            <label>
              Extend for free (months)
              <input inputMode="numeric" value={f.fm ?? ""} onChange={set("fm")} />
            </label>
            <button type="submit" className="st-btn st-btn--ghost" disabled={pending}>
              Extend
            </button>
          </form>
        </Card>
      </div>

      <Card title={`Photographs (${data.items.length})`} id="gm-items">
        <ul className="st-photos" aria-label="Gallery photographs">
          {data.items.map((it) => (
            <li key={it.mediaId} data-media-id={it.mediaId} data-hidden={it.hidden || undefined}>
              <ProtectedImage
                asset={{
                  id: it.mediaId,
                  width: it.width,
                  height: it.height,
                  color: it.color ?? undefined,
                  blur: it.blur ?? undefined,
                  files: [],
                }}
                alt={it.filename}
              />
              <small>
                {it.filename}
                {it.cover ? " · cover" : ""}
                {it.hidden ? " · hidden" : ""}
                {it.favourite ? " · ♥" : ""}
                {it.rating ? ` · ${it.rating}★` : ""}
                {it.approved ? " · approved" : ""}
                {it.rejected ? " · rejected" : ""}
              </small>
              <span className="st-actions">
                <button
                  type="button"
                  className="st-btn st-btn--ghost"
                  disabled={pending}
                  onClick={() => act(() => setCoverAction({ galleryId: gid, mediaId: it.mediaId }))}
                  aria-label={`Make ${it.filename} the cover`}
                >
                  Cover
                </button>
                <button
                  type="button"
                  className="st-btn st-btn--ghost"
                  disabled={pending}
                  onClick={() =>
                    act(() => setHiddenAction({ galleryId: gid, mediaId: it.mediaId, hidden: !it.hidden }))
                  }
                  aria-label={`${it.hidden ? "Show" : "Hide"} ${it.filename}`}
                >
                  {it.hidden ? "Show" : "Hide"}
                </button>
                <button
                  type="button"
                  className="st-btn st-btn--ghost"
                  disabled={pending}
                  onClick={() => act(() => removeItemAction({ galleryId: gid, mediaId: it.mediaId }))}
                  aria-label={`Remove ${it.filename}`}
                >
                  Remove
                </button>
                {data.albums.length ? (
                  <select
                    aria-label={`Album for ${it.filename}`}
                    value={it.albumId ?? ""}
                    disabled={pending}
                    onChange={(e) =>
                      act(() => moveToAlbumAction({ galleryId: gid, mediaId: it.mediaId, albumId: e.target.value }))
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
              </span>
            </li>
          ))}
        </ul>
        {!data.items.length ? <p className="st-note">No photographs yet. Upload some above.</p> : null}
      </Card>

      <div className="st-grid" style={{ marginTop: "1.5rem" }}>
        <Card title="What the client picked and said" id="gm-proof">
          <p className="st-note">
            {data.counts.favourites} favourite{data.counts.favourites === 1 ? "" : "s"} · {data.counts.approved}{" "}
            approved · {data.counts.rejected} rejected
            {data.selectionLimit ? ` · limit ${data.selectionLimit}` : ""}
          </p>
          {data.selectionSentAt ? (
            <button
              type="button"
              className="st-btn st-btn--ghost"
              disabled={pending}
              onClick={() => act(() => reopenSelectionAction(gid))}
            >
              Reopen the selection
            </button>
          ) : null}
          <ul className="st-list st-list--tall">
            {data.comments.map((c) => (
              <li key={c.id}>
                <span>
                  <strong>{c.author === "client" ? "Client" : "You"}</strong> on {c.filename} <small>{c.at}</small>
                  <small>{c.body}</small>
                </span>
                {c.author === "client" ? (
                  <form
                    noValidate
                    className="st-actions"
                    aria-label={`Reply about ${c.filename}`}
                    onSubmit={submit(
                      () => replyCommentAction({ galleryId: gid, mediaId: c.mediaId, body: f[`r-${c.id}`] ?? "" }),
                      () => setF((x) => ({ ...x, [`r-${c.id}`]: "" })),
                    )}
                  >
                    <input
                      aria-label={`Reply to ${c.filename}`}
                      value={f[`r-${c.id}`] ?? ""}
                      onChange={set(`r-${c.id}`)}
                    />
                    <button type="submit" className="st-btn st-btn--ghost" disabled={pending}>
                      Reply
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
            {!data.comments.length ? <li className="st-note">No comments yet.</li> : null}
          </ul>
        </Card>
        <Card title="Downloads" id="gm-dl">
          <ul className="st-list">
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
        </Card>
      </div>
    </Frame>
  );
}
