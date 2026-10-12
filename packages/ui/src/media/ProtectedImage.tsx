"use client";

import { Image, type ImageProps } from "./Image";

/**
 * Interface for protected photos. Phase 1 stub: renders a normal Image with drag and context-menu
 * blocking (a deterrent only). Phase 2 replaces the internals with signed expiring URLs,
 * canvas/blob rendering, watermarking and ScreenshotGuard (see docs/project/05-security-and-image-protection.md).
 */
export type ProtectedImageProps = ImageProps & {
  /** Visible watermark text (Phase 2). */
  watermark?: string;
  /** Protection level (Phase 2). `deter` = this stub's behaviour. */
  level?: "none" | "deter" | "strict";
};

export function ProtectedImage({ watermark: _w, level = "deter", ...rest }: ProtectedImageProps) {
  return (
    <span
      data-protected={level}
      onContextMenu={level === "none" ? undefined : (e) => e.preventDefault()}
      onDragStart={level === "none" ? undefined : (e) => e.preventDefault()}
      style={{ display: "contents" }}
    >
      <Image {...rest} />
    </span>
  );
}
