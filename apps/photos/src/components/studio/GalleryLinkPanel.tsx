"use client";

import { useState } from "react";
import { saveLinkAction, sendGalleryLinkAction } from "@/app/studio/gallery-actions";

type Run = (fn: () => Promise<{ ok: boolean; [k: string]: unknown }>, after?: () => void) => void;

/**
 * The gallery's one sharing link: /g/<address>. Open it with no passcode ("anyone with the link": view and shop) or keep it
 * private (the passcode is asked for on that same page). Clients never log in anywhere else.
 */
export function GalleryLinkPanel({
  galleryId,
  link,
  live,
  origin,
  clientName,
  clientEmail,
  run,
  pending,
  copy,
  copied,
}: {
  galleryId: string;
  link: { slug: string; visibility: string };
  live: boolean;
  origin: string;
  clientName: string;
  clientEmail: string;
  run: Run;
  pending: boolean;
  copy: (text: string, what: string) => void;
  copied: string;
}) {
  const [slug, setSlug] = useState(link.slug);
  const [vis, setVis] = useState(link.visibility);
  const url = `${origin}/g/${slug}`;
  return (
    <div className="gm-block">
      <h2>Gallery link</h2>
      <p className="st-note">
        This is the link to send. {live ? "The gallery is live." : "Publish the gallery before sending it."} Clients
        open it, and enter the passcode there if the gallery is private. There is no separate client login.
      </p>
      <div className="gm-row">
        <code>{url}</code>
        <button type="button" className="st-btn st-btn--ghost" onClick={() => copy(url, "Link copied")}>
          Copy link
        </button>
        <a className="st-btn st-btn--ghost" href={url} target="_blank" rel="noreferrer">
          Open
        </a>
        <button
          type="button"
          className="st-btn st-btn--ghost"
          disabled={pending}
          onClick={() => run(() => sendGalleryLinkAction(galleryId))}
        >
          Email {clientName || "the client"}
        </button>
      </div>
      {clientEmail ? <p className="st-note">Goes to {clientEmail}. The email has the link, not the passcode.</p> : null}
      <div className="gm-fields">
        <label>
          Address
          <span className="gm-colour">
            <code>/g/</code>
            <input aria-label="Gallery address" value={slug} onChange={(e) => setSlug(e.target.value)} />
          </span>
        </label>
        <label>
          Who can open the link
          <select aria-label="Who can open the link" value={vis} onChange={(e) => setVis(e.target.value)}>
            <option value="passcode">Private: the passcode is asked for</option>
            <option value="link">Anyone with the link (view and shop; the passcode adds proofing)</option>
          </select>
        </label>
        <button
          type="button"
          className="st-btn"
          disabled={pending}
          onClick={() => run(() => saveLinkAction({ galleryId, slug, visibility: vis }))}
        >
          Save link
        </button>
      </div>
      {copied ? (
        <p className="st-note" role="status">
          {copied}
        </p>
      ) : null}
    </div>
  );
}
