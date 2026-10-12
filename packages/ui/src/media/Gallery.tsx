"use client";

import { useState } from "react";
import { ShaderLayer } from "../webgl/ShaderHero";
import { cx } from "../components/cx";
import { Image, type ImageAsset } from "./Image";
import { Lightbox } from "./Lightbox";

export type GalleryImage = ImageAsset & { alt: string };

function pickSrc(img: GalleryImage) {
  const f = [...img.files].sort((a, b) => a.width - b.width);
  return (f.find((x) => x.width >= 960) ?? f[f.length - 1]).src;
}

/** Image tile that runs the WebGL glitch layer while the pointer is over it (fine pointers only). */
function GlitchTile({
  img,
  sizes,
  fill,
  glitch,
}: { img: GalleryImage; sizes: string; fill: boolean; glitch: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <span
      style={{ display: "block", position: fill ? "absolute" : "relative", inset: fill ? 0 : undefined }}
      onPointerEnter={(e) => glitch && e.pointerType === "mouse" && setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <Image asset={img} alt={img.alt} sizes={sizes} fill={fill} />
      {hover ? <ShaderLayer src={pickSrc(img)} pointer="local" intensity={1.2} /> : null}
    </span>
  );
}

/**
 * Photo grid. `justified` keeps rows at an even height; `masonry` uses columns.
 * Clicking an image opens the Lightbox (disable with `lightbox={false}`).
 */
export function Gallery({
  images,
  layout = "justified",
  rowHeight = 280,
  lightbox = true,
  glitch = false,
  className,
}: {
  images: GalleryImage[];
  layout?: "justified" | "masonry";
  rowHeight?: number;
  lightbox?: boolean;
  /** Run the WebGL glitch effect on hover. */
  glitch?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const sizes = layout === "masonry" ? "(min-width: 900px) 33vw, 50vw" : "(min-width: 900px) 40vw, 90vw";
  return (
    <>
      <ul
        className={cx("ph-gallery", `ph-gallery--${layout}`, className)}
        style={{ ["--ph-row" as string]: `${rowHeight}px` }}
      >
        {images.map((img, i) => {
          const ratio = img.width / img.height;
          return (
            <li
              key={img.files[0]?.src ?? i}
              style={
                layout === "justified" ? { flexGrow: ratio * 100, flexBasis: `${ratio * rowHeight}px` } : undefined
              }
            >
              {layout === "justified" ? <i style={{ display: "block", paddingBottom: `${100 / ratio}%` }} /> : null}
              <button
                type="button"
                onClick={() => lightbox && setOpen(i)}
                aria-label={`Open ${img.alt}`}
                disabled={!lightbox}
              >
                <GlitchTile img={img} sizes={sizes} fill={layout === "justified"} glitch={glitch} />
              </button>
            </li>
          );
        })}
      </ul>
      {lightbox ? <Lightbox images={images} index={open} onIndexChange={setOpen} /> : null}
    </>
  );
}
