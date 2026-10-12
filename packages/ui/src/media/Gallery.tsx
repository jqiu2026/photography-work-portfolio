"use client";

import { useState } from "react";
import { cx } from "../components/cx";
import { Image, type ImageAsset } from "./Image";
import { Lightbox } from "./Lightbox";

export type GalleryImage = ImageAsset & { alt: string };

/**
 * Photo grid. `justified` keeps rows at an even height; `masonry` uses columns.
 * Clicking an image opens the Lightbox (disable with `lightbox={false}`).
 */
export function Gallery({ images, layout = "justified", rowHeight = 280, lightbox = true, className }: { images: GalleryImage[]; layout?: "justified" | "masonry"; rowHeight?: number; lightbox?: boolean; className?: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const sizes = layout === "masonry" ? "(min-width: 900px) 33vw, 50vw" : "(min-width: 900px) 40vw, 90vw";
  return (
    <>
      <ul className={cx("ph-gallery", `ph-gallery--${layout}`, className)} style={{ ["--ph-row" as string]: `${rowHeight}px` }}>
        {images.map((img, i) => {
          const ratio = img.width / img.height;
          return (
            <li key={img.files[0]?.src ?? i} style={layout === "justified" ? { flexGrow: ratio * 100, flexBasis: `${ratio * rowHeight}px` } : undefined}>
              {layout === "justified" ? <i style={{ display: "block", paddingBottom: `${100 / ratio}%` }} /> : null}
              <button type="button" onClick={() => lightbox && setOpen(i)} aria-label={`Open ${img.alt}`} disabled={!lightbox}>
                <Image asset={img} alt={img.alt} sizes={sizes} fill={layout === "justified"} />
              </button>
            </li>
          );
        })}
      </ul>
      {lightbox ? <Lightbox images={images} index={open} onIndexChange={setOpen} /> : null}
    </>
  );
}
