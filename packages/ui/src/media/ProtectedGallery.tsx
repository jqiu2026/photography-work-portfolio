"use client";

import { ProtectedImage } from "./ProtectedImage";
import type { ImageAsset } from "./Image";

export type ProtectedGalleryItem = {
  asset: ImageAsset & { id?: string };
  alt: string;
  tokens?: Record<number, string>;
};

/** Masonry-style grid of protected images. Deliberately has no lightbox: the enlarged copy would be easier to capture. */
export function ProtectedGallery({
  items,
  columns = 3,
  base,
  refreshUrl,
}: { items: ProtectedGalleryItem[]; columns?: number; base?: string; refreshUrl?: string }) {
  return (
    <ul className="ph-pgallery" style={{ columnCount: columns }}>
      {items.map((it, i) => (
        <li key={it.asset.id ?? i}>
          <ProtectedImage asset={it.asset} alt={it.alt} tokens={it.tokens} base={base} refreshUrl={refreshUrl} />
        </li>
      ))}
    </ul>
  );
}
