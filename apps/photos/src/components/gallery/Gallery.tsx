"use client";

import { ProtectedImage, ZoomStage } from "@/components/media";
import { ruleSizeLabel } from "@jerryqiu/db/download-presets";
import {
  Alert,
  ArrowLeftIcon,
  Badge,
  Button,
  Checkbox,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  DataList,
  DataListItem,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DownloadIcon,
  Drawer,
  DrawerContent,
  DrawerTitle,
  EmptyState,
  Field,
  GalleryCard,
  GalleryCover,
  GalleryGrid,
  GalleryItem,
  GalleryMeta,
  GalleryTitle,
  IconButton,
  Input,
  LikeIcon,
  LockIcon,
  NumberInput,
  PageTab,
  PageTabs,
  PlayPauseIcon,
  Progress,
  Rating,
  Segment,
  SegmentedControl,
  Select,
  ShareIcon,
  ShoppingBagIcon,
  SkipNextIcon,
  SlideshowIcon,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Textarea,
} from "@holominimal/ui";
import { useRouter } from "next/navigation";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
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
type Msg = { ok: boolean; text: string; id: number } | null;
type Say = (ok: boolean, text: string) => void;

const usd = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents % 100 ? 2 : 0,
  }).format(cents / 100);
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
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
/** Black or white, whichever reads better on the owner's brand color (WCAG relative luminance). */
function onColour(color: string) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return "#fff";
  const hex = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
  const n = Number.parseInt(hex, 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.179 ? "#000" : "#fff";
}

/**
 * The gallery, as the people it is for see it. A cover and title open it; albums (with sub-albums and locked albums) and
 * "All photos" organise it; the lightbox and the cart sit over the photographs. The client (passcode) also proofs: favorites,
 * ratings, approvals, comments, a selection to send, and the downloads they are owed. Visitors of the public link view and shop.
 */
export function Gallery({ data }: { data: Data }) {
  return (
    <>
      <GalleryView data={data} />
      {data.tracks.length ? <MusicPlayer tracks={data.tracks} autoplay={data.style.autoplay} /> : null}
    </>
  );
}

/** Gallery music: the studio's tracks in order, with play, pause and next. Autoplay waits for the visitor's first tap (browsers require it). */
function MusicPlayer({ tracks, autoplay }: { tracks: Data["tracks"]; autoplay: boolean }) {
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
    <div className="gx-music" role="group" aria-label="Music">
      <audio ref={ref} src={`/g/audio/${t.id}`} preload="none" onEnded={() => setI((n) => (n + 1) % tracks.length)} />
      <IconButton
        size="sm"
        variant="primary"
        className="gx-round"
        onClick={() => setPlaying((p) => !p)}
        aria-pressed={playing}
        aria-label={playing ? "Pause music" : "Play music"}
      >
        <PlayPauseIcon playing={playing} />
      </IconButton>
      <span>
        {t.title}
        {t.artist ? <small> · {t.artist}</small> : null}
      </span>
      {tracks.length > 1 ? (
        <IconButton
          size="sm"
          variant="ghost"
          onClick={() => setI((n) => (n + 1) % tracks.length)}
          aria-label="Next track"
        >
          <SkipNextIcon />
        </IconButton>
      ) : null}
    </div>
  );
}

/** One message at a time: pinned to the foot of the window, or `inline` inside the dialog that is open. */
function Notice({ msg, inline, onDone }: { msg: Msg; inline?: boolean; onDone?: () => void }) {
  useEffect(() => {
    if (!msg || inline || !onDone) return;
    const t = setTimeout(onDone, msg.ok ? 4500 : 8000);
    return () => clearTimeout(t);
  }, [msg, inline, onDone]);
  if (!msg) return null;
  return (
    <Alert
      key={msg.id}
      tone={msg.ok ? "success" : "danger"}
      className="gx-notice"
      data-inline={inline ? "" : undefined}
    >
      {msg.text}
    </Alert>
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
  const [view, setView] = useState<"photos" | "favorites" | "shop" | "about">("photos");
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
  const [confirmSend, setConfirmSend] = useState(false);
  const [lockFor, setLockFor] = useState<string | null>(null);
  const [msg, setMsg] = useState<Msg>(null);
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
  const say: Say = useCallback((ok, text) => setMsg({ ok, text, id: Date.now() }), []);
  const clearMsg = useCallback(() => setMsg(null), []);
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
  const shown = items.filter((i) => inAlbum(i) && (view !== "favorites" || i.favorite));
  const chosen = items.filter((i) => i.favorite).length;
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

  const brand = data.style.primary || data.accent;
  const style = {
    ...(brand ? { ["--gx-brand" as string]: brand, ["--gx-on-brand" as string]: onColour(brand) } : {}),
    ...(data.style.secondary ? { ["--gx-link" as string]: data.style.secondary } : {}),
    ...(data.style.background ? { ["--gx-bg-custom" as string]: data.style.background } : {}),
  } as React.CSSProperties;
  const frame = {
    className: "gx hm-theme",
    style,
    "data-theme": data.theme,
    "data-font": data.style.font,
    "data-brand": brand ? "" : undefined,
    "data-custom-bg": data.style.background ? "" : undefined,
  };

  /* ---- proofing (the client only) ---- */
  async function fav(i: Item) {
    const r = await toggleFavoriteAction(i.mediaId, gid);
    if (r.ok) upd(i.mediaId, { favorite: !i.favorite });
    else say(false, r.error);
  }
  async function rate(i: Item, n: number | null) {
    const r = await rateAction({ galleryId: gid, mediaId: i.mediaId, rating: n });
    if (r.ok) upd(i.mediaId, { rating: n });
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
    setConfirmSend(false);
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
    document.getElementById("gx-main")?.scrollIntoView({ block: "start" });
  }

  if (data.state === "expired" || data.state === "archived")
    return (
      <div {...frame}>
        <section className="gx-gone" aria-labelledby="gx-exp">
          <p className="gx-brand">{data.style.brandLine || data.brand.name}</p>
          <h1 id="gx-exp">{data.title}</h1>
          <p role="status">
            This gallery{" "}
            {data.state === "archived"
              ? "has been archived"
              : `expired${data.expiresAt ? ` on ${data.expiresAt}` : ""}`}
            .{client ? " Your photographs are safe: extend access to bring it back." : ""}
          </p>
          {client ? (
            <Button size="lg" onClick={reactivate}>
              Extend access
            </Button>
          ) : null}
          <Notice msg={msg} inline />
        </section>
      </div>
    );

  const crop = data.layout === "grid" || data.layout === "mosaic";
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
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return; // the share sheet was dismissed
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
  function goPhotos() {
    setView("photos");
    setAlbum("");
  }
  const photosRoot = view === "photos" && !album && hasAlbums && sty.albumView === "cards";
  const showGrid = !photosRoot && view !== "shop" && view !== "about";
  const dialogOpen = open !== null || cartOpen || dlOpen;

  if (stage === "pending") return <div {...frame} />;
  if (stage === "intro" && heroItem)
    return (
      <div {...frame}>
        <header className="gx-hero" data-header={sty.header}>
          <div className="gx-hero__img">
            <ProtectedImage asset={asset({ ...heroItem })} alt="" fill fit="cover" priority sizes="100vw" />
          </div>
          <div className="gx-hero__text">
            <p className="gx-brand">{sty.brandLine || data.brand.name}</p>
            <h1>{data.title}</h1>
            {data.welcome ? <p className="gx-welcome">{data.welcome}</p> : null}
            <Button size="lg" onClick={enter}>
              View Gallery
            </Button>
          </div>
        </header>
      </div>
    );

  const heading = view === "favorites" ? "Favorites" : current ? current.name : data.title;
  const back =
    view === "photos" && (current || album === "all-photos")
      ? current?.parentId
        ? `Back to ${parent?.name}`
        : hasAlbums && sty.albumView === "cards"
          ? "All albums"
          : "All photos"
      : null;
  const albumValue = !album || album === "all-photos" ? "all" : (current?.parentId ?? album);

  return (
    <div {...frame} data-layout={data.layout} data-density={data.density} data-gap={sty.gap} data-corners={sty.corners}>
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
        <a className="gx-top__brand" href={data.slug ? `/g/${data.slug}` : "#"} onClick={goPhotos}>
          {sty.brandLine || data.brand.name}
        </a>
        <PageTabs aria-label="Gallery">
          <PageTab asChild current={view === "photos"}>
            <button type="button" onClick={goPhotos}>
              Photos
            </button>
          </PageTab>
          {shopOn ? (
            <PageTab asChild current={view === "shop"}>
              <button type="button" onClick={() => setView("shop")}>
                Store
              </button>
            </PageTab>
          ) : null}
          {client ? (
            <PageTab asChild current={view === "favorites"}>
              <button type="button" onClick={() => setView("favorites")}>
                Favorites <span className="gx-count-badge">{chosen}</span>
              </button>
            </PageTab>
          ) : null}
          <PageTab asChild current={view === "about"}>
            <button type="button" onClick={() => setView("about")}>
              About
            </button>
          </PageTab>
        </PageTabs>
        <div className="gx-top__right">
          {!client && data.slug ? (
            <Button variant="ghost" size="sm" onClick={() => setSignIn(true)}>
              Client sign-in
            </Button>
          ) : null}
          {client ? (
            <form action={leaveGalleryAction}>
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          ) : null}
          {shopOn ? (
            <IconButton
              variant="ghost"
              className="gx-cart-btn"
              onClick={() => setCartOpen(true)}
              aria-label={`Cart, ${plural(cartCount, "item")}`}
            >
              <ShoppingBagIcon />
              {cartCount ? <Badge aria-hidden="true">{cartCount}</Badge> : null}
            </IconButton>
          ) : null}
        </div>
      </header>

      <main id="gx-main" className="gx-main" tabIndex={-1}>
        {data.state === "expiring" && client ? (
          <Alert tone="warning" style={{ marginBottom: "var(--hm-space-5)" }}>
            This gallery expires on {data.expiresAt}.{" "}
            <Button variant="ghost" size="sm" onClick={reactivate}>
              Extend access
            </Button>
          </Alert>
        ) : null}

        {view === "shop" && shopOn ? (
          <ShopView data={data} onAdd={addToCart} onBrowse={goPhotos} />
        ) : view === "about" ? (
          <About data={data} />
        ) : (
          <>
            <div className="gx-head">
              <div className="gx-head__text">
                {back ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gx-back"
                    onClick={() => setAlbum(current?.parentId ?? "")}
                  >
                    <ArrowLeftIcon /> {back}
                  </Button>
                ) : null}
                <h1>{heading}</h1>
                <p className="gx-fine">
                  {photosRoot ? plural(top.length, "album") : plural(shown.length, "photograph")}
                </p>
                {view === "photos" && !current && data.welcome && !album ? (
                  <p className="gx-welcome">{data.welcome}</p>
                ) : null}
              </div>
              <div className="gx-actions" role="toolbar" aria-label="Gallery actions">
                {sty.allowSharing && data.slug ? (
                  <Button variant="secondary" size="sm" onClick={() => void share()}>
                    <ShareIcon /> Share
                  </Button>
                ) : null}
                {canDownload && sty.showDownloadAll ? (
                  <Button variant="secondary" size="sm" onClick={() => setDlOpen(true)}>
                    <DownloadIcon /> Download all
                  </Button>
                ) : null}
                {shown.length > 1 && showGrid ? (
                  <Button variant="secondary" size="sm" onClick={() => setOpen(0)}>
                    <SlideshowIcon /> Slideshow
                  </Button>
                ) : null}
              </div>
            </div>
            {hasAlbums && sty.albumView === "tabs" && view === "photos" ? (
              <SegmentedControl
                className="gx-albums"
                aria-label="Albums"
                value={albumValue}
                onValueChange={(v) => (v === "all" ? setAlbum("") : pickAlbum(v))}
              >
                {sty.hideAllPhotos ? null : (
                  <Segment value="all">All photos {sty.hideAlbumCount ? null : <small>{items.length}</small>}</Segment>
                )}
                {top.map((a) => (
                  <Segment key={a.id} value={a.id}>
                    {a.locked ? <LockIcon size={14} /> : null} {a.name}{" "}
                    {sty.hideAlbumCount ? null : (
                      <small>{a.closed ? "locked" : a.count + kids(a.id).reduce((n, k) => n + k.count, 0)}</small>
                    )}
                  </Segment>
                ))}
              </SegmentedControl>
            ) : null}
            {subs.length && view === "photos" ? (
              <SegmentedControl
                className="gx-albums"
                aria-label={`In ${parent?.name}`}
                value={album}
                onValueChange={pickAlbum}
              >
                <Segment value={parent?.id ?? ""}>All of {parent?.name}</Segment>
                {subs.map((sb) => (
                  <Segment key={sb.id} value={sb.id}>
                    {sb.locked ? <LockIcon size={14} /> : null} {sb.name}{" "}
                    {sty.hideAlbumCount ? null : <small>{sb.closed ? "locked" : sb.count}</small>}
                  </Segment>
                ))}
              </SegmentedControl>
            ) : null}
            {photosRoot ? (
              <AlbumCards data={data} items={items} onPick={pickAlbum} onAll={() => setAlbum("all-photos")} />
            ) : null}
            {showGrid ? (
              <>
                {current?.description ? <p className="gx-album-note">{current.description}</p> : null}
                {shown.length ? (
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
                        {client || shopOn ? (
                          <div className="gx-tile">
                            {client ? (
                              <IconButton
                                variant="secondary"
                                className="gx-fav gx-round"
                                aria-pressed={i.favorite}
                                aria-label={`${i.favorite ? "Remove" : "Add"} ${i.filename} ${i.favorite ? "from" : "to"} favorites`}
                                disabled={sent}
                                onClick={() => void fav(i)}
                              >
                                <LikeIcon liked={i.favorite} />
                              </IconButton>
                            ) : null}
                            {shopOn ? (
                              <Button
                                variant="secondary"
                                size="sm"
                                shape="pill"
                                aria-label={`Buy ${i.filename}`}
                                onClick={() => setOpen(n)}
                              >
                                Buy
                              </Button>
                            ) : null}
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState>
                    {view === "favorites"
                      ? "No favorites yet. Tap the heart on a photograph to keep it here."
                      : "No photographs here yet."}
                  </EmptyState>
                )}
              </>
            ) : null}
            {client && !photosRoot ? (
              <section className="gx-select" aria-label="Your selection">
                <p role="status">
                  {sent
                    ? `Your selection of ${plural(chosen, "photograph")} was sent.`
                    : `${plural(chosen, "favorite")} chosen${data.limit ? ` of ${data.limit}` : ""}.`}
                </p>
                {data.limit && !sent ? (
                  <Progress value={chosen} max={data.limit} size="sm" aria-label="Favorites chosen" />
                ) : null}
                {!sent ? (
                  <Button disabled={!chosen} onClick={() => setConfirmSend(true)}>
                    Send my selection
                  </Button>
                ) : null}
              </section>
            ) : null}
          </>
        )}
      </main>

      <footer className="gx-foot">
        {sty.footer ? <p>{sty.footer}</p> : <span />}
        <nav aria-label="Terms and rules">
          <Button asChild variant="ghost" size="sm">
            <a href="/terms">Terms of Use</a>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <a href="/privacy">Privacy Policy</a>
          </Button>
          {sty.introMessage ? (
            <Button variant="ghost" size="sm" onClick={() => setRulesOpen(true)}>
              {sty.introHeadline || "Rules"}
            </Button>
          ) : null}
        </nav>
      </footer>

      {dialogOpen ? null : <Notice msg={msg} onDone={clearMsg} />}

      {open !== null && shown[open] ? (
        <Lightbox
          data={data}
          client={client}
          shopOn={shopOn}
          items={shown}
          start={open}
          sent={sent}
          cart={cart}
          msg={msg}
          onClose={() => {
            setOpen(null);
            setMsg(null);
          }}
          onAdd={addToCart}
          onOpenCart={() => {
            setOpen(null);
            setMsg(null);
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
          onBrowse={() => {
            setCartOpen(false);
            goPhotos();
          }}
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
      {dlOpen ? (
        <Downloads
          data={data}
          client={client}
          msg={msg}
          onClose={() => {
            setDlOpen(false);
            setMsg(null);
          }}
          say={say}
        />
      ) : null}
      {rulesOpen ? (
        <Modal title={sty.introHeadline || "Rules"} onClose={() => setRulesOpen(false)}>
          <RichText text={sty.introMessage} />
          <DialogFooter>
            <Button onClick={() => setRulesOpen(false)}>Continue</Button>
          </DialogFooter>
        </Modal>
      ) : null}
      {confirmSend ? (
        <Modal title="Send your selection?" onClose={() => setConfirmSend(false)} size="sm">
          <DialogDescription>
            {plural(chosen, "favorite")} will go to {data.brand.name || "your photographer"}. After sending you can't
            change them unless they reopen your selection.
          </DialogDescription>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmSend(false)}>
              Keep choosing
            </Button>
            <Button onClick={() => void submitSelection()}>Send selection</Button>
          </DialogFooter>
        </Modal>
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

/** A Holominimal dialog that is open while it is mounted. */
function Modal({
  title,
  onClose,
  children,
  size = "md",
}: { title: string; onClose: () => void; children: ReactNode; size?: "sm" | "md" | "lg" }) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size={size}>
        <div className="gx-dialog-head">
          <DialogTitle>{title}</DialogTitle>
          <IconButton variant="ghost" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </div>
        <div className="gx-dialog-body">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

function About({ data }: { data: Data }) {
  const b = data.brand;
  const ig = b.instagram?.replace(/^@/, "");
  const rows: [string, ReactNode][] = [];
  if (b.website)
    rows.push([
      "Website",
      <a key="w" href={`https://${b.website.replace(/^https?:\/\//, "")}`}>
        {b.website}
      </a>,
    ]);
  if (ig)
    rows.push([
      "Instagram",
      <a key="i" href={`https://www.instagram.com/${ig}`}>
        @{ig}
      </a>,
    ]);
  if (b.email)
    rows.push([
      "Email",
      <a key="e" href={`mailto:${b.email}`}>
        {b.email}
      </a>,
    ]);
  if (b.phone)
    rows.push([
      "Phone",
      <a key="p" href={`tel:${b.phone.replace(/[^\d+]/g, "")}`}>
        {b.phone}
      </a>,
    ]);
  if (b.address) rows.push(["Studio", b.address]);
  return (
    <section className="gx-page" aria-labelledby="gx-about-h">
      <h1 id="gx-about-h">{b.name}</h1>
      {data.style.aboutText ? <RichText text={data.style.aboutText} /> : null}
      {rows.length ? (
        <dl className="gx-contact">
          {rows.map(([k, v]) => (
            <div key={k} style={{ display: "contents" }}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}

function SignIn({ slug, onClose, onDone }: { slug: string; onClose: () => void; onDone: () => void }) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Modal title="Client sign-in" onClose={onClose} size="sm">
      <DialogDescription>
        If this is your gallery, enter the passcode you were given. It lets you pick favorites, rate, comment and
        download what is yours.
      </DialogDescription>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const r = await enterGalleryAction({ slug, passcode: code });
          setBusy(false);
          if (r.ok) onDone();
          else setErr(r.error);
        }}
      >
        <Field label="Passcode" error={err || undefined}>
          <Input value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" required />
        </Field>
        <DialogFooter>
          <Button type="submit" loading={busy}>
            Sign in
          </Button>
        </DialogFooter>
      </form>
    </Modal>
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
    <GalleryGrid aria-label="Albums" className="gx-cards">
      <GalleryItem index={0}>
        <GalleryCard asChild>
          <button type="button" onClick={onAll}>
            <GalleryCover ratio="4 / 5">
              {items[0] ? <ProtectedImage asset={asset(items[0])} alt="" fill fit="cover" /> : undefined}
            </GalleryCover>
            <GalleryTitle>
              All photos <GalleryMeta>{items.length}</GalleryMeta>
            </GalleryTitle>
          </button>
        </GalleryCard>
      </GalleryItem>
      {top.map((a, n) => {
        const c = cover(a);
        return (
          <GalleryItem key={a.id} index={n + 1}>
            <GalleryCard asChild>
              <button type="button" onClick={() => onPick(a.id)} data-locked={a.closed || undefined}>
                <GalleryCover ratio="4 / 5" empty={<LockIcon size="lg" title="Locked" />}>
                  {c ? <ProtectedImage asset={asset(c)} alt="" fill fit="cover" /> : undefined}
                </GalleryCover>
                <GalleryTitle>
                  {a.name} <GalleryMeta>{a.closed ? "locked" : a.count}</GalleryMeta>
                </GalleryTitle>
                {a.description ? <GalleryMeta>{a.description}</GalleryMeta> : null}
              </button>
            </GalleryCard>
          </GalleryItem>
        );
      })}
    </GalleryGrid>
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
    ["Mounted prints", ["mounted"]],
    ["Framed prints", ["framed"]],
    ["Canvas", ["canvas"]],
    ["Metal prints", ["metal"]],
    ["Cards", ["card"]],
    ["Albums", ["album"]],
  ];
  const sell = (k: string) => (DIGITAL.includes(k) ? data.shop.sellDigital : data.shop.sellPrints);
  const any = data.shop.products.some((p) => sell(p.kind));
  return (
    <section className="gx-page" aria-labelledby="gx-shop-h">
      <div>
        <h1 id="gx-shop-h">Store</h1>
        <p className="gx-lede">Open a photograph and choose a print size or a download. {data.shop.note}</p>
      </div>
      <div>
        <Button size="lg" onClick={onBrowse}>
          Choose photographs
        </Button>
      </div>
      {any ? null : <EmptyState>Nothing is for sale here yet.</EmptyState>}
      {groups.map(([name, kinds]) => {
        const list = data.shop.products.filter((p) => kinds.includes(p.kind) && sell(p.kind));
        if (!list.length) return null;
        return (
          <section key={name} aria-label={name}>
            <h2>{name}</h2>
            <DataList>
              {list.map((p) => (
                <DataListItem
                  key={p.id}
                  description={p.description || undefined}
                  meta={
                    <span className="gx-price">
                      {usd(p.priceCents)} {p.sample ? <Badge tone="warning">SAMPLE</Badge> : null}
                    </span>
                  }
                  actions={
                    p.kind === "digital-all" ? (
                      <Button variant="secondary" size="sm" onClick={() => onAdd(p.id, null)}>
                        Add whole gallery
                      </Button>
                    ) : undefined
                  }
                >
                  {p.name}
                </DataListItem>
              ))}
            </DataList>
          </section>
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
  msg,
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
  msg: Msg;
  onClose: () => void;
  onAdd: (productId: string, mediaId: string | null) => void;
  onOpenCart: () => void;
  fav: (i: Item) => Promise<void>;
  rate: (i: Item, n: number | null) => Promise<void>;
  decide: (i: Item, d: "approved" | "rejected") => Promise<void>;
  say: Say;
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [i, setI] = useState(start);
  const [play, setPlay] = useState(false);
  const buyTab = shopOn || (!client && data.rules.length > 0);
  const [panel, setPanel] = useState<"buy" | "proof">(buyTab ? "buy" : "proof");
  const hasPanel = buyTab || client;
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
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, [role=radiogroup], [role=tablist]")) return;
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
  const cartCount = cart.reduce((n, l) => n + l.qty, 0);
  async function send() {
    const r = await commentAction({ galleryId: data.galleryId, mediaId: it.mediaId, body: draft });
    if (r.ok) {
      const c = { body: draft.trim(), author: "client", at: new Date().toISOString().slice(0, 10) };
      setItems((all) => all.map((x) => (x.mediaId === it.mediaId ? { ...x, comments: [...x.comments, c] } : x)));
      setDraft("");
    } else say(false, r.error);
  }
  const web = data.downloads.web && data.downloads.unlocked;
  const dl = (size: string) =>
    `/client/download?${data.galleryId ? `g=${data.galleryId}&` : ""}m=${it.mediaId}&size=${size}`;
  const prev = () => setI((x) => (x - 1 + items.length) % items.length);
  const next = () => setI((x) => (x + 1) % items.length);
  return (
    <dialog ref={ref} className="gx-lb hm-theme" data-hm-scheme="dark" aria-label="Photograph" onClose={onClose}>
      <div className="gx-lb__bar">
        <span className="gx-lb__count" aria-live="polite">
          {i + 1} / {items.length}
          <span className="gx-lb__name">{it.filename}</span>
        </span>
        <div>
          {items.length > 1 ? (
            <Button variant="secondary" size="sm" aria-pressed={play} onClick={() => setPlay((p) => !p)}>
              <PlayPauseIcon playing={play} /> {play ? "Pause" : "Play"}
            </Button>
          ) : null}
          <Button variant="secondary" size="sm" onClick={onClose}>
            <CloseIcon /> Close
          </Button>
        </div>
      </div>
      <div className="gx-lb__body" data-panel={hasPanel ? "" : undefined}>
        <div className="gx-lb__stage">
          {items.length > 1 ? (
            <IconButton
              variant="secondary"
              size="lg"
              className="gx-round"
              aria-label="Previous photograph"
              onClick={prev}
            >
              <ChevronLeftIcon />
            </IconButton>
          ) : (
            <span />
          )}
          <div className="gx-lb__photo">
            <ZoomStage key={it.mediaId}>
              <ProtectedImage asset={asset(it)} alt={it.filename} fit="contain" fill priority full />
            </ZoomStage>
          </div>
          {items.length > 1 ? (
            <IconButton variant="secondary" size="lg" className="gx-round" aria-label="Next photograph" onClick={next}>
              <ChevronRightIcon />
            </IconButton>
          ) : (
            <span />
          )}
        </div>
        {hasPanel ? (
          <aside className="gx-lb__panel" aria-label="Photograph options">
            <Notice msg={msg} inline />
            <Tabs value={panel} onValueChange={(v) => setPanel(v as "buy" | "proof")}>
              {buyTab && client ? (
                <TabList aria-label="Options" variant="pill">
                  <Tab value="buy">{shopOn ? "Buy" : "Download"}</Tab>
                  <Tab value="proof">Proof</Tab>
                </TabList>
              ) : null}
              {buyTab ? (
                <TabPanel value="buy">
                  {shopOn && options.length ? (
                    <DataList>
                      {options.map((p) => {
                        const ok = fits(p, it);
                        return (
                          <DataListItem
                            key={p.id}
                            description={!ok ? "Too small for this size" : undefined}
                            meta={
                              <span className="gx-price">
                                {usd(p.priceCents)} {p.sample ? <Badge tone="warning">SAMPLE</Badge> : null}
                              </span>
                            }
                            actions={
                              <Button
                                variant="secondary"
                                size="sm"
                                disabled={!ok || (inCart(p.id) && DIGITAL.includes(p.kind))}
                                onClick={() => onAdd(p.id, it.mediaId)}
                              >
                                {inCart(p.id) ? (DIGITAL.includes(p.kind) ? "In cart" : "Add another") : "Add"}
                              </Button>
                            }
                          >
                            {p.name}
                          </DataListItem>
                        );
                      })}
                    </DataList>
                  ) : shopOn ? (
                    <EmptyState>Nothing is for sale here yet.</EmptyState>
                  ) : null}
                  {shopOn && cart.length ? (
                    <Button onClick={onOpenCart}>
                      <ShoppingBagIcon /> Open cart ({cartCount})
                    </Button>
                  ) : null}
                  {!client && freeRules.length ? (
                    <section aria-labelledby="gx-free-h" className="gx-rule">
                      <h3 id="gx-free-h" className="gx-fine">
                        Free downloads
                      </h3>
                      <ul className="gx-rules">
                        {freeRules.map((r) => (
                          <PhotoRule key={r.id} rule={r} mediaId={it.mediaId} data={data} />
                        ))}
                      </ul>
                    </section>
                  ) : web && !client ? (
                    <Button asChild variant="secondary">
                      <a href={dl("web")} download>
                        <DownloadIcon /> Free web-size copy
                      </a>
                    </Button>
                  ) : null}
                </TabPanel>
              ) : null}
              {client ? (
                <TabPanel value="proof">
                  <div className="gx-proof-row">
                    <Button
                      variant={it.favorite ? "primary" : "secondary"}
                      aria-pressed={it.favorite}
                      disabled={sent}
                      onClick={() => void fav(it)}
                      aria-label={`${it.favorite ? "Remove" : "Add"} ${it.filename} ${it.favorite ? "from" : "to"} favorites`}
                    >
                      <LikeIcon liked={it.favorite} /> Favorite
                    </Button>
                  </div>
                  {data.allowRatings ? (
                    <div className="gx-proof-row">
                      <Rating
                        aria-label={`Rate ${it.filename}`}
                        value={it.rating ?? 0}
                        onValueChange={(n) => void rate(it, n)}
                      />
                      {it.rating ? (
                        <Button variant="ghost" size="sm" onClick={() => void rate(it, null)}>
                          Clear rating
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="gx-proof-row" role="group" aria-label="Approval">
                    <Button
                      variant={it.decision === "approved" ? "primary" : "secondary"}
                      size="sm"
                      aria-pressed={it.decision === "approved"}
                      disabled={sent}
                      onClick={() => void decide(it, "approved")}
                      aria-label={`Approve ${it.filename}`}
                    >
                      Approve
                    </Button>
                    <Button
                      variant={it.decision === "rejected" ? "primary" : "secondary"}
                      size="sm"
                      aria-pressed={it.decision === "rejected"}
                      disabled={sent}
                      onClick={() => void decide(it, "rejected")}
                      aria-label={`Not for me: ${it.filename}`}
                    >
                      Not this
                    </Button>
                  </div>
                  {data.allowComments ? (
                    <form
                      className="gx-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void send();
                      }}
                    >
                      {it.comments.length ? (
                        <ul className="gx-comments" aria-label="Comments">
                          {it.comments.map((c, k) => (
                            <li key={`${c.at}-${k}`}>
                              <small>
                                {c.author === "client" ? "You" : "Photographer"} · {c.at}
                              </small>
                              <span>{c.body}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      <Field label="Your comment">
                        <Textarea
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          maxLength={1000}
                          rows={2}
                          autoGrow
                        />
                      </Field>
                      <div>
                        <Button type="submit" variant="secondary" size="sm" disabled={!draft.trim()}>
                          Add comment
                        </Button>
                      </div>
                    </form>
                  ) : null}
                  {(data.downloads.full && data.downloads.unlocked) || web ? (
                    <div className="gx-proof-row gx-sizes" role="group" aria-label="Download this photograph">
                      {SIZE_CHOICES.filter((c) =>
                        c.tier === "full" ? data.downloads.full && data.downloads.unlocked : web,
                      ).map((c) => (
                        <Button key={c.id} asChild variant="secondary" size="sm">
                          <a href={dl(c.id)} download>
                            <DownloadIcon /> {c.label}
                          </a>
                        </Button>
                      ))}
                    </div>
                  ) : null}
                </TabPanel>
              ) : null}
            </Tabs>
          </aside>
        ) : null}
      </div>
    </dialog>
  );
}

/** The sizes a client can download, in the words they see. Original and high resolution need the full-size policy. */
const SIZE_CHOICES = [
  { id: "full", label: "Full size (original)", tier: "full" },
  { id: "high", label: "High resolution", tier: "full" },
  { id: "low", label: "Low resolution", tier: "web" },
  { id: "social", label: "Social media (1920 px)", tier: "web" },
  { id: "preview", label: "Preview (watermarked)", tier: "web" },
] as const;

const COUNTRY: Record<string, string> = { US: "United States", CA: "Canada", MX: "Mexico" };

function Cart({
  data,
  lines,
  subtotal,
  printQty,
  onClose,
  onBrowse,
  onChange,
  onDone,
}: {
  data: Data;
  lines: (Line & { product?: Product; item?: Item })[];
  subtotal: number;
  printQty: number;
  onClose: () => void;
  onBrowse: () => void;
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
  const short = data.shop.minOrderCents > 0 && subtotal < data.shop.minOrderCents;
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
    if (r.ok) {
      onDone();
      location.assign(r.url);
    } else {
      setBusy(false);
      setErr(r.error);
    }
  }
  return (
    <Drawer open onOpenChange={(o) => !o && onClose()}>
      <DrawerContent side="right">
        <div className="gx-dialog-head">
          <DrawerTitle>Your cart</DrawerTitle>
          <IconButton variant="ghost" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </div>
        <div className="gx-dialog-body">
          {lines.length ? (
            <>
              <DataList aria-label="In your cart">
                {lines.map((l) => (
                  <DataListItem
                    key={`${l.productId}-${l.mediaId}`}
                    description={l.mediaId ? (l.item?.filename ?? "photograph") : "Whole gallery"}
                    meta={<span className="gx-price">{usd((l.product?.priceCents ?? 0) * l.qty)}</span>}
                    actions={
                      <>
                        {DIGITAL.includes(l.product?.kind ?? "") ? null : (
                          <NumberInput
                            className="gx-qty"
                            aria-label={`Quantity of ${l.product?.name}`}
                            value={l.qty}
                            min={1}
                            max={50}
                            onValueChange={(n) => n && onChange(l.productId, l.mediaId, n)}
                          />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Remove ${l.product?.name}`}
                          onClick={() => onChange(l.productId, l.mediaId, 0)}
                        >
                          Remove
                        </Button>
                      </>
                    }
                  >
                    {l.product?.name}
                  </DataListItem>
                ))}
              </DataList>
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
                <Field label="Your name">
                  <Input value={f.name} onChange={set("name")} autoComplete="name" required />
                </Field>
                <Field label="Email" hint="Your receipt and downloads go here.">
                  <Input type="email" value={f.email} onChange={set("email")} autoComplete="email" required />
                </Field>
                {printQty ? (
                  <fieldset>
                    <legend>Ship prints to</legend>
                    <Field label="Address">
                      <Input value={f.line1} onChange={set("line1")} autoComplete="address-line1" required />
                    </Field>
                    <Field label="Apartment, suite (optional)">
                      <Input value={f.line2} onChange={set("line2")} autoComplete="address-line2" />
                    </Field>
                    <div className="gx-row3">
                      <Field label="City">
                        <Input value={f.city} onChange={set("city")} autoComplete="address-level2" required />
                      </Field>
                      <Field label="State">
                        <Input value={f.region} onChange={set("region")} autoComplete="address-level1" required />
                      </Field>
                      <Field label="ZIP">
                        <Input value={f.postalCode} onChange={set("postalCode")} autoComplete="postal-code" required />
                      </Field>
                    </div>
                    {data.shop.shipCountries.length > 1 ? (
                      <Field label="Country">
                        <Select
                          value={f.country}
                          onValueChange={(v) => setF((x) => ({ ...x, country: v }))}
                          options={data.shop.shipCountries.map((c) => ({ value: c, label: COUNTRY[c] ?? c }))}
                        />
                      </Field>
                    ) : null}
                  </fieldset>
                ) : null}
                {err ? (
                  <Alert tone="danger" role="alert">
                    {err}
                  </Alert>
                ) : null}
                {short ? (
                  <Alert tone="warning" role="status">
                    The smallest order here is {usd(data.shop.minOrderCents)}. Add{" "}
                    {usd(data.shop.minOrderCents - subtotal)} more to continue.
                  </Alert>
                ) : null}
                {data.shop.checkoutMessage ? <p className="gx-fine">{data.shop.checkoutMessage}</p> : null}
                <Button type="submit" size="lg" loading={busy} disabled={busy || short}>
                  Continue to payment
                </Button>
                <p className="gx-fine">
                  You pay on the next page. Prints are only ordered once your payment is confirmed.
                </p>
              </form>
            </>
          ) : (
            <>
              <EmptyState>Your cart is empty. Open a photograph and choose a size or a download.</EmptyState>
              <Button variant="secondary" onClick={onBrowse}>
                Browse photographs
              </Button>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function Downloads({
  data,
  client,
  msg,
  onClose,
  say,
}: { data: Data; client: boolean; msg: Msg; onClose: () => void; say: Say }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [pinErr, setPinErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [unlocked, setUnlocked] = useState(data.downloads.unlocked);
  const dl = (q: string) => `/client/download?${data.galleryId ? `g=${data.galleryId}&` : ""}${q}`;
  async function unlock() {
    setBusy(true);
    setPinErr("");
    const r = await unlockDownloadsAction({ galleryId: data.galleryId, pin });
    setBusy(false);
    if (r.ok) {
      setUnlocked(true);
      say(true, r.message ?? "Unlocked.");
    } else setPinErr(r.error);
  }
  if (!client && data.rules.length) {
    const all = data.rules.filter((r) => r.showAll);
    return (
      <Modal title="Download all" onClose={onClose}>
        <Notice msg={msg} inline />
        <ul className="gx-rules">
          {all.map((r) => (
            <RuleRow key={r.id} rule={r} data={data} dl={dl} onUnlocked={() => router.refresh()} />
          ))}
        </ul>
        {all.length ? null : <EmptyState>Open a photograph to download it.</EmptyState>}
      </Modal>
    );
  }
  const zip = (size: string, parts: number, label: string) =>
    Array.from({ length: parts }, (_, k) => (
      <DataListItem
        key={`${size}${k}`}
        actions={
          <Button asChild variant="secondary" size="sm">
            <a href={dl(`zip=1&size=${size}&part=${k + 1}`)} download>
              <DownloadIcon /> Download ZIP
            </a>
          </Button>
        }
        description={parts > 1 ? `Part ${k + 1} of ${parts}` : undefined}
      >
        {label}
      </DataListItem>
    ));
  return (
    <Modal title="Downloads" onClose={onClose}>
      <Notice msg={msg} inline />
      {data.downloads.pin && !unlocked ? (
        <form
          className="gx-form"
          onSubmit={(e) => {
            e.preventDefault();
            void unlock();
          }}
        >
          <DialogDescription>Enter the download PIN your photographer gave you.</DialogDescription>
          <Field label="Download PIN" error={pinErr || undefined}>
            <Input inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} autoComplete="off" />
          </Field>
          <DialogFooter>
            <Button type="submit" loading={busy}>
              Unlock downloads
            </Button>
          </DialogFooter>
        </form>
      ) : (
        <DataList>
          {SIZE_CHOICES.filter((c) => (c.tier === "full" ? client && data.downloads.full : data.downloads.web)).map(
            (c) =>
              zip(
                c.id,
                c.tier === "full" ? data.downloads.fullParts : data.downloads.webParts,
                `All photographs: ${c.label.toLowerCase().replace("full size (original)", "full size, original")}`,
              ),
          )}
        </DataList>
      )}
    </Modal>
  );
}

/** A rule's license, when it has one: read it, then tick to accept. */
function License({ text, ok, onOk }: { text: string; ok: boolean; onOk: (v: boolean) => void }) {
  return (
    <details className="gx-fine">
      <summary>License</summary>
      <RichText text={text} />
      <Checkbox label="I accept this licence" checked={ok} onChange={(e) => onOk(e.target.checked)} />
    </details>
  );
}

/** One free-download rule: its name and size, its PIN if it has one, its license to accept, then the ZIP links. */
function RuleRow({
  rule,
  data,
  dl,
  onUnlocked,
}: {
  rule: Data["rules"][number];
  data: Data;
  dl: (q: string) => string;
  onUnlocked: () => void;
}) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(rule.unlocked);
  const [ok, setOk] = useState(!rule.printRelease);
  const covered = data.items.filter((i) =>
    rule.albumId ? i.albumId === rule.albumId : !data.rules.some((r) => r.albumId && r.albumId === i.albumId),
  ).length;
  const parts = Math.max(1, Math.ceil(covered / 150));
  return (
    <li className="gx-rule">
      <div>
        <strong>{rule.name}</strong>
        <p className="gx-fine">
          {ruleSizeLabel(rule)}
          {rule.perVisitor ? ` · up to ${rule.perVisitor} per visit` : ""}
          {rule.watermarked ? " · watermarked" : ""}
        </p>
      </div>
      {!open ? (
        <PinForm
          onSubmit={async (p) => {
            const r = await unlockRuleAction({ galleryId: data.galleryId, ruleId: rule.id, pin: p });
            if (r.ok) {
              setOpen(true);
              onUnlocked();
            } else setErr(r.error);
          }}
          pin={pin}
          setPin={setPin}
          err={err}
        />
      ) : (
        <>
          {rule.printRelease ? <License text={rule.printRelease} ok={ok} onOk={setOk} /> : null}
          <span className="gx-rule__links">
            {Array.from({ length: parts }, (_, k) =>
              ok ? (
                <Button asChild key={`${rule.id}-${k}`} variant="secondary" size="sm">
                  <a href={dl(`zip=1&rule=${rule.id}&part=${k + 1}`)} download>
                    <DownloadIcon /> Download ZIP{parts > 1 ? ` (part ${k + 1} of ${parts})` : ""}
                  </a>
                </Button>
              ) : (
                <Button key={`${rule.id}-${k}`} variant="secondary" size="sm" disabled>
                  Accept the license to download
                </Button>
              ),
            )}
          </span>
        </>
      )}
    </li>
  );
}

function PinForm({
  pin,
  setPin,
  err,
  onSubmit,
}: { pin: string; setPin: (v: string) => void; err: string; onSubmit: (pin: string) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="gx-inline"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        await onSubmit(pin);
        setBusy(false);
      }}
    >
      <Field label="PIN" error={err || undefined}>
        <Input value={pin} onChange={(e) => setPin(e.target.value)} autoComplete="off" />
      </Field>
      <Button type="submit" variant="secondary" loading={busy}>
        Unlock
      </Button>
    </form>
  );
}

/** One rule for one photograph: unlock with its PIN, accept its license, then download the resized copy. */
function PhotoRule({ rule, mediaId, data }: { rule: Data["rules"][number]; mediaId: string; data: Data }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(rule.unlocked);
  const [ok, setOk] = useState(!rule.printRelease);
  const href = `/client/download?${data.galleryId ? `g=${data.galleryId}&` : ""}m=${mediaId}&rule=${rule.id}`;
  return (
    <li className="gx-rule">
      <div>
        {rule.name}
        <p className="gx-fine">
          {ruleSizeLabel(rule).toLowerCase()}
          {rule.watermarked ? ", watermarked" : ""}
        </p>
      </div>
      {!open ? (
        <PinForm
          pin={pin}
          setPin={setPin}
          err={err}
          onSubmit={async (p) => {
            const r = await unlockRuleAction({ galleryId: data.galleryId, ruleId: rule.id, pin: p });
            if (r.ok) {
              setOpen(true);
              router.refresh();
            } else setErr(r.error);
          }}
        />
      ) : (
        <>
          {rule.printRelease ? <License text={rule.printRelease} ok={ok} onOk={setOk} /> : null}
          {ok ? (
            <Button asChild variant="secondary" size="sm">
              <a href={href} download>
                <DownloadIcon /> Download
              </a>
            </Button>
          ) : (
            <Button variant="secondary" size="sm" disabled>
              Accept the license first
            </Button>
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
  const [busy, setBusy] = useState(false);
  if (!album) return null;
  return (
    <Modal title={`${album.name} is locked`} onClose={onClose} size="sm">
      <DialogDescription>This album has its own passcode. Your photographer can give it to you.</DialogDescription>
      <form
        className="gx-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const r = await unlockAlbumAction({ galleryId, albumId: album.id, passcode: code });
          setBusy(false);
          if (r.ok) onOpened(album.id);
          else setErr(r.error);
        }}
      >
        <Field label="Album passcode" error={err || undefined}>
          <Input value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" required />
        </Field>
        <DialogFooter>
          <Button type="submit" loading={busy}>
            Open album
          </Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}
