"use client";

import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { Image, type ImageAsset, type ImageProps } from "./Image";
import { useGuardClaim } from "./ScreenshotGuard";
import { type Tokens, requestTokens } from "./tokenBroker";

/** Widths the image route will sign and serve (kept in step with @jerryqiu/protect ALLOWED_WIDTHS). */
const WIDTHS = [480, 960, 1600, 2400] as const;

export type ProtectedAsset = ImageAsset & { id: string };

export type ProtectedImageProps = Omit<ImageProps, "asset"> & {
  asset: Omit<ImageAsset, "files"> & { id?: string; files?: ImageAsset["files"] };
  /** Optional tokens minted on the server (client galleries bind them to the viewer). Without them the browser asks the token endpoint. */
  tokens?: Record<number, string>;
  /** Image route base and token endpoint (defaults match the apps). */
  base?: string;
  refreshUrl?: string;
};

/**
 * Photograph with layered protection (a deterrent, see docs/project/01-photo-site-spec.md section 4):
 * no file URL is in the HTML. The server renders only an opaque id and a blur placeholder. The browser gets short-lived
 * tokens (batched), fetches the bytes with a token bound to this image and width, turns them into a blob: URL and revokes
 * it on unmount. A transparent shield sits over the picture so long-press and drag do not reach it. Before JavaScript
 * runs, and while loading, only the blurred placeholder is shown. Alt text is always present. While one is mounted the
 * strict screenshot guard is on for the page.
 * Compatibility: an asset with real `files` and no id-only mode (the hub) still renders as a plain responsive image.
 */
export function ProtectedImage(props: ProtectedImageProps) {
  const { asset } = props;
  if (!asset.id || (asset.files?.length && !props.tokens)) {
    return (
      <span data-protected="plain" className="rd-protected" style={{ display: "block", position: "relative" }}>
        <Image
          asset={{ ...asset, files: asset.files ?? [] }}
          alt={props.alt}
          sizes={props.sizes}
          priority={props.priority}
          fit={props.fit}
          fill={props.fill}
          className={props.className}
          style={props.style}
        />
        <span className="rd-protected__shield" aria-hidden="true" />
      </span>
    );
  }
  return <BlobImage {...props} id={asset.id} />;
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
      className={["rd-img", "rd-protected", fill ? "rd-img--fill" : "", className ?? ""].filter(Boolean).join(" ")}
      style={{
        aspectRatio: fill ? undefined : `${asset.width} / ${asset.height}`,
        backgroundColor: asset.color,
        backgroundImage: asset.blur ? `url(${asset.blur})` : undefined,
        backgroundSize: "cover",
        position: "relative",
        ...style,
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          width={asset.width}
          height={asset.height}
          draggable={false}
          style={{ objectFit: fit }}
        />
      ) : (
        <span className="rd-visually-hidden">{failed ? `${alt} (could not be loaded)` : alt}</span>
      )}
      <span className="rd-protected__shield" aria-hidden="true" />
    </span>
  );
}
