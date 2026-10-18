"use client";

import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { useGuardClaim } from "./ScreenshotGuard";
import { type Tokens, requestTokens } from "./tokens";

/** Widths the image route will sign and serve (kept in step with @jerryqiu/protect ALLOWED_WIDTHS). */
const WIDTHS = [480, 960, 1600, 2400] as const;

/** Shape written by scripts/optimize-images.mjs (and by the media library). */
export type ImageAsset = {
  width: number;
  height: number;
  /** Dominant colour, shown until the image is ready. */
  color?: string;
  /** Tiny WebP data URL for blur-up. */
  blur?: string;
  files: { width: number; src: string }[];
  alt?: string;
  caption?: string;
};

export type ProtectedAsset = Omit<ImageAsset, "files"> & { id?: string; files?: ImageAsset["files"] };

export type ProtectedImageProps = {
  asset: ProtectedAsset;
  alt: string;
  sizes?: string;
  priority?: boolean;
  fit?: "cover" | "contain";
  /** Keep the intrinsic aspect ratio (default) or fill the positioned parent. */
  fill?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Optional tokens minted on the server (client galleries bind them to the viewer). Without them the browser asks the token endpoint. */
  tokens?: Record<number, string>;
  /** Image route base and token endpoint. */
  base?: string;
  refreshUrl?: string;
};

const cls = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

/**
 * Photograph with layered protection (a deterrent, see docs/project/01-photo-site-spec.md section 4):
 * no file URL is in the HTML. The server renders only an opaque id and a blur placeholder. The browser gets short-lived
 * tokens (batched), fetches the bytes with a token bound to this image and width, turns them into a blob: URL and revokes
 * it on unmount; the photograph fades in over its placeholder. A transparent shield sits over the picture so long-press
 * and drag do not reach it. Before JavaScript runs, and while loading, only the blurred placeholder is shown. Alt text
 * is always present. While one is mounted the strict screenshot guard is on for the page.
 * An asset with real `files` and no tokens renders as a plain responsive image under the same shield.
 */
export function ProtectedImage(props: ProtectedImageProps) {
  const { asset } = props;
  if (!asset.id || (asset.files?.length && !props.tokens)) return <PlainImage {...props} />;
  return <BlobImage {...props} id={asset.id} />;
}

function frame(asset: ProtectedAsset, fill?: boolean, style?: CSSProperties): CSSProperties {
  return {
    aspectRatio: fill ? undefined : `${asset.width} / ${asset.height}`,
    backgroundColor: asset.color,
    backgroundImage: asset.blur ? `url(${asset.blur})` : undefined,
    ...style,
  };
}

function PlainImage({
  asset,
  alt,
  sizes = "100vw",
  priority,
  fit = "cover",
  fill,
  className,
  style,
}: ProtectedImageProps) {
  const sorted = [...(asset.files ?? [])].sort((a, b) => a.width - b.width);
  const largest = sorted[sorted.length - 1];
  return (
    <span
      data-protected="plain"
      className={cls("pm-img", fill && "pm-img--fill", className)}
      style={frame(asset, fill, style)}
    >
      {largest ? (
        <img
          src={largest.src}
          srcSet={sorted.map((f) => `${f.src} ${f.width}w`).join(", ")}
          sizes={sizes}
          alt={alt}
          width={asset.width}
          height={asset.height}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          {...(priority ? { fetchPriority: "high" as const } : {})}
          draggable={false}
          style={{ objectFit: fit }}
        />
      ) : (
        <span className="hm-sr-only">{alt}</span>
      )}
      <span className="pm-shield" aria-hidden="true" />
    </span>
  );
}

function BlobImage({
  id,
  asset,
  tokens,
  base = "/api/img",
  refreshUrl = "/api/img/token",
  alt,
  priority,
  fit = "cover",
  fill,
  className,
  style,
}: ProtectedImageProps & { id: string }) {
  useGuardClaim();
  const box = useRef<HTMLSpanElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const live = useRef<Tokens | undefined>(tokens);

  const load = useCallback(
    async (width: number, retry = true): Promise<string | null> => {
      let t = live.current?.[width];
      if (!t) {
        live.current = (await requestTokens(id, refreshUrl)) ?? undefined;
        t = live.current?.[width];
      }
      if (!t) return null;
      const res = await fetch(`${base}/${id}?w=${width}&t=${encodeURIComponent(t)}`, {
        credentials: "same-origin",
        cache: "no-store",
        headers: { Accept: "image/avif,image/webp,image/*" },
      });
      if (res.ok) return URL.createObjectURL(await res.blob());
      if (retry && (res.status === 403 || res.status === 401)) {
        live.current = (await requestTokens(id, refreshUrl, { fresh: true })) ?? undefined;
        return live.current ? load(width, false) : null;
      }
      return null;
    },
    [base, id, refreshUrl],
  );

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let url: string | null = null;
    let cancelled = false;
    let started = false;
    const start = async () => {
      if (started) return;
      started = true;
      const need = el.clientWidth * (window.devicePixelRatio || 1);
      const width = WIDTHS.find((w) => w >= need) ?? WIDTHS[WIDTHS.length - 1];
      try {
        const u = await load(width);
        if (cancelled) return u && URL.revokeObjectURL(u);
        if (u) {
          url = u;
          setSrc(u);
        } else setFailed(true);
      } catch {
        if (!cancelled) setFailed(true);
      }
    };
    let io: IntersectionObserver | undefined;
    if (priority) void start();
    else {
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            io?.disconnect();
            void start();
          }
        },
        { rootMargin: "300px" },
      );
      io.observe(el);
    }
    return () => {
      cancelled = true;
      io?.disconnect();
      if (url) URL.revokeObjectURL(url);
    };
  }, [load, priority]);

  return (
    <span
      ref={box}
      data-pid={id}
      data-protected="strict"
      data-state={src ? "ready" : failed ? "failed" : "loading"}
      className={cls("pm-img", fill && "pm-img--fill", className)}
      style={frame(asset, fill, style)}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          width={asset.width}
          height={asset.height}
          draggable={false}
          style={{ objectFit: fit }}
        />
      ) : (
        <span className="hm-sr-only">{failed ? `${alt} (could not be loaded)` : alt}</span>
      )}
      <span className="pm-shield" aria-hidden="true" />
    </span>
  );
}
