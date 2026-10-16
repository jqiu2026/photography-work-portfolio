"use client";

import "./gallery-design.css";
import { ProtectedImage } from "@halation/ui/media";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  commentAction,
  decideAction,
  rateAction,
  reactivateAction,
  sendSelectionAction,
  unlockDownloadsAction,
} from "@/app/client/gallery-actions";
import { toggleFavoriteAction } from "@/app/client/actions";
import type { ClientGalleryData } from "@/lib/client-gallery-data";

type Item = ClientGalleryData["items"][number];

/** The client's gallery: albums, slideshow, favourites with a selection limit, ratings, approvals, comments, downloads. */
export function GalleryClient({ data }: { data: ClientGalleryData }) {
  const router = useRouter();
  const [items, setItems] = useState(data.items);
  const [album, setAlbum] = useState<string>("");
  const [onlyFav, setOnlyFav] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [talk, setTalk] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(data.downloads.unlocked);
  const [sent, setSent] = useState(data.sent);
  const shown = items.filter((i) => (!album || i.albumId === album) && (!onlyFav || i.favourite));
  const chosen = items.filter((i) => i.favourite).length;
  const gid = data.galleryId;
  const style = data.accent ? ({ ["--hl-accent" as string]: data.accent } as React.CSSProperties) : undefined;
  const upd = (id: string, p: Partial<Item>) =>
    setItems((all) => all.map((i) => (i.mediaId === id ? { ...i, ...p } : i)));
  const say = (ok: boolean, text: string) => setMsg({ ok, text });
  const dl = (q: string) => `/client/download?${gid ? `g=${gid}&` : ""}${q}`;

  async function fav(i: Item) {
    const r = await toggleFavoriteAction(i.mediaId, gid);
    if (r.ok) upd(i.mediaId, { favourite: !i.favourite });
    else say(false, r.error);
  }
  async function rate(i: Item, n: number) {
    const next = i.rating === n ? null : n;
    const r = await rateAction({ galleryId: gid, mediaId: i.mediaId, rating: next });
    if (r.ok) upd(i.mediaId, { rating: next });
    else say(false, r.error);
  }
  async function decide(i: Item, d: "approved" | "rejected") {
    const next = i.decision === d ? null : d;
    const r = await decideAction({ galleryId: gid, mediaId: i.mediaId, decision: next });
    if (r.ok) upd(i.mediaId, { decision: next });
    else say(false, r.error);
  }
  async function send(i: Item) {
    const r = await commentAction({ galleryId: gid, mediaId: i.mediaId, body: draft });
    if (r.ok) {
      upd(i.mediaId, {
        comments: [...i.comments, { body: draft.trim(), author: "client", at: new Date().toISOString().slice(0, 10) }],
      });
      setDraft("");
    } else say(false, r.error);
  }
  async function submitSelection() {
    const r = await sendSelectionAction(gid);
    if (r.ok) {
      setSent(true);
      say(true, r.message ?? "Sent.");
    } else say(false, r.error);
  }
  async function reactivate() {
    const r = await reactivateAction(gid);
    if (r.ok && r.url) router.push(r.url);
    else if (!r.ok) say(false, r.error);
  }
  async function unlock() {
    const r = await unlockDownloadsAction({ galleryId: gid, pin });
    if (r.ok) {
      setUnlocked(true);
      say(true, r.message ?? "Unlocked.");
    } else say(false, r.error);
  }

  if (data.state === "expired" || data.state === "archived")
    return (
      <section className="st-card" style={style} aria-labelledby="g-exp">
        <h1 className="st-title" id="g-exp">
          {data.title}
        </h1>
        <p className="st-note" role="status">
          This gallery{" "}
          {data.state === "archived" ? "has been archived" : `expired${data.expiresAt ? ` on ${data.expiresAt}` : ""}`}.
          Your photographs are safe: extend access to bring it back.
        </p>
        <button type="button" className="st-btn" onClick={reactivate}>
          Extend access
        </button>
        {msg ? (
          <p role={msg.ok ? "status" : "alert"} className={msg.ok ? "st-note" : "st-error"}>
            {msg.text}
          </p>
        ) : null}
      </section>
    );

  return (
    <div
      style={style}
      className="gd"
      data-gallery-theme={data.theme}
      data-gallery-layout={data.layout}
      data-gallery-density={data.density}
    >
      <h1 className="st-title">{data.title}</h1>
      {data.welcome ? <p className="st-note">{data.welcome}</p> : null}
      {data.state === "expiring" ? (
        <p className="st-note" role="status">
          This gallery expires on {data.expiresAt}.{" "}
          <button type="button" className="st-btn st-btn--ghost" onClick={reactivate}>
            Extend access
          </button>
        </p>
      ) : null}
      <p className="st-note">
        These photographs are protected previews. Heart the ones you like{data.limit ? ` (up to ${data.limit})` : ""}.
      </p>

      <div className="st-toolbar" role="toolbar" aria-label="Gallery tools">
        {data.albums.length ? (
          <>
            <button type="button" className="slot" aria-pressed={album === ""} onClick={() => setAlbum("")}>
              All
            </button>
            {data.albums.map((a) => (
              <button
                key={a.id}
                type="button"
                className="slot"
                aria-pressed={album === a.id}
                onClick={() => setAlbum(a.id)}
              >
                {a.name}
              </button>
            ))}
          </>
        ) : null}
        <button type="button" className="slot" aria-pressed={onlyFav} onClick={() => setOnlyFav((v) => !v)}>
          Favourites only
        </button>
        <button type="button" className="slot" disabled={!shown.length} onClick={() => setOpen(0)}>
          Slideshow
        </button>
      </div>

      <ul className="st-photos" aria-label="Photographs">
        {shown.map((i, n) => (
          <li key={i.mediaId} data-media-id={i.mediaId}>
            <button
              type="button"
              className="st-open"
              onClick={() => setOpen(n)}
              aria-label={`Open ${i.filename} in the slideshow`}
            >
              <ProtectedImage
                asset={{
                  id: i.mediaId,
                  width: i.width,
                  height: i.height,
                  color: i.color ?? undefined,
                  blur: i.blur ?? undefined,
                  files: [],
                }}
                alt={i.filename}
              />
            </button>
            <div className="st-tools">
              <button
                type="button"
                className="st-fav"
                aria-pressed={i.favourite}
                aria-label={`${i.favourite ? "Remove" : "Add"} ${i.filename} ${i.favourite ? "from" : "to"} favourites`}
                disabled={sent}
                onClick={() => void fav(i)}
              >
                {i.favourite ? "♥" : "♡"}
              </button>
              {data.allowRatings ? (
                <span role="group" aria-label={`Rate ${i.filename}`}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="st-star"
                      aria-pressed={(i.rating ?? 0) >= s}
                      aria-label={`${s} star${s > 1 ? "s" : ""} for ${i.filename}`}
                      onClick={() => void rate(i, s)}
                    >
                      {(i.rating ?? 0) >= s ? "★" : "☆"}
                    </button>
                  ))}
                </span>
              ) : null}
              <button
                type="button"
                className="st-btn st-btn--ghost"
                aria-pressed={i.decision === "approved"}
                disabled={sent}
                onClick={() => void decide(i, "approved")}
                aria-label={`Approve ${i.filename}`}
              >
                Approve
              </button>
              <button
                type="button"
                className="st-btn st-btn--ghost"
                aria-pressed={i.decision === "rejected"}
                disabled={sent}
                onClick={() => void decide(i, "rejected")}
                aria-label={`Not for me: ${i.filename}`}
              >
                Not this
              </button>
              {data.allowComments ? (
                <button
                  type="button"
                  className="st-btn st-btn--ghost"
                  aria-expanded={talk === i.mediaId}
                  onClick={() => setTalk(talk === i.mediaId ? null : i.mediaId)}
                  aria-label={`Comments on ${i.filename}`}
                >
                  Comment{i.comments.length ? ` (${i.comments.length})` : ""}
                </button>
              ) : null}
              {data.downloads.web && unlocked ? (
                <a className="st-btn st-btn--ghost" href={dl(`m=${i.mediaId}&size=web`)} download>
                  Web size
                </a>
              ) : null}
              {data.downloads.full && unlocked ? (
                <a className="st-btn st-btn--ghost" href={dl(`m=${i.mediaId}&size=full`)} download>
                  Full size
                </a>
              ) : null}
            </div>
            {talk === i.mediaId ? (
              <div className="st-thread" role="group" aria-label={`Comments on ${i.filename}`}>
                <ul className="st-list">
                  {i.comments.map((c, k) => (
                    <li key={`${c.at}-${k}`}>
                      <span>
                        <strong>{c.author === "client" ? "You" : "Photographer"}</strong> <small>{c.at}</small>
                        <small>{c.body}</small>
                      </span>
                    </li>
                  ))}
                </ul>
                <label>
                  Your comment
                  <input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={1000} />
                </label>
                <button type="button" className="st-btn" onClick={() => void send(i)}>
                  Add comment
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      {!shown.length ? <p className="st-note">Nothing here yet.</p> : null}

      <section className="st-card" style={{ marginTop: "1.5rem" }} aria-label="Your selection">
        <p className="st-note" role="status">
          {chosen} favourite{chosen === 1 ? "" : "s"} chosen{data.limit ? ` of ${data.limit}` : ""}.
          {sent ? " Your selection was sent." : ""}
        </p>
        {!sent ? (
          <button type="button" className="st-btn" disabled={!chosen} onClick={() => void submitSelection()}>
            Send my selection
          </button>
        ) : null}
      </section>

      {data.downloads.web || data.downloads.full ? (
        <section className="st-card" style={{ marginTop: "1.5rem" }} aria-label="Downloads">
          <h2>Downloads</h2>
          {data.downloads.pin && !unlocked ? (
            <div className="st-form">
              <label>
                Download PIN
                <input inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} autoComplete="off" />
              </label>
              <button type="button" className="st-btn" onClick={() => void unlock()}>
                Unlock downloads
              </button>
            </div>
          ) : (
            <ul className="st-list">
              {data.downloads.web
                ? Array.from({ length: data.downloads.webParts }, (_, k) => (
                    <li key={`w${k}`}>
                      <span>
                        All photographs, web size
                        {data.downloads.webParts > 1 ? ` (part ${k + 1} of ${data.downloads.webParts})` : ""}
                      </span>
                      <a className="st-btn" href={dl(`zip=1&size=web&part=${k + 1}`)} download>
                        Download ZIP
                      </a>
                    </li>
                  ))
                : null}
              {data.downloads.full
                ? Array.from({ length: data.downloads.fullParts }, (_, k) => (
                    <li key={`f${k}`}>
                      <span>
                        All photographs, full resolution
                        {data.downloads.fullParts > 1 ? ` (part ${k + 1} of ${data.downloads.fullParts})` : ""}
                      </span>
                      <a className="st-btn" href={dl(`zip=1&size=full&part=${k + 1}`)} download>
                        Download ZIP
                      </a>
                    </li>
                  ))
                : null}
            </ul>
          )}
        </section>
      ) : null}

      {msg ? (
        <p role={msg.ok ? "status" : "alert"} className={msg.ok ? "st-note" : "st-error"}>
          {msg.text}
        </p>
      ) : null}

      {open !== null && shown[open] ? <Slideshow items={shown} start={open} onClose={() => setOpen(null)} /> : null}
    </div>
  );
}

/** Full-screen slideshow in a native dialog: arrows, Escape, and an optional 4-second auto-advance. Photographs stay protected. */
function Slideshow({ items, start, onClose }: { items: Item[]; start: number; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [i, setI] = useState(start);
  const [play, setPlay] = useState(false);
  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);
  useEffect(() => {
    if (!play) return;
    const t = setInterval(() => setI((x) => (x + 1) % items.length), 4000);
    return () => clearInterval(t);
  }, [play, items.length]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setI((x) => (x + 1) % items.length);
      if (e.key === "ArrowLeft") setI((x) => (x - 1 + items.length) % items.length);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [items.length]);
  const it = items[i];
  return (
    <dialog ref={ref} className="st-slides" aria-label="Slideshow" onClose={onClose}>
      <div className="st-slides__bar">
        <button type="button" className="st-btn st-btn--ghost" onClick={() => setPlay((p) => !p)} aria-pressed={play}>
          {play ? "Pause" : "Play"}
        </button>
        <span aria-live="polite">
          {i + 1} / {items.length}
        </span>
        <button type="button" className="st-btn st-btn--ghost" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="st-slides__stage">
        <button
          type="button"
          className="st-btn st-btn--ghost"
          aria-label="Previous photograph"
          onClick={() => setI((x) => (x - 1 + items.length) % items.length)}
        >
          ←
        </button>
        <ProtectedImage
          key={it.mediaId}
          asset={{
            id: it.mediaId,
            width: it.width,
            height: it.height,
            color: it.color ?? undefined,
            blur: it.blur ?? undefined,
            files: [],
          }}
          alt={it.filename}
          fit="contain"
          priority
        />
        <button
          type="button"
          className="st-btn st-btn--ghost"
          aria-label="Next photograph"
          onClick={() => setI((x) => (x + 1) % items.length)}
        >
          →
        </button>
      </div>
    </dialog>
  );
}
