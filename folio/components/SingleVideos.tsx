"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Vid } from "@/lib/videos-data";
import { VideoDeck } from "./VideoDeck";
import { thumbOf } from "./yt";

/** A grid of single videos; one opens in a viewer on this page. */
export function SingleVideos({ videos }: { videos: Vid[] }) {
  const [open, setOpen] = useState<Vid | null>(null);
  const opener = useRef<Element | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const close = useCallback(() => {
    setOpen(null);
    (opener.current as HTMLElement | null)?.focus?.({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    root.current?.querySelector<HTMLElement>(".x")?.focus({ preventScroll: true });
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", key);
    };
  }, [open, close]);

  return (
    <>
      <div className="vgrid">
        {videos.map((v) => (
          <button
            key={v.id}
            type="button"
            className="vcard"
            onClick={() => {
              opener.current = document.activeElement;
              setOpen(v);
            }}
          >
            <span className="vthumb">
              {/* biome-ignore lint/performance/noImgElement: local thumbnail files */}
              <img src={thumbOf(v.id)} alt="" width={640} height={360} loading="lazy" decoding="async" draggable={false} />
              <span className="go" aria-hidden="true">
                &#9654;
              </span>
            </span>
            <span className="vtitle">{v.title}</span>
          </button>
        ))}
      </div>
      {open ? (
        // biome-ignore lint/a11y/useKeyWithClickEvents: Escape and the close button are the keyboard path
        <div
          className="vmodal"
          ref={root}
          role="dialog"
          aria-modal="true"
          aria-label={open.title}
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="vmodal-in">
            <VideoDeck videos={[open]} list={false} autoStart />
          </div>
          <button type="button" className="x" aria-label="Close" onClick={close}>
            &times;
          </button>
        </div>
      ) : null}
    </>
  );
}
