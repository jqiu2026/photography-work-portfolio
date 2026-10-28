"use client";

import { useState } from "react";
import { clsx as cx } from "clsx";
import type { ImageAsset } from "./Image";
import { Lightbox } from "./Lightbox";
import { ProtectedImage } from "./ProtectedImage";

export type ProtectedGalleryItem = {
  asset: Omit<ImageAsset, "files"> & { id?: string; files?: ImageAsset["files"] };
  alt: string;
  tokens?: Record<number, string>;
};

/**
 * Grid of protected photographs, with an optional protected lightbox (the enlarged copy is fetched through the same
 * token route as the tiles, never from a file URL). `justified` keeps rows at an even height; `masonry` uses columns.
 */
export function ProtectedGallery({
  items,
  columns = 3,
  layout = "masonry",
  rowHeight = 280,
  lightbox = false,
  base,
  refreshUrl,
  className,
}: {
  items: ProtectedGalleryItem[];
  columns?: number;
  layout?: "justified" | "masonry";
  rowHeight?: number;
  lightbox?: boolean;
  base?: string;
  refreshUrl?: string;
  className?: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  if (!lightbox && layout === "masonry" && columns) {
    return (
      <ul className="rd-pgallery" style={{ columnCount: columns }}>
        {items.map((it, i) => (
          <li key={it.asset.id ?? i}>
            <ProtectedImage
              asset={it.asset}
              alt={it.alt}
              tokens={it.tokens}
              base={base}
              refreshUrl={refreshUrl}
              priority={i < 2}
            />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <>
      <ul
        className={cx("rd-gallery", `rd-gallery--${layout}`, className)}
        style={{ ["--rd-row" as string]: `${rowHeight}px` }}
      >
        {items.map((it, i) => {
          const ratio = it.asset.width / it.asset.height;
          return (
            <li
              key={it.asset.id ?? i}
              style={
                layout === "justified" ? { flexGrow: ratio * 100, flexBasis: `${ratio * rowHeight}px` } : undefined
              }
            >
              {layout === "justified" ? <i style={{ display: "block", paddingBottom: `${100 / ratio}%` }} /> : null}
              <button
                type="button"
                onClick={() => lightbox && setOpen(i)}
                aria-label={`Open ${it.alt}`}
                disabled={!lightbox}
              >
                <ProtectedImage
                  asset={it.asset}
                  alt={it.alt}
                  tokens={it.tokens}
                  base={base}
                  refreshUrl={refreshUrl}
                  fill={layout === "justified"}
                  priority={i < 2}
                />
              </button>
            </li>
          );
        })}
      </ul>
      {lightbox ? (
        <Lightbox
          images={items.map((it) => ({ ...it.asset, files: it.asset.files ?? [], alt: it.alt }))}
          index={open}
          onIndexChange={setOpen}
          renderImage={(img) => (
            <ProtectedImage
              key={img.id}
              asset={img}
              alt={img.alt}
              base={base}
              refreshUrl={refreshUrl}
              fit="contain"
              fill
              priority
            />
          )}
        />
      ) : null}
    </>
  );
}
