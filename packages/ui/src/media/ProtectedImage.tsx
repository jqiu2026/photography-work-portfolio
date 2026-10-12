"use client";

import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { type GuardLevel } from "./guard";
import { Image, type ImageAsset, type ImageProps } from "./Image";
import { useGuardLevel } from "./ScreenshotGuard";

/** Widths the image route will sign and serve (kept in step with @jerryqiu/protect ALLOWED_WIDTHS). */
const WIDTHS = [480, 960, 1600, 2400] as const;

export type ProtectedAsset = ImageAsset & { id: string };

export type ProtectedImageProps = Omit<ImageProps, "asset"> & {
  asset: ImageAsset & { id?: string };
  /** One signed, short-lived token per width, minted on the server while rendering. Only used in strict mode. */
  tokens?: Record<number, string>;
  /** Overrides the level from the surrounding ScreenshotGuard. */
  level?: GuardLevel;
  /** Image route base and token refresh endpoint (defaults match the apps). */
  base?: string;
  refreshUrl?: string;
};

/**
 * Photograph with layered protection (a deterrent, see docs/project/05-security-and-image-protection.md):
 *  - off / light: a normal responsive image whose right-click and drag are blocked by the guard.
 *  - strict: no file URL is in the HTML. The server renders only an opaque id and signed tokens. The browser fetches
 *    the bytes with a token (expires in minutes, bound to this image and width), turns them into a blob: URL, and
 *    revokes it on unmount. A transparent overlay sits over the picture so long-press and drag do not reach it.
 *    Before JavaScript runs, and while loading, only a blurred placeholder is shown. Alt text is always present.
 */
export function ProtectedImage({
  asset,
  tokens,
  level,
  base = "/api/img",
  refreshUrl = "/api/img/token",
  alt,
  sizes: _sizes,
  priority,
  fit = "cover",
  fill,
  className,
  style,
}: ProtectedImageProps) {
  const ctx = useGuardLevel();
  // Tokens only exist for strict images, so their presence decides this on the server too (context is client-only).
  const effective: GuardLevel = level ?? (tokens ? "strict" : ctx);
  const strict = effective === "strict" && Boolean(tokens && asset.id);
  if (!strict) {
    return (
      <span data-protected={effective} className="ph-protected" style={{ display: "block", position: "relative" }}>
        <Image asset={asset} alt={alt} priority={priority} fit={fit} fill={fill} className={className} style={style} />
        {effective !== "off" ? <span className="ph-protected__shield" aria-hidden="true" /> : null}
      </span>
    );
  }
  return (
    <BlobImage
      id={asset.id as string}
      asset={asset}
      tokens={tokens as Record<number, string>}
      base={base}
      refreshUrl={refreshUrl}
      alt={alt}
      fit={fit}
      fill={fill}
      className={className}
      style={style}
    />
  );
}

function BlobImage({
  id,
  asset,
  tokens,
  base,
  refreshUrl,
  alt,
  fit,
  fill,
  className,
  style,
}: {
  id: string;
  asset: ImageAsset;
  tokens: Record<number, string>;
  base: string;
  refreshUrl: string;
  alt: string;
  fit: "cover" | "contain";
  fill?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const box = useRef<HTMLSpanElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const live = useRef(tokens);

  const load = useCallback(
    async (width: number, retry = true): Promise<string | null> => {
      const t = live.current[width];
      const res = await fetch(`${base}/${id}?w=${width}&t=${encodeURIComponent(t ?? "")}`, {
        credentials: "same-origin",
        cache: "no-store",
        headers: { Accept: "image/avif,image/webp,image/*" },
      });
      if (res.ok) return URL.createObjectURL(await res.blob());
      if (retry && (res.status === 403 || res.status === 401)) {
        const r = await fetch(refreshUrl, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        if (r.ok) {
          live.current = ((await r.json()) as { tokens: Record<number, string> }).tokens;
          return load(width, false);
        }
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
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          void start();
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
      if (url) URL.revokeObjectURL(url);
    };
  }, [load]);

  return (
    <span
      ref={box}
      data-pid={id}
      data-protected="strict"
      className={["ph-img", "ph-protected", fill ? "ph-img--fill" : "", className ?? ""].filter(Boolean).join(" ")}
      style={{
        aspectRatio: fill ? undefined : `${asset.width} / ${asset.height}`,
        backgroundColor: asset.color,
        backgroundImage: asset.blur ? `url(${asset.blur})` : undefined,
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
        <span className="ph-visually-hidden">{failed ? `${alt} (could not be loaded)` : alt}</span>
      )}
      <span className="ph-protected__shield" aria-hidden="true" />
    </span>
  );
}
