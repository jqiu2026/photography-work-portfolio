"use client";

import "./gallery-design.css";
import { GuardScope } from "@halation/ui/media";
import { useEffect, useMemo } from "react";
import { idleLeaveAction } from "@/app/client/actions";
import type { GallerySecurity } from "@jerryqiu/db/gallery-security";

/**
 * Applies a gallery's protection settings on the client's page: the guard (screenshot, save, print and devtools keys, capture
 * API, focus loss, hold to view), reporting each trigger to the studio, which may warn or lock them out; a faint tiled
 * viewer code over the page; and closing the gallery after idle time. It deters and traces; it cannot stop a phone camera.
 */
export function GalleryGuard({
  security,
  galleryId,
  slug,
  code,
}: { security: GallerySecurity; galleryId?: string; slug?: string; code: string }) {
  const options = useMemo(
    () => ({
      blurOnLeave: security.blurOnLeave,
      blockSelection: security.blockSelection,
      blockContextMenu: security.blockContextMenu,
      blockPrint: security.blockPrint,
      detectDevtools: security.detectDevtools,
      holdToView: security.holdToView,
      title: security.protectTitle || undefined,
      message: security.protectMessage || undefined,
      mobileHalfBlur: security.mobileHalfBlur,
      onEvent: (e: { kind: string; combo: string }) => {
        fetch("/api/client/security-event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: e.kind, combo: e.combo, galleryId }),
          keepalive: true,
        })
          .then((r) => r.json())
          .then((r: { locked?: boolean }) => {
            if (r.locked) location.assign(slug ? `/g/${slug}?locked=1` : "/");
          })
          .catch(() => {});
      },
    }),
    [security, galleryId, slug],
  );

  useEffect(() => {
    if (!security.idleMinutes) return;
    let t: ReturnType<typeof setTimeout>;
    const arm = () => {
      clearTimeout(t);
      t = setTimeout(async () => {
        await fetch("/api/client/security-event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "idle", galleryId }),
          keepalive: true,
        }).catch(() => {});
        await idleLeaveAction();
      }, security.idleMinutes * 60_000);
    };
    const events = ["pointermove", "pointerdown", "keydown", "scroll", "touchstart"] as const;
    for (const e of events) window.addEventListener(e, arm, { passive: true });
    arm();
    return () => {
      clearTimeout(t);
      for (const e of events) window.removeEventListener(e, arm);
    };
  }, [security.idleMinutes, galleryId]);

  const overlay = useMemo(() => {
    if (!security.viewerOverlay) return null;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='260' height='140'><text x='10' y='80' transform='rotate(-24 130 70)' font-family='monospace' font-size='14' fill='white' fill-opacity='${security.overlayOpacity}'>${code}</text></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [security.viewerOverlay, security.overlayOpacity, code]);

  return (
    <>
      <GuardScope level={security.level} options={options} />
      {overlay ? (
        <div className="gd-overlay" aria-hidden="true" data-viewer-overlay style={{ backgroundImage: overlay }} />
      ) : null}
    </>
  );
}
