"use client";

import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, useSwipe } from "@holominimal/ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { type ProtectedAsset, ProtectedImage } from "./ProtectedImage";

export type ProtectedGalleryItem = { asset: ProtectedAsset; alt: string; tokens?: Record<number, string> };

const cls = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

/**
 * Grid of protected photographs with an optional viewer. `justified` keeps rows at an even height; `masonry` uses
 * columns. Each tile is a button that opens the viewer, which is Holominimal's lightbox frame (native <dialog>, counter,
 * round buttons) with the enlarged copy fetched through the same token route as the tiles, never from a file URL.
 */
export function ProtectedGallery({
  items,
  columns,
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
  return (
    <>
      <ul
        className={cls("pm-pgallery", `pm-pgallery--${layout}`, className)}
        style={{ "--pm-row": `${rowHeight}px`, ...(columns ? { columnCount: columns } : {}) } as React.CSSProperties}
      >
        {items.map((it, i) => {
          const ratio = it.asset.width / it.asset.height;
          const image = (
            <ProtectedImage
              asset={it.asset}
              alt={it.alt}
              tokens={it.tokens}
              base={base}
              refreshUrl={refreshUrl}
              fill={layout === "justified"}
              priority={i < 2}
            />
          );
          return (
            <li
              key={it.asset.id ?? i}
              style={
                layout === "justified" ? { flexGrow: ratio * 100, flexBasis: `${ratio * rowHeight}px` } : undefined
              }
            >
              {layout === "justified" ? <i style={{ display: "block", paddingBottom: `${100 / ratio}%` }} /> : null}
              {lightbox ? (
                <button type="button" onClick={() => setOpen(i)} aria-label={`Open ${it.alt}`}>
                  {image}
                </button>
              ) : (
                image
              )}
            </li>
          );
        })}
      </ul>
      {lightbox ? (
        <ProtectedViewer items={items} index={open} onIndexChange={setOpen} base={base} refreshUrl={refreshUrl} />
      ) : null}
    </>
  );
}

/** The viewer: Left/Right, Home/End and swipe move between photographs, Escape or the backdrop closes it. */
export function ProtectedViewer({
  items,
  index,
  onIndexChange,
  base,
  refreshUrl,
  label = "Photographs",
}: {
  items: ProtectedGalleryItem[];
  index: number | null;
  onIndexChange: (i: number | null) => void;
  base?: string;
  refreshUrl?: string;
  label?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const open = index !== null;
  const last = items.length - 1;
  const go = useCallback(
    (to: number) => {
      if (index === null || !items.length) return;
      onIndexChange(to < 0 ? last : to > last ? 0 : to);
    },
    [index, items.length, last, onIndexChange],
  );
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);
  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(index + 1);
      else if (e.key === "ArrowLeft") go(index - 1);
      else if (e.key === "Home") go(0);
      else if (e.key === "End") go(last);
      else return;
      e.preventDefault();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, go, last]);
  useSwipe(
    stage,
    {
      onSwipe: (d) =>
        index === null ? undefined : d === "left" ? go(index + 1) : d === "right" ? go(index - 1) : undefined,
    },
    [go, index],
  );
  const item = index === null ? undefined : items[index];
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: a click on the backdrop closes it; Escape closes the native dialog
    <dialog
      ref={dialog}
      aria-label={label}
      className="hm-lightbox pm-viewer"
      onClose={() => onIndexChange(null)}
      onClick={(e) => {
        if (e.target === e.currentTarget || e.target === stage.current) onIndexChange(null);
      }}
    >
      {item && index !== null ? (
        <>
          <header className="hm-lightbox-bar">
            <p className="hm-lightbox-count" aria-live="polite" aria-atomic="true">
              {index + 1} / {items.length}
            </p>
            <button type="button" className="hm-lightbox-button" aria-label="Close" onClick={() => onIndexChange(null)}>
              <CloseIcon size={16} />
            </button>
          </header>
          <div ref={stage} className="hm-lightbox-stage pm-viewer-stage">
            <ProtectedImage
              key={item.asset.id ?? index}
              asset={item.asset}
              alt={item.alt}
              base={base}
              refreshUrl={refreshUrl}
              fit="contain"
              fill
              priority
            />
          </div>
          <p className="hm-lightbox-caption">{item.asset.caption ?? item.alt}</p>
          {items.length > 1 ? (
            <>
              <button
                type="button"
                className="hm-lightbox-button hm-lightbox-prev"
                aria-label="Previous photograph"
                onClick={() => go(index - 1)}
              >
                <ChevronLeftIcon size={16} />
              </button>
              <button
                type="button"
                className="hm-lightbox-button hm-lightbox-next"
                aria-label="Next photograph"
                onClick={() => go(index + 1)}
              >
                <ChevronRightIcon size={16} />
              </button>
            </>
          ) : null}
        </>
      ) : null}
    </dialog>
  );
}
