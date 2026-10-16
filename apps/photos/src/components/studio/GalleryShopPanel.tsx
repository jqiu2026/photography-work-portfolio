"use client";

import { useState } from "react";
import { cancelOrderAction, saveLinkAction, saveShopAction } from "@/app/studio/gallery-actions";

type Run = (fn: () => Promise<{ ok: boolean; [k: string]: unknown }>, after?: () => void) => void;
const usd = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);

/** One gallery's public address, who can open it, and what visitors can buy or download. The price list is under Money > Orders. */
export function GalleryShopPanel({
  galleryId,
  link,
  shop,
  orders,
  live,
  origin,
  run,
  pending,
  copy,
  copied,
}: {
  galleryId: string;
  link: { slug: string; visibility: string };
  shop: {
    enabled: boolean;
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
  live: boolean;
  origin: string;
  run: Run;
  pending: boolean;
  copy: (text: string, what: string) => void;
  copied: string;
}) {
  const [slug, setSlug] = useState(link.slug);
  const [vis, setVis] = useState(link.visibility);
  const [s, setS] = useState(shop);
  const url = `${origin}/g/${slug}`;
  return (
    <>
      <div className="gm-block">
        <h2>Gallery link</h2>
        <p className="st-note">
          Every gallery can have its own address. With "Anyone with the link", visitors see the photographs and the shop
          without a passcode. The client still signs in with the passcode to proof and to get the downloads they are
          owed.
        </p>
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
            <select value={vis} onChange={(e) => setVis(e.target.value)}>
              <option value="passcode">Only the client, with the passcode</option>
              <option value="link">Anyone with the link (view and shop)</option>
            </select>
          </label>
        </div>
        <div className="gm-row">
          <button
            type="button"
            className="st-btn"
            disabled={pending}
            onClick={() => run(() => saveLinkAction({ galleryId, slug, visibility: vis }))}
          >
            Save link
          </button>
          {vis === "link" ? (
            <>
              <code>{url}</code>
              <button type="button" className="st-btn st-btn--ghost" onClick={() => copy(url, "Gallery link copied")}>
                Copy link
              </button>
              <a className="st-btn st-btn--ghost" href={url} target="_blank" rel="noreferrer">
                Open
              </a>
            </>
          ) : null}
        </div>
        {vis === "link" && !live ? <p className="st-note">The link opens once the gallery is published.</p> : null}
        {copied ? (
          <p className="st-note" role="status">
            {copied}
          </p>
        ) : null}
      </div>
      <div className="gm-block">
        <h2>Shop</h2>
        <p className="st-note">
          What visitors can buy from this gallery. Prices come from the price list in Money, Orders.
        </p>
        <div className="gm-fields">
          <label className="gm-check">
            <input type="checkbox" checked={s.enabled} onChange={(e) => setS({ ...s, enabled: e.target.checked })} />{" "}
            Open the shop
          </label>
          <label className="gm-check">
            <input
              type="checkbox"
              checked={s.sellDigital}
              onChange={(e) => setS({ ...s, sellDigital: e.target.checked })}
            />{" "}
            Sell downloads
          </label>
          <label className="gm-check">
            <input
              type="checkbox"
              checked={s.sellPrints}
              onChange={(e) => setS({ ...s, sellPrints: e.target.checked })}
            />{" "}
            Sell prints and products
          </label>
          <label>
            Free downloads for visitors
            <select value={s.freeDownloads} onChange={(e) => setS({ ...s, freeDownloads: e.target.value })}>
              <option value="none">None (they buy)</option>
              <option value="web">Web-size copies, free</option>
            </select>
          </label>
          <label className="gm-wide">
            Note at the top of the shop (turnaround, shipping)
            <input maxLength={240} value={s.note} onChange={(e) => setS({ ...s, note: e.target.value })} />
          </label>
        </div>
        <button
          type="button"
          className="st-btn"
          disabled={pending}
          onClick={() => run(() => saveShopAction({ galleryId, ...s }))}
        >
          Save shop settings
        </button>
      </div>
      <div className="gm-block">
        <h2>Orders from this gallery</h2>
        {orders.length ? (
          <ul className="st-list">
            {orders.map((o) => (
              <li key={o.id}>
                <span>
                  {o.number} · {o.buyer}
                  <small>
                    {o.at} · {o.items} item{o.items === 1 ? "" : "s"} · {o.status}
                  </small>
                </span>
                <span>{usd(o.totalCents)}</span>
                {o.status === "pending" ? (
                  <button
                    type="button"
                    className="st-btn st-btn--ghost"
                    disabled={pending}
                    onClick={() => run(() => cancelOrderAction(o.id))}
                  >
                    Cancel
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="st-note">No orders yet.</p>
        )}
      </div>
    </>
  );
}
