"use client";

import { useState } from "react";

/** A click-to-load YouTube player: nothing is requested from YouTube until the visitor presses play. */
export function YouTubeFacade({ id, title }: { id: string; title: string }) {
  const [on, setOn] = useState(false);
  if (!/^[\w-]{6,20}$/.test(id)) return null;
  return (
    <div className="hb-embed">
      {on ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          loading="lazy"
          allowFullScreen
        />
      ) : (
        <button type="button" onClick={() => setOn(true)} className="hb-embed__play">
          <span className="hb-embed__icon" aria-hidden="true">
            ▶
          </span>
          <span>Play {title}</span>
          <span className="hb-mono">Loads from YouTube when you press play</span>
        </button>
      )}
    </div>
  );
}

export function EmbedGrid({ videos }: { videos: string[] }) {
  return (
    <div className="hb-embeds">
      {videos.map((id, i) => (
        <YouTubeFacade key={id} id={id} title={`Video ${i + 1}`} />
      ))}
    </div>
  );
}
