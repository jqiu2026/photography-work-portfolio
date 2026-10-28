"use client";

import { Play } from "lucide-react";
import { type ReactNode, useState } from "react";

const hosts = {
  youtube: (id: string) => `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1`,
  spotify: (id: string) => `https://open.spotify.com/embed/${id.split("/").map(encodeURIComponent).join("/")}`,
  soundcloud: (id: string) => `https://w.soundcloud.com/player/?url=${encodeURIComponent(id)}&auto_play=true`,
  bandcamp: (id: string) => id,
} as const;
export type EmbedProvider = keyof typeof hosts;

/**
 * Click-to-load embed. Nothing from the third party is requested (no script, cookie or iframe) until the visitor
 * clicks. `id` is the video id, Spotify path ("track/xyz"), SoundCloud URL or Bandcamp embed URL.
 */
export function EmbedFacade({
  provider,
  id,
  title,
  poster,
  ratio = "16 / 9",
}: { provider: EmbedProvider; id: string; title: string; poster?: ReactNode; ratio?: string }) {
  const [on, setOn] = useState(false);
  return (
    <div className="rd-embed" style={{ aspectRatio: ratio }}>
      {on ? (
        <iframe
          src={hosts[provider](id)}
          title={title}
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button type="button" onClick={() => setOn(true)} className="rd-embed__facade">
          {poster}
          <span className="rd-embed__play">
            <Play size={22} aria-hidden />
          </span>
          <span className="rd-embed__label">
            {title}
            <small>Loads {provider} when you press play</small>
          </span>
        </button>
      )}
    </div>
  );
}
