"use client";

import { Dialog } from "radix-ui";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Image, type ImageAsset } from "./Image";

export type LightboxProps = {
  images: (ImageAsset & { alt: string })[];
  index: number | null;
  onIndexChange: (i: number | null) => void;
};

/** Full-screen viewer: arrow keys, swipe, click to zoom, Escape to close, focus trapped, caption. */
export function Lightbox({ images, index, onIndexChange }: LightboxProps) {
  const open = index !== null;
  const [zoom, setZoom] = useState(false);
  const start = useRef<number | null>(null);
  const go = useCallback(
    (d: number) => {
      if (index === null) return;
      setZoom(false);
      onIndexChange((index + d + images.length) % images.length);
    },
    [index, images.length, onIndexChange],
  );
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, go]);
  const img = index === null ? null : images[index];
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setZoom(false);
          onIndexChange(null);
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="hl-lb__overlay" />
        <Dialog.Content
          className="hl-lb"
          aria-describedby={undefined}
          onPointerDown={(e) => {
            start.current = e.clientX;
          }}
          onPointerUp={(e) => {
            if (start.current !== null && !zoom) {
              const dx = e.clientX - start.current;
              if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
            }
            start.current = null;
          }}
        >
          <Dialog.Title className="hl-sr-only">{img ? img.alt : "Image viewer"}</Dialog.Title>
          {img ? (
            <figure className="hl-lb__fig" data-zoom={zoom || undefined}>
              <button
                type="button"
                className="hl-lb__img"
                onClick={() => setZoom((z) => !z)}
                aria-label={zoom ? "Zoom out" : "Zoom in"}
              >
                <Image asset={img} alt={img.alt} sizes="100vw" priority fit="contain" fill />
              </button>
              <figcaption>
                {img.caption ?? img.alt}
                <span>
                  {" "}
                  · {(index ?? 0) + 1} / {images.length}
                </span>
              </figcaption>
            </figure>
          ) : null}
          <Dialog.Close className="hl-lb__btn hl-lb__close" aria-label="Close">
            <X size={20} aria-hidden />
          </Dialog.Close>
          {images.length > 1 ? (
            <>
              <button
                type="button"
                className="hl-lb__btn hl-lb__prev"
                onClick={() => go(-1)}
                aria-label="Previous image"
              >
                <ChevronLeft size={22} aria-hidden />
              </button>
              <button type="button" className="hl-lb__btn hl-lb__next" onClick={() => go(1)} aria-label="Next image">
                <ChevronRight size={22} aria-hidden />
              </button>
            </>
          ) : null}
          <span className="hl-lb__hint" aria-hidden>
            <ZoomIn size={14} /> click to zoom
          </span>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
