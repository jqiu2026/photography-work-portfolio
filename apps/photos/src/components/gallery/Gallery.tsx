"use client";

import { ProtectedImage } from "@halation/ui/media";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { leaveGalleryAction, toggleFavoriteAction } from "@/app/client/actions";
import {
  commentAction,
  decideAction,
  rateAction,
  reactivateAction,
  sendSelectionAction,
  unlockDownloadsAction,
} from "@/app/client/gallery-actions";
import { checkoutAction, enterGalleryAction, unlockAlbumAction, unlockRuleAction } from "@/app/g/actions";
import type { ClientGalleryData } from "@/lib/client-gallery-data";
import "./gallery.css";
import { RichTextBlock as RichText } from "./RichTextBlock";

type Data = ClientGalleryData;
type Item = Data["items"][number];
type Product = Data["shop"]["products"][number];
type Line = { productId: string; mediaId: string | null; qty: number };

const usd = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents % 100 ? 2 : 0,
  }).format(cents / 100);
const DIGITAL = ["digital-web", "digital-full", "digital-all"];
const PPI_FLOOR = 180; // same floor the print lab check uses on the server
const fits = (p: Product, it: Item) => {
  if (!p.size) return true;
  const long = Math.max(it.width, it.height);
  const short = Math.min(it.width, it.height);
  return Math.floor(Math.min(long / p.size[0], short / p.size[1])) >= PPI_FLOOR;
};
const shipping = (prints: number) => (prints ? 800 + 200 * (prints - 1) : 0); // SAMPLE rate; the server recomputes it
const asset = (i: Pick<Item, "width" | "height" | "color" | "blur"> & { mediaId: string }) => ({
  id: i.mediaId,
  width: i.width,
  height: i.height,
  color: i.color ?? undefined,
  blur: i.blur ?? undefined,
  files: [],
});

/**
 * The gallery, as the people it is for see it. A cover and title open it; albums (with sub-albums and locked albums) and
 * "All photos" organise it; the lightbox and the cart sit over the photographs. The client (passcode) also proofs: favourites,
 * ratings, approvals, comments, a selection to send, and the downloads they are owed. Visitors of the public link view and shop.
 */
export function Gallery({ data }: { data: Data }) {
  return (
    <>
      <GalleryView data={data} />
      {data.tracks.length ? (
        <MusicPlayer tracks={data.tracks} autoplay={data.style.autoplay} theme={data.theme} />
      ) : null}
    </>
  );
}

/** Gallery music: the studio's tracks in order, with play, pause and next. Autoplay waits for the visitor's first tap (browsers require it). */
function MusicPlayer({ tracks, autoplay, theme }: { tracks: Data["tracks"]; autoplay: boolean; theme: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: the track index changes the source, which must restart playback
  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    if (playing) a.play().catch(() => setPlaying(false));
    else a.pause();
  }, [playing, i]);
  useEffect(() => {
    if (!autoplay) return;
    const go = () => setPlaying(true);
    window.addEventListener("pointerdown", go, { once: true });
    return () => window.removeEventListener("pointerdown", go);
  }, [autoplay]);
  const t = tracks[i % tracks.length];
  return (
    <div className="gx gx-music" data-theme={theme} role="group" aria-label="Music">
      <audio ref={ref} src={`/g/audio/${t.id}`} preload="none" onEnded={() => setI((n) => (n + 1) % tracks.length)} />
      <button
        type="button"
        onClick={() => setPlaying((p) => !p)}
        aria-pressed={playing}
        aria-label={playing ? "Pause music" : "Play music"}
      >
        {playing ? "❚❚" : "▶"}
      </button>
      <span>
        ♪ {t.title}
        {t.artist ? <small> · {t.artist}</small> : null}
      </span>
      {tracks.length > 1 ? (
        <button type="button" onClick={() => setI((n) => (n + 1) % tracks.length)} aria-label="Next track">
          ›|
        </button>
      ) : null}
    </div>
  );
}

function GalleryView({ data }: { data: Data }) {
  const router = useRouter();
  const client = data.role === "client";
  const shopOn = data.shop.enabled && (data.shop.sellDigital || data.shop.sellPrints);
  const gid = data.galleryId;
  const [items, setItems] = useState(data.items);
  // a refresh (for example after opening a locked album) brings the server's list of photographs
  useEffect(() => setItems(data.items), [data.items]);
  const [album, setAlbum] = useState("");
  const [view, setView] = useState<"photos" | "favourites" | "shop" | "about">("photos");
  const [stage, setStage] = useState<"pending" | "intro" | "gallery">("pending");
  const [rulesOpen, setRulesOpen] = useState(false);
  const [signIn, setSignIn] = useState(false);
  const seenKey = `gx-seen-${data.slug ?? data.galleryId ?? data.title}`;
  const cover = data.items.find((i) => i.mediaId === data.coverMediaId) ?? data.items[0];
  // the cover page and the rules note appear once per visit (per browser session); without a cover or note they are skipped
  useEffect(() => {
    let seen = false;
    try {
      seen = Boolean(sessionStorage.getItem(seenKey));
    } catch {}
    const wantsIntro = data.style.introPage && Boolean(cover) && data.style.header !== "minimal";
    if (seen || !wantsIntro) {
      setStage("gallery");
      if (!seen && data.style.introMessage) {
        setRulesOpen(true);
        try {
          sessionStorage.setItem(seenKey, "1");
        } catch {}
      }
    } else setStage("intro");
  }, [seenKey, cover, data.style.introPage, data.style.header, data.style.introMessage]);
  const [open, setOpen] = useState<number | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [dlOpen, setDlOpen] = useState(false);
  const [lockFor, setLockFor] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [sent, setSent] = useState(data.sent);
  const [cart, setCart] = useState<Line[]>([]);
  const storeKey = `gx-cart-${data.slug ?? data.galleryId ?? data.title}`;
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storeKey);
      if (raw) setCart(JSON.parse(raw) as Line[]);
    } catch {}
  }, [storeKey]);
  useEffect(() => {
    try {
      localStorage.setItem(storeKey, JSON.stringify(cart));
    } catch {}
  }, [cart, storeKey]);
  const say = (ok: boolean, text: string) => setMsg({ ok, text });
  const upd = (id: string, p: Partial<Item>) =>
    setItems((all) => all.map((i) => (i.mediaId === id ? { ...i, ...p } : i)));

  const top = data.albums.filter((a) => !a.parentId);
  const kids = (id: string) => data.albums.filter((a) => a.parentId === id);
  const current = data.albums.find((a) => a.id === album) ?? null;
  const parent = current?.parentId ? (data.albums.find((a) => a.id === current.parentId) ?? null) : current;
  const subs = parent ? kids(parent.id) : [];
  const inAlbum = (it: Item) => {
    if (!album || album === "all-photos") return true;
    if (it.albumId === album) return true;
    return kids(album).some((k) => k.id === it.albumId);
  };
  const shown = items.filter((i) => inAlbum(i) && (view !== "favourites" || i.favourite));
  const chosen = items.filter((i) => i.favourite).length;
  const heroItem = items.find((i) => i.mediaId === data.coverMediaId) ?? items[0];
  const cartCount = cart.reduce((n, l) => n + l.qty, 0);
  const products = data.shop.products;
  const byId = new Map(products.map((p) => [p.id, p]));
  const cartLines = cart
    .map((l) => ({ ...l, product: byId.get(l.productId), item: items.find((i) => i.mediaId === l.mediaId) }))
    .filter((l) => l.product);
  const subtotal = cartLines.reduce((n, l) => n + (l.product?.priceCents ?? 0) * l.qty, 0);
  const printQty = cartLines.filter((l) => !DIGITAL.includes(l.product?.kind ?? "")).reduce((n, l) => n + l.qty, 0);
  const addToCart = (productId: string, mediaId: string | null) => {
    const p = byId.get(productId);
    if (!p) return;
    const digital = DIGITAL.includes(p.kind);
    setCart((c) => {
      const at = c.findIndex((l) => l.productId === productId && l.mediaId === mediaId);
      if (at >= 0) return digital ? c : c.map((l, i) => (i === at ? { ...l, qty: Math.min(50, l.qty + 1) } : l));
      return [...c, { productId, mediaId, qty: 1 }];
    });
    say(true, `${p.name} added to your cart.`);
  };

  const style = {
    ...(data.style.primary || data.accent ? { ["--gx-accent" as string]: data.style.primary || data.accent } : {}),
    ...(data.style.secondary ? { ["--gx-link" as string]: data.style.secondary } : {}),
    ...(data.style.background ? { ["--gx-bg-custom" as string]: data.style.background } : {}),
  } as React.CSSProperties;

  /* ---- proofing (the client only) ---- */
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

  function pickAlbum(id: string) {
    const a = data.albums.find((x) => x.id === id);
    if (a?.closed) return setLockFor(id);
    setAlbum(id);
    setView("photos");
    document.getElementById("gx-main")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (data.state === "expired" || data.state === "archived")
    return (
      <div className="gx" style={style} data-theme={data.theme} data-font={data.style.font}>
        <section className="gx-gone" aria-labelledby="gx-exp">
          <h1 id="gx-exp">{data.title}</h1>
          <p role="status">
            This gallery{" "}
            {data.state === "archived"
              ? "has been archived"
              : `expired${data.expiresAt ? ` on ${data.expiresAt}` : ""}`}
            .{client ? " Your photographs are safe: extend access to bring it back." : ""}
          </p>
          {client ? (
            <button type="button" className="gx-btn" onClick={reactivate}>
              Extend access
            </button>
          ) : null}
          {msg ? <p role={msg.ok ? "status" : "alert"}>{msg.text}</p> : null}
        </section>
      </div>
    );

  const crop = data.layout === "grid" || data.layout === "mosaic";
  const hasCover = Boolean(heroItem) && data.style.header !== "minimal";
  const sty = data.style;
  const hasAlbums = !sty.hideAlbums && top.length > 0;
  const today = new Date().toISOString().slice(0, 10);
  const banner = sty.bannerEnabled && sty.bannerText && (!sty.bannerExpires || sty.bannerExpires >= today);
  const canDownload = client ? data.downloads.web || data.downloads.full : data.downloads.web;
  const siteUrl = typeof window === "undefined" ? "" : location.origin;
  async function share() {
    const url = `${siteUrl}/g/${data.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: data.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      say(true, "Link copied. Send it to anyone who should see this gallery.");
    } catch {
      say(false, `Copy this link: ${url}`);
    }
  }
  function enter() {
    try {
      sessionStorage.setItem(seenKey, "1");
    } catch {}
    setStage("gallery");
    if (sty.introMessage) setRulesOpen(true);
  }
  const photosRoot = view === "photos" && !album && hasAlbums && sty.albumView === "cards";
  const showGrid = !photosRoot && view !== "shop" && view !== "about";

  if (stage === "pending") return <div className="gx" style={style} data-theme={data.theme} data-font={sty.font} />;
  if (stage === "intro" && heroItem)
    return (
      <div className="gx gx-intro" style={style} data-theme={data.theme} data-font={sty.font}>
        <header className="gx-hero" data-header={sty.header} data-cover="">
          <div className="gx-hero__img">
            <ProtectedImage asset={asset({ ...heroItem })} alt="" fill fit="cover" priority sizes="100vw" />
          </div>
          <div className="gx-hero__text">
            <p className="gx-brand">{sty.brandLine || data.brand.name}</p>
            <h1>{data.title}</h1>
            {data.welcome ? <p className="gx-welcome">{data.welcome}</p> : null}
            <div className="gx-hero__actions">
              <button type="button" className="gx-btn gx-btn--solid" onClick={enter}>
                View Gallery
              </button>
            </div>
          </div>
        </header>
      </div>
    );

  return (
    <div
      className="gx"
      style={style}
      data-theme={data.theme}
      data-font={sty.font}
      data-layout={data.layout}
      data-density={data.density}
      data-gap={sty.gap}
      data-corners={sty.corners}
      data-custom-bg={sty.background ? "" : undefined}
    >
      {banner ? (
        <p className="gx-banner">
          {sty.bannerLink ? (
            <a href={sty.bannerLink} target="_blank" rel="noreferrer">
              {sty.bannerText}
            </a>
          ) : (
            sty.bannerText
          )}
        </p>
      ) : null}
      <header className="gx-top">
        <a
          className="gx-top__brand"
          href={data.slug ? `/g/${data.slug}` : "#"}
          onClick={() => {
            setView("photos");
            setAlbum("");
          }}
        >
          {sty.brandLine || data.brand.name}
        </a>
        <nav className="gx-top__tabs" aria-label="Gallery">
          <button
            type="button"
            aria-current={view === "photos" ? "page" : undefined}
            onClick={() => {
              setView("photos");
              setAlbum("");
            }}
          >
            Photos
          </button>
          {shopOn ? (
            <button type="button" aria-current={view === "shop" ? "page" : undefined} onClick={() => setView("shop")}>
              Store
            </button>
          ) : null}
          {client ? (
            <button
              type="button"
              aria-current={view === "favourites" ? "page" : undefined}
              onClick={() => setView("favourites")}
            >
              Favorites <small>{chosen}</small>
            </button>
          ) : null}
          <button type="button" aria-current={view === "about" ? "page" : undefined} onClick={() => setView("about")}>
            About
          </button>
        </nav>
        <div className="gx-top__right">
          {!client && data.slug ? (
            <button type="button" className="gx-tool" onClick={() => setSignIn(true)}>
              Client sign-in
            </button>
          ) : null}
          {client ? (
            <form action={leaveGalleryAction}>
              <button type="submit" className="gx-tool">
                Sign out
              </button>
            </form>
          ) : null}
          {shopOn ? (
            <button
              type="button"
              className="gx-cart"
              onClick={() => setCartOpen(true)}
              aria-label={`Cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}
            >
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                aria-hidden="true"
              >
                <path d="M3 4h2.2l2 11h10.6l2-8H6.4" />
                <circle cx="9" cy="19.5" r="1.2" />
                <circle cx="17" cy="19.5" r="1.2" />
              </svg>
              {cartCount ? <b>{cartCount}</b> : null}
            </button>
          ) : null}
        </div>
      </header>
      <div className="gx-subbar" role="toolbar" aria-label="Gallery actions">
        {sty.allowSharing && data.slug ? (
          <button type="button" onClick={() => void share()}>
            Share
          </button>
        ) : null}
        {canDownload && sty.showDownloadAll ? (
          <button type="button" onClick={() => setDlOpen(true)}>
            Download all
          </button>
        ) : null}
        <button type="button" disabled={!shown.length} onClick={() => setOpen(0)}>
          Slideshow
        </button>
      </div>

      <main id="gx-main" className="gx-main" tabIndex={-1}>
        {msg ? (
          <p className="gx-msg" role={msg.ok ? "status" : "alert"} data-ok={msg.ok || undefined}>
            {msg.text}
          </p>
        ) : null}
        {data.state === "expiring" && client ? (
          <p className="gx-msg" role="status">
            This gallery expires on {data.expiresAt}.{" "}
            <button type="button" className="gx-link" onClick={reactivate}>
              Extend access
            </button>
          </p>
        ) : null}

        {view === "shop" && shopOn ? (
          <ShopView data={data} onAdd={addToCart} onBrowse={() => setView("photos")} />
        ) : view === "about" ? (
          <About data={data} />
        ) : (
          <>
            <div className="gx-title">
              <h1>{view === "favourites" ? "Favorites" : current ? current.name : data.title}</h1>
              <p className="gx-count">
                {photosRoot
                  ? `${top.length} album${top.length === 1 ? "" : "s"}`
                  : `${shown.length} photograph${shown.length === 1 ? "" : "s"}`}
              </p>
              {current || album === "all-photos" ? (
                <button type="button" className="gx-link" onClick={() => setAlbum(current?.parentId ?? "")}>
                  ←{" "}
                  {current?.parentId
                    ? `Back to ${parent?.name}`
                    : hasAlbums && sty.albumView === "cards"
                      ? "All albums"
                      : "All photos"}
                </button>
              ) : null}
              {!current && data.welcome && !album ? <p className="gx-welcome">{data.welcome}</p> : null}
            </div>
            {hasAlbums && sty.albumView === "tabs" && view === "photos" ? (
              <div className="gx-subs" role="toolbar" aria-label="Albums">
                {sty.hideAllPhotos ? null : (
                  <button type="button" aria-pressed={!album || album === "all-photos"} onClick={() => setAlbum("")}>
                    All photos {sty.hideAlbumCount ? null : <small>{items.length}</small>}
                  </button>
                )}
                {top.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    aria-pressed={album === a.id || current?.parentId === a.id}
                    onClick={() => pickAlbum(a.id)}
                  >
                    {a.locked ? "🔒 " : ""}
                    {a.name}{" "}
                    {sty.hideAlbumCount ? null : (
                      <small>{a.closed ? "locked" : a.count + kids(a.id).reduce((n, k) => n + k.count, 0)}</small>
                    )}
                  </button>
                ))}
              </div>
            ) : null}
            {subs.length && view === "photos" ? (
              <div className="gx-subs" role="toolbar" aria-label={`In ${parent?.name}`}>
                <button
                  type="button"
                  aria-pressed={album === parent?.id}
                  onClick={() => parent && pickAlbum(parent.id)}
                >
                  All of {parent?.name}
                </button>
                {subs.map((sb) => (
                  <button key={sb.id} type="button" aria-pressed={album === sb.id} onClick={() => pickAlbum(sb.id)}>
                    {sb.locked ? "🔒 " : ""}
                    {sb.name} {sty.hideAlbumCount ? null : <small>{sb.closed ? "locked" : sb.count}</small>}
                  </button>
                ))}
              </div>
            ) : null}
            {photosRoot ? (
              <AlbumCards data={data} items={items} onPick={pickAlbum} onAll={() => setAlbum("all-photos")} />
            ) : null}
            {showGrid ? (
              <>
                {current?.description ? <p className="gx-album-note">{current.description}</p> : null}
                <ul className="gx-photos" aria-label="Photographs">
                  {shown.map((i, n) => (
                    <li
                      key={i.mediaId}
                      data-media-id={i.mediaId}
                      data-wide={data.layout === "mosaic" && n % 7 === 0 ? "" : undefined}
                      style={{ "--ar": i.width / Math.max(1, i.height) } as React.CSSProperties}
                    >
                      <button
                        type="button"
                        className="gx-open"
                        onClick={() => setOpen(n)}
                        aria-label={`Open ${i.filename}`}
                        style={crop ? undefined : { aspectRatio: `${i.width} / ${i.height}` }}
                      >
                        {crop ? (
                          <ProtectedImage
                            asset={asset(i)}
                            alt={i.filename}
                            sizes="(min-width: 900px) 30vw, 50vw"
                            fill
                            fit="cover"
                          />
                        ) : (
                          <ProtectedImage asset={asset(i)} alt={i.filename} sizes="(min-width: 900px) 30vw, 50vw" />
                        )}
                      </button>
                      {sty.showFilenames ? <small className="gx-cap">{i.filename}</small> : null}
                      <div className="gx-tile">
                        {client ? (
                          <button
                            type="button"
                            className="gx-ico"
                            aria-pressed={i.favourite}
                            aria-label={`${i.favourite ? "Remove" : "Add"} ${i.filename} ${i.favourite ? "from" : "to"} favourites`}
                            disabled={sent}
                            onClick={() => void fav(i)}
                          >
                            {i.favourite ? "♥" : "♡"}
                          </button>
                        ) : null}
                        {shopOn ? (
                          <button
                            type="button"
                            className="gx-ico gx-ico--buy"
                            aria-label={`Buy ${i.filename}`}
                            onClick={() => setOpen(n)}
                          >
                            Buy
                          </button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
                {!shown.length ? (
                  <p className="gx-empty">
                    {view === "favourites" ? "Tap the heart on a photograph to keep it here." : "Nothing here yet."}
                  </p>
                ) : null}
              </>
            ) : null}
            {client && !photosRoot ? (
              <section className="gx-select" aria-label="Your selection">
                <p role="status">
                  {chosen} favourite{chosen === 1 ? "" : "s"} chosen{data.limit ? ` of ${data.limit}` : ""}.
                  {sent ? " Your selection was sent." : ""}
                </p>
                {!sent ? (
                  <button
                    type="button"
                    className="gx-btn gx-btn--solid"
                    disabled={!chosen}
                    onClick={() => void submitSelection()}
                  >
                    Send my selection
                  </button>
                ) : null}
              </section>
            ) : null}
          </>
        )}
      </main>

      <footer className="gx-foot">
        {sty.footer ? <p>{sty.footer}</p> : null}
        <p>
          <a href="/terms">Terms of Use</a> · <a href="/privacy">Privacy Policy</a>
          {sty.introMessage ? (
            <>
              {" "}
              ·{" "}
              <button type="button" className="gx-link" onClick={() => setRulesOpen(true)}>
                {sty.introHeadline || "Rules"}
              </button>
            </>
          ) : null}
        </p>
      </footer>

      {open !== null && shown[open] ? (
        <Lightbox
          data={data}
          client={client}
          shopOn={shopOn}
          items={shown}
          start={open}
          sent={sent}
          cart={cart}
          onClose={() => setOpen(null)}
          onAdd={addToCart}
          onOpenCart={() => {
            setOpen(null);
            setCartOpen(true);
          }}
          fav={fav}
          rate={rate}
          decide={decide}
          say={say}
          setItems={setItems}
        />
      ) : null}
      {cartOpen ? (
        <Cart
          data={data}
          lines={cartLines}
          subtotal={subtotal}
          printQty={printQty}
          onClose={() => setCartOpen(false)}
          onChange={(productId, mediaId, qty) =>
            setCart((c) =>
              qty <= 0
                ? c.filter((l) => !(l.productId === productId && l.mediaId === mediaId))
                : c.map((l) =>
                    l.productId === productId && l.mediaId === mediaId ? { ...l, qty: Math.min(50, qty) } : l,
                  ),
            )
          }
          onDone={() => setCart([])}
        />
      ) : null}
      {dlOpen ? <Downloads data={data} client={client} onClose={() => setDlOpen(false)} say={say} /> : null}
      {rulesOpen ? (
        <Sheet title={sty.introHeadline || "Rules"} onClose={() => setRulesOpen(false)}>
          <RichText text={sty.introMessage} />
          <p style={{ marginTop: "1.2rem" }}>
            <button type="button" className="gx-btn gx-btn--solid" onClick={() => setRulesOpen(false)}>
              Continue
            </button>
          </p>
        </Sheet>
      ) : null}
      {signIn && data.slug ? (
        <SignIn
          slug={data.slug}
          onClose={() => setSignIn(false)}
          onDone={() => {
            setSignIn(false);
            router.refresh();
          }}
        />
      ) : null}
      {lockFor ? (
        <UnlockAlbum
          galleryId={gid}
          album={data.albums.find((a) => a.id === lockFor)}
          onClose={() => setLockFor(null)}
          onOpened={(id) => {
            setLockFor(null);
            setAlbum(id);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function About({ data }: { data: Data }) {
  const b = data.brand;
  return (
    <section className="gx-about" aria-labelledby="gx-about-h">
      <h1 id="gx-about-h">{b.name}</h1>
      {data.style.aboutText ? <RichText text={data.style.aboutText} /> : null}
      <ul>
        {b.website ? (
          <li>
            Website: <a href={`https://${b.website.replace(/^https?:\/\//, "")}`}>{b.website}</a>
          </li>
        ) : null}
        {b.instagram ? (
          <li>
            Instagram:{" "}
            <a href={`https://www.instagram.com/${b.instagram.replace(/^@/, "")}`}>@{b.instagram.replace(/^@/, "")}</a>
          </li>
        ) : null}
        {b.email ? (
          <li>
            Email: <a href={`mailto:${b.email}`}>{b.email}</a>
          </li>
        ) : null}
        {b.phone ? <li>Phone: {b.phone}</li> : null}
        {b.address ? <li>{b.address}</li> : null}
      </ul>
    </section>
  );
}

function SignIn({ slug, onClose, onDone }: { slug: string; onClose: () => void; onDone: () => void }) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  return (
    <Sheet title="Client sign-in" onClose={onClose}>
      <p className="gx-fine">
        If this is your gallery, enter the passcode you were given. It lets you pick favorites, rate, comment and
        download what is yours.
      </p>
      <form
        className="gx-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const r = await enterGalleryAction({ slug, passcode: code });
          if (r.ok) onDone();
          else setErr(r.error);
        }}
      >
        <label>
          Passcode
          <input value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" />
        </label>
        {err ? (
          <p role="alert" className="gx-msg">
            {err}
          </p>
        ) : null}
        <button type="submit" className="gx-btn gx-btn--solid">
          Sign in
        </button>
      </form>
    </Sheet>
  );
}

/** A native dialog with a title, a close button and the page behind it inert. */
function Sheet({
  title,
  onClose,
  children,
  wide,
  side,
}: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean; side?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: clicking the backdrop is a mouse shortcut; Escape and the Close button close it for the keyboard
    <dialog
      ref={ref}
      className="gx-sheet"
      data-wide={wide || undefined}
      data-side={side || undefined}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="gx-sheet__bar">
        <h2>{title}</h2>
        <button type="button" className="gx-tool" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="gx-sheet__body">{children}</div>
    </dialog>
  );
}

function AlbumCards({
  data,
  items,
  onPick,
  onAll,
}: { data: Data; items: Item[]; onPick: (id: string) => void; onAll: () => void }) {
  const top = data.albums.filter((a) => !a.parentId);
  const cover = (a: Data["albums"][number]) =>
    a.closed
      ? null
      : (items.find((i) => i.mediaId === a.coverMediaId) ?? items.find((i) => i.albumId === a.id) ?? null);
  return (
    <ul className="gx-cards" aria-label="Albums">
      <li>
        <button type="button" className="gx-card" onClick={onAll}>
          <span className="gx-card__img">
            {items[0] ? <ProtectedImage asset={asset(items[0])} alt="" fill fit="cover" /> : null}
          </span>
          <span className="gx-card__label">
            All photos <small>{items.length}</small>
          </span>
        </button>
      </li>
      {top.map((a) => {
        const c = cover(a);
        return (
          <li key={a.id}>
            <button type="button" className="gx-card" onClick={() => onPick(a.id)} data-locked={a.closed || undefined}>
              <span className="gx-card__img">
                {c ? <ProtectedImage asset={asset(c)} alt="" fill fit="cover" /> : <span className="gx-lock">🔒</span>}
              </span>
              <span className="gx-card__label">
                {a.name} <small>{a.closed ? "locked" : a.count}</small>
              </span>
              {a.description ? <span className="gx-card__desc">{a.description}</span> : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function ShopView({
  data,
  onAdd,
  onBrowse,
}: { data: Data; onAdd: (productId: string, mediaId: string | null) => void; onBrowse: () => void }) {
  const groups: [string, string[]][] = [
    ["Downloads", ["digital-web", "digital-full", "digital-all"]],
    ["Prints", ["print"]],
    ["Canvas", ["canvas"]],
    ["Cards", ["card"]],
    ["Albums", ["album"]],
  ];
  const sell = (k: string) => (DIGITAL.includes(k) ? data.shop.sellDigital : data.shop.sellPrints);
  return (
    <section className="gx-shop" aria-labelledby="gx-shop-h">
      <h2 id="gx-shop-h">Shop</h2>
      <p className="gx-shop__lede">Pick a photograph, then choose a size or a download. {data.shop.note}</p>
      <button type="button" className="gx-btn gx-btn--solid" onClick={onBrowse}>
        Choose photographs
      </button>
      {groups.map(([name, kinds]) => {
        const list = data.shop.products.filter((p) => kinds.includes(p.kind) && sell(p.kind));
        if (!list.length) return null;
        return (
          <div key={name} className="gx-shop__group">
            <h3>{name}</h3>
            <ul>
              {list.map((p) => (
                <li key={p.id}>
                  <span>
                    <strong>{p.name}</strong>
                    {p.description ? <small>{p.description}</small> : null}
                  </span>
                  <em>
                    {usd(p.priceCents)}
                    {p.sample ? <b className="gx-sample">SAMPLE</b> : null}
                  </em>
                  {p.kind === "digital-all" ? (
                    <button type="button" className="gx-btn" onClick={() => onAdd(p.id, null)}>
                      Add whole gallery
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}

function Lightbox({
  data,
  client,
  shopOn,
  items,
  start,
  sent,
  cart,
  onClose,
  onAdd,
  onOpenCart,
  fav,
  rate,
  decide,
  say,
  setItems,
}: {
  data: Data;
  client: boolean;
  shopOn: boolean;
  items: Item[];
  start: number;
  sent: boolean;
  cart: Line[];
  onClose: () => void;
  onAdd: (productId: string, mediaId: string | null) => void;
  onOpenCart: () => void;
  fav: (i: Item) => Promise<void>;
  rate: (i: Item, n: number) => Promise<void>;
  decide: (i: Item, d: "approved" | "rejected") => Promise<void>;
  say: (ok: boolean, text: string) => void;
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [i, setI] = useState(start);
  const [play, setPlay] = useState(false);
  const [panel, setPanel] = useState<"buy" | "proof" | null>(
    shopOn || (!client && data.rules.length) ? "buy" : client ? "proof" : null,
  );
  const [draft, setDraft] = useState("");
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
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight") setI((x) => (x + 1) % items.length);
      if (e.key === "ArrowLeft") setI((x) => (x - 1 + items.length) % items.length);
    };
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, [items.length]);
  const it = items[i];
  const own = data.rules.filter((r) => r.albumId && r.albumId === it.albumId);
  const freeRules = own.length ? own : data.rules.filter((r) => !r.albumId);
  const options = data.shop.products.filter(
    (p) => p.kind !== "digital-all" && (DIGITAL.includes(p.kind) ? data.shop.sellDigital : data.shop.sellPrints),
  );
  const inCart = (productId: string) => cart.some((l) => l.productId === productId && l.mediaId === it.mediaId);
  async function send() {
    const r = await commentAction({ galleryId: data.galleryId, mediaId: it.mediaId, body: draft });
    if (r.ok) {
      const c = { body: draft.trim(), author: "client", at: new Date().toISOString().slice(0, 10) };
      setItems((all) => all.map((x) => (x.mediaId === it.mediaId ? { ...x, comments: [...x.comments, c] } : x)));
      setDraft("");
    } else say(false, r.error);
  }
  const web = data.downloads.web && data.downloads.unlocked;
  return (
    <dialog ref={ref} className="gx-lb" aria-label="Photograph" onClose={onClose}>
      <div className="gx-lb__bar">
        <span aria-live="polite">
          {i + 1} / {items.length}
        </span>
        <div>
          <button type="button" className="gx-tool" aria-pressed={play} onClick={() => setPlay((p) => !p)}>
            {play ? "Pause" : "Play"}
          </button>
          <button type="button" className="gx-tool" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <div className="gx-lb__stage" data-panel={panel ? "" : undefined}>
        <button
          type="button"
          className="gx-lb__nav"
          aria-label="Previous photograph"
          onClick={() => setI((x) => (x - 1 + items.length) % items.length)}
        >
          ←
        </button>
        <div className="gx-lb__photo">
          <ProtectedImage key={it.mediaId} asset={asset(it)} alt={it.filename} fit="contain" priority />
        </div>
        <button
          type="button"
          className="gx-lb__nav"
          aria-label="Next photograph"
          onClick={() => setI((x) => (x + 1) % items.length)}
        >
          →
        </button>
        {panel ? (
          <aside className="gx-lb__panel" aria-label="Photograph options">
            <div className="gx-lb__tabs" role="tablist">
              {shopOn || (!client && data.rules.length) ? (
                <button type="button" role="tab" aria-selected={panel === "buy"} onClick={() => setPanel("buy")}>
                  {shopOn ? "Buy" : "Download"}
                </button>
              ) : null}
              {client ? (
                <button type="button" role="tab" aria-selected={panel === "proof"} onClick={() => setPanel("proof")}>
                  Proof
                </button>
              ) : null}
            </div>
            {panel === "buy" ? (
              <div className="gx-buy">
                <p className="gx-buy__file">{it.filename}</p>
                {shopOn && options.length ? (
                  <ul>
                    {options.map((p) => {
                      const ok = fits(p, it);
                      return (
                        <li key={p.id}>
                          <span>
                            {p.name}
                            {p.sample ? <b className="gx-sample">SAMPLE</b> : null}
                            {!ok ? <small>Too small for this size</small> : null}
                          </span>
                          <em>{usd(p.priceCents)}</em>
                          <button
                            type="button"
                            className="gx-btn"
                            disabled={!ok}
                            onClick={() => onAdd(p.id, it.mediaId)}
                          >
                            {inCart(p.id) ? (DIGITAL.includes(p.kind) ? "In cart" : "Add another") : "Add"}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : shopOn ? (
                  <p>Nothing is for sale here yet.</p>
                ) : null}
                {shopOn && cart.length ? (
                  <button type="button" className="gx-btn gx-btn--solid" onClick={onOpenCart}>
                    Open cart ({cart.reduce((n, l) => n + l.qty, 0)})
                  </button>
                ) : null}
                {!client && freeRules.length ? (
                  <div className="gx-free">
                    <h3>Free downloads</h3>
                    <ul>
                      {freeRules.map((r) => (
                        <PhotoRule key={r.id} rule={r} mediaId={it.mediaId} data={data} say={say} />
                      ))}
                    </ul>
                  </div>
                ) : web ? (
                  <a
                    className="gx-btn"
                    href={`/client/download?${data.galleryId ? `g=${data.galleryId}&` : ""}m=${it.mediaId}&size=web`}
                    download
                  >
                    Free web-size copy
                  </a>
                ) : null}
              </div>
            ) : null}
            {panel === "proof" && client ? (
              <div className="gx-proof">
                <button
                  type="button"
                  className="gx-btn"
                  aria-pressed={it.favourite}
                  disabled={sent}
                  onClick={() => void fav(it)}
                  aria-label={`${it.favourite ? "Remove" : "Add"} ${it.filename} ${it.favourite ? "from" : "to"} favourites`}
                >
                  {it.favourite ? "♥ Favourite" : "♡ Favourite"}
                </button>
                {data.allowRatings ? (
                  <span role="group" aria-label={`Rate ${it.filename}`} className="gx-stars">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={(it.rating ?? 0) >= s}
                        aria-label={`${s} star${s > 1 ? "s" : ""} for ${it.filename}`}
                        onClick={() => void rate(it, s)}
                      >
                        {(it.rating ?? 0) >= s ? "★" : "☆"}
                      </button>
                    ))}
                  </span>
                ) : null}
                <div className="gx-proof__row">
                  <button
                    type="button"
                    className="gx-btn"
                    aria-pressed={it.decision === "approved"}
                    disabled={sent}
                    onClick={() => void decide(it, "approved")}
                    aria-label={`Approve ${it.filename}`}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="gx-btn"
                    aria-pressed={it.decision === "rejected"}
                    disabled={sent}
                    onClick={() => void decide(it, "rejected")}
                    aria-label={`Not for me: ${it.filename}`}
                  >
                    Not this
                  </button>
                </div>
                {data.allowComments ? (
                  <div className="gx-comments">
                    <ul>
                      {it.comments.map((c, k) => (
                        <li key={`${c.at}-${k}`}>
                          <strong>{c.author === "client" ? "You" : "Photographer"}</strong> <small>{c.at}</small>
                          <span>{c.body}</span>
                        </li>
                      ))}
                    </ul>
                    <label>
                      Your comment
                      <input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={1000} />
                    </label>
                    <button type="button" className="gx-btn" onClick={() => void send()} disabled={!draft.trim()}>
                      Add comment
                    </button>
                  </div>
                ) : null}
                {data.downloads.full && data.downloads.unlocked ? (
                  <a
                    className="gx-btn"
                    href={`/client/download?${data.galleryId ? `g=${data.galleryId}&` : ""}m=${it.mediaId}&size=full`}
                    download
                  >
                    Full size
                  </a>
                ) : null}
                {web ? (
                  <a
                    className="gx-btn"
                    href={`/client/download?${data.galleryId ? `g=${data.galleryId}&` : ""}m=${it.mediaId}&size=web`}
                    download
                  >
                    Web size
                  </a>
                ) : null}
              </div>
            ) : null}
          </aside>
        ) : null}
      </div>
    </dialog>
  );
}

function Cart({
  data,
  lines,
  subtotal,
  printQty,
  onClose,
  onChange,
  onDone,
}: {
  data: Data;
  lines: (Line & { product?: Product; item?: Item })[];
  subtotal: number;
  printQty: number;
  onClose: () => void;
  onChange: (productId: string, mediaId: string | null, qty: number) => void;
  onDone: () => void;
}) {
  const [f, setF] = useState({
    name: "",
    email: "",
    line1: "",
    line2: "",
    city: "",
    region: "",
    postalCode: "",
    country: data.shop.shipCountries[0] ?? "US",
  });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const ship = shipping(printQty);
  async function go() {
    setErr("");
    setBusy(true);
    const r = await checkoutAction({
      galleryId: data.galleryId,
      lines: lines.map((l) => ({ productId: l.productId, mediaId: l.mediaId, qty: l.qty })),
      buyer: { name: f.name, email: f.email },
      ship: printQty
        ? {
            name: f.name,
            line1: f.line1,
            line2: f.line2 || undefined,
            city: f.city,
            region: f.region,
            postalCode: f.postalCode,
            country: f.country,
          }
        : null,
    });
    setBusy(false);
    if (r.ok) {
      onDone();
      location.assign(r.url);
    } else setErr(r.error);
  }
  return (
    <Sheet title="Your cart" onClose={onClose} side>
      {lines.length ? (
        <>
          <ul className="gx-cart">
            {lines.map((l) => (
              <li key={`${l.productId}-${l.mediaId}`}>
                <span>
                  {l.product?.name}
                  <small>{l.mediaId ? (l.item?.filename ?? "photograph") : "Whole gallery"}</small>
                </span>
                <em>{usd((l.product?.priceCents ?? 0) * l.qty)}</em>
                <span className="gx-qty">
                  {DIGITAL.includes(l.product?.kind ?? "") ? null : (
                    <>
                      <button
                        type="button"
                        aria-label="One fewer"
                        onClick={() => onChange(l.productId, l.mediaId, l.qty - 1)}
                      >
                        −
                      </button>
                      <b>{l.qty}</b>
                      <button
                        type="button"
                        aria-label="One more"
                        onClick={() => onChange(l.productId, l.mediaId, l.qty + 1)}
                      >
                        +
                      </button>
                    </>
                  )}
                  <button type="button" className="gx-link" onClick={() => onChange(l.productId, l.mediaId, 0)}>
                    Remove
                  </button>
                </span>
              </li>
            ))}
          </ul>
          <dl className="gx-sum">
            <div>
              <dt>Subtotal</dt>
              <dd>{usd(subtotal)}</dd>
            </div>
            {ship ? (
              <div>
                <dt>Shipping (SAMPLE rate)</dt>
                <dd>{usd(ship)}</dd>
              </div>
            ) : null}
            <div className="gx-sum__total">
              <dt>Total</dt>
              <dd>{usd(subtotal + ship)}</dd>
            </div>
          </dl>
          <form
            className="gx-form"
            onSubmit={(e) => {
              e.preventDefault();
              void go();
            }}
          >
            <label>
              Your name
              <input value={f.name} onChange={set("name")} autoComplete="name" required />
            </label>
            <label>
              Email (your receipt and downloads go here)
              <input type="email" value={f.email} onChange={set("email")} autoComplete="email" required />
            </label>
            {printQty ? (
              <fieldset>
                <legend>Ship prints to</legend>
                <label>
                  Address
                  <input value={f.line1} onChange={set("line1")} autoComplete="address-line1" required />
                </label>
                <label>
                  Apartment, suite (optional)
                  <input value={f.line2} onChange={set("line2")} autoComplete="address-line2" />
                </label>
                <div className="gx-form__row">
                  <label>
                    City
                    <input value={f.city} onChange={set("city")} autoComplete="address-level2" required />
                  </label>
                  <label>
                    State
                    <input value={f.region} onChange={set("region")} autoComplete="address-level1" required />
                  </label>
                  <label>
                    ZIP
                    <input value={f.postalCode} onChange={set("postalCode")} autoComplete="postal-code" required />
                  </label>
                </div>
                <label>
                  Country
                  <select value={f.country} onChange={set("country")}>
                    {data.shop.shipCountries.map((c) => (
                      <option key={c} value={c}>
                        {c === "US" ? "United States" : c === "CA" ? "Canada" : "Mexico"}
                      </option>
                    ))}
                  </select>
                </label>
              </fieldset>
            ) : null}
            {err ? (
              <p role="alert" className="gx-msg">
                {err}
              </p>
            ) : null}
            {data.shop.minOrderCents && subtotal < data.shop.minOrderCents ? (
              <p role="status" className="gx-msg">
                The smallest order here is {usd(data.shop.minOrderCents)}. Add {usd(data.shop.minOrderCents - subtotal)}{" "}
                more to continue.
              </p>
            ) : null}
            {data.shop.checkoutMessage ? <p className="gx-fine">{data.shop.checkoutMessage}</p> : null}
            <button
              type="submit"
              className="gx-btn gx-btn--solid"
              disabled={busy || (data.shop.minOrderCents > 0 && subtotal < data.shop.minOrderCents)}
            >
              {busy ? "One moment…" : "Continue to payment"}
            </button>
            <p className="gx-fine">You pay on the next page. Prints are only ordered once your payment is confirmed.</p>
          </form>
        </>
      ) : (
        <p>Your cart is empty. Open a photograph and choose a size or a download.</p>
      )}
    </Sheet>
  );
}

function Downloads({
  data,
  client,
  onClose,
  say,
}: { data: Data; client: boolean; onClose: () => void; say: (ok: boolean, t: string) => void }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(data.downloads.unlocked);
  const dl = (q: string) => `/client/download?${data.galleryId ? `g=${data.galleryId}&` : ""}${q}`;
  async function unlock() {
    const r = await unlockDownloadsAction({ galleryId: data.galleryId, pin });
    if (r.ok) {
      setUnlocked(true);
      say(true, r.message ?? "Unlocked.");
    } else say(false, r.error);
  }
  if (!client && data.rules.length)
    return (
      <Sheet title="Download all" onClose={onClose}>
        <ul className="gx-dl">
          {data.rules
            .filter((r) => r.showAll)
            .map((r) => (
              <RuleRow key={r.id} rule={r} data={data} dl={dl} onUnlocked={() => router.refresh()} say={say} />
            ))}
        </ul>
        {data.rules.every((r) => !r.showAll) ? <p>Open a photograph to download it.</p> : null}
      </Sheet>
    );
  return (
    <Sheet title="Downloads" onClose={onClose}>
      {data.downloads.pin && !unlocked ? (
        <div className="gx-form">
          <label>
            Download PIN
            <input inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} autoComplete="off" />
          </label>
          <button type="button" className="gx-btn gx-btn--solid" onClick={() => void unlock()}>
            Unlock downloads
          </button>
        </div>
      ) : (
        <ul className="gx-dl">
          {data.downloads.web
            ? Array.from({ length: data.downloads.webParts }, (_, k) => (
                <li key={`w${k}`}>
                  <span>
                    All photographs, web size
                    {data.downloads.webParts > 1 ? ` (part ${k + 1} of ${data.downloads.webParts})` : ""}
                  </span>
                  <a className="gx-btn" href={dl(`zip=1&size=web&part=${k + 1}`)} download>
                    Download ZIP
                  </a>
                </li>
              ))
            : null}
          {client && data.downloads.full
            ? Array.from({ length: data.downloads.fullParts }, (_, k) => (
                <li key={`f${k}`}>
                  <span>
                    All photographs, full resolution
                    {data.downloads.fullParts > 1 ? ` (part ${k + 1} of ${data.downloads.fullParts})` : ""}
                  </span>
                  <a className="gx-btn" href={dl(`zip=1&size=full&part=${k + 1}`)} download>
                    Download ZIP
                  </a>
                </li>
              ))
            : null}
        </ul>
      )}
    </Sheet>
  );
}

/** One free-download rule: its name and size, its PIN if it has one, its licence to accept, then the ZIP links. */
function RuleRow({
  rule,
  data,
  dl,
  onUnlocked,
  say,
}: {
  rule: Data["rules"][number];
  data: Data;
  dl: (q: string) => string;
  onUnlocked: () => void;
  say: (ok: boolean, t: string) => void;
}) {
  const [pin, setPin] = useState("");
  const [open, setOpen] = useState(rule.unlocked);
  const [ok, setOk] = useState(!rule.printRelease);
  const covered = data.items.filter((i) =>
    rule.albumId ? i.albumId === rule.albumId : !data.rules.some((r) => r.albumId && r.albumId === i.albumId),
  ).length;
  const parts = Math.max(1, Math.ceil(covered / 150));
  return (
    <li className="gx-rule">
      <span>
        <strong>{rule.name}</strong>
        <small>
          {rule.maxPx ? `${rule.maxPx} px` : "Original size"}
          {rule.perVisitor ? ` · up to ${rule.perVisitor} per visit` : ""}
          {rule.watermarked ? " · watermarked" : ""}
        </small>
      </span>
      {!open ? (
        <form
          className="gx-form gx-form--inline"
          onSubmit={async (e) => {
            e.preventDefault();
            const r = await unlockRuleAction({ galleryId: data.galleryId, ruleId: rule.id, pin });
            if (r.ok) {
              setOpen(true);
              onUnlocked();
            } else say(false, r.error);
          }}
        >
          <label>
            PIN
            <input value={pin} onChange={(e) => setPin(e.target.value)} autoComplete="off" />
          </label>
          <button type="submit" className="gx-btn">
            Unlock
          </button>
        </form>
      ) : (
        <>
          {rule.printRelease ? (
            <details className="gx-release">
              <summary>Licence</summary>
              <RichText text={rule.printRelease} />
              <label className="gx-check">
                <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} /> I accept this licence
              </label>
            </details>
          ) : null}
          <span className="gx-rule__links">
            {Array.from({ length: parts }, (_, k) =>
              ok ? (
                <a key={`${rule.id}-${k}`} className="gx-btn" href={dl(`zip=1&rule=${rule.id}&part=${k + 1}`)} download>
                  Download ZIP{parts > 1 ? ` (part ${k + 1} of ${parts})` : ""}
                </a>
              ) : (
                <button key={`${rule.id}-${k}`} type="button" className="gx-btn" disabled>
                  Accept the licence to download
                </button>
              ),
            )}
          </span>
        </>
      )}
    </li>
  );
}

/** One rule for one photograph: unlock with its PIN, accept its licence, then download the resized copy. */
function PhotoRule({
  rule,
  mediaId,
  data,
  say,
}: { rule: Data["rules"][number]; mediaId: string; data: Data; say: (ok: boolean, t: string) => void }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [open, setOpen] = useState(rule.unlocked);
  const [ok, setOk] = useState(!rule.printRelease);
  const href = `/client/download?${data.galleryId ? `g=${data.galleryId}&` : ""}m=${mediaId}&rule=${rule.id}`;
  return (
    <li className="gx-rule">
      <span>
        {rule.name}
        <small>
          {rule.maxPx ? `${rule.maxPx} px` : "original size"}
          {rule.watermarked ? ", watermarked" : ""}
        </small>
      </span>
      {!open ? (
        <form
          className="gx-form gx-form--inline"
          onSubmit={async (e) => {
            e.preventDefault();
            const r = await unlockRuleAction({ galleryId: data.galleryId, ruleId: rule.id, pin });
            if (r.ok) {
              setOpen(true);
              router.refresh();
            } else say(false, r.error);
          }}
        >
          <label>
            PIN
            <input value={pin} onChange={(e) => setPin(e.target.value)} autoComplete="off" />
          </label>
          <button type="submit" className="gx-btn">
            Unlock
          </button>
        </form>
      ) : (
        <>
          {rule.printRelease ? (
            <details className="gx-release">
              <summary>Licence</summary>
              <RichText text={rule.printRelease} />
              <label className="gx-check">
                <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} /> I accept this licence
              </label>
            </details>
          ) : null}
          {ok ? (
            <a className="gx-btn" href={href} download>
              Download
            </a>
          ) : (
            <button type="button" className="gx-btn" disabled>
              Accept the licence first
            </button>
          )}
        </>
      )}
    </li>
  );
}

function UnlockAlbum({
  galleryId,
  album,
  onClose,
  onOpened,
}: { galleryId?: string; album?: Data["albums"][number]; onClose: () => void; onOpened: (id: string) => void }) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  if (!album) return null;
  return (
    <Sheet title={`${album.name} is locked`} onClose={onClose}>
      <form
        className="gx-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const r = await unlockAlbumAction({ galleryId, albumId: album.id, passcode: code });
          if (r.ok) onOpened(album.id);
          else setErr(r.error);
        }}
      >
        <label>
          Album passcode
          <input value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" />
        </label>
        {err ? (
          <p role="alert" className="gx-msg">
            {err}
          </p>
        ) : null}
        <button type="submit" className="gx-btn gx-btn--solid">
          Open album
        </button>
      </form>
    </Sheet>
  );
}
