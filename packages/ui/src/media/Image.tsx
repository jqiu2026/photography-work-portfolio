"use client";

import type { CSSProperties } from "react";
import { cx } from "../components/cx";

/** Shape written by scripts/optimize-images.mjs into manifest.json. */
export type ImageAsset = {
  width: number;
  height: number;
  /** Dominant color, shown until the image is ready. */
  color?: string;
  /** Tiny WebP data URL for blur-up. */
  blur?: string;
  files: { width: number; src: string }[];
  alt?: string;
  caption?: string;
};

export type ImageProps = {
  asset: ImageAsset;
  alt: string;
  sizes?: string;
  priority?: boolean;
  fit?: "cover" | "contain";
  className?: string;
  style?: CSSProperties;
  /** Keep the intrinsic aspect ratio (default) or fill the parent. */
  fill?: boolean;
};

/** Framework-agnostic responsive image: srcset, dominant-color placeholder, blur-up, no layout shift. */
export function Image({ asset, alt, sizes = "100vw", priority, fit = "cover", fill, className, style }: ImageProps) {
  const sorted = [...asset.files].sort((a, b) => a.width - b.width);
  const largest = sorted[sorted.length - 1];
  return (
    <span
      className={cx("hl-img", fill && "hl-img--fill", className)}
      style={{
        aspectRatio: fill ? undefined : `${asset.width} / ${asset.height}`,
        backgroundColor: asset.color,
        backgroundImage: asset.blur ? `url(${asset.blur})` : undefined,
        ...style,
      }}
    >
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
        style={{ objectFit: fit }}
      />
    </span>
  );
}
