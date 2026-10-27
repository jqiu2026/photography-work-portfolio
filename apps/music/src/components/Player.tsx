"use client";

import { useState } from "react";
import { embedUrl, isAudioOnly } from "@/lib/embed";

/**
 * A recording. Nothing from the provider loads until the visitor presses play (no third-party request, no cookies on
 * page view). The poster is a button with a visible name; the embed replaces it in place.
 */
export function Player({ provider, id, title, note }: { provider: string; id: string; title: string; note?: string }) {
  const [on, setOn] = useState(false);
  const url = embedUrl(provider, id);
  if (!url) return null;
  return (
    <figure className="mu-player">
      <div className={`mu-player__frame${isAudioOnly(provider) ? " mu-player__frame--audio" : ""}`}>
        {on ? (
          <iframe
            src={url}
            title={`Recording: ${title}`}
            allow="autoplay; encrypted-media"
            referrerPolicy="strict-origin-when-cross-origin"
            loading="lazy"
          />
        ) : (
          <button type="button" className="mu-player__play" onClick={() => setOn(true)}>
            <span className="mu-player__icon" aria-hidden="true">
              ▶
            </span>
            <span>Play {title}</span>
            <span className="mu-mono">Loads from {provider} when you press play</span>
          </button>
        )}
      </div>
      {note ? <figcaption className="mu-muted">{note}</figcaption> : null}
    </figure>
  );
}
