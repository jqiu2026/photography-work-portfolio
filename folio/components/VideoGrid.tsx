"use client";

import { useState } from "react";
import type { Video } from "@/lib/videos";

function Card({ v }: { v: Video }) {
  const [playing, setPlaying] = useState(false);
  const yt = v.youtube && /^[\w-]{11}$/.test(v.youtube) ? v.youtube : null;
  return (
    <article className="vid">
      <div className="frame">
        {v.src ? (
          // biome-ignore lint/a11y/useMediaCaption: owner's own footage; captions can be added per video
          <video controls preload="metadata" playsInline poster={v.poster} src={v.src} controlsList="nodownload noremoteplayback" disablePictureInPicture disableRemotePlayback />
        ) : yt && playing ? (
          <iframe
            title={v.title}
            src={`https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0&playsinline=1`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : yt ? (
          <button type="button" className="go" aria-label={`Play ${v.title}`} onClick={() => setPlaying(true)}>
            &#9654;
          </button>
        ) : null}
      </div>
      <h3>{v.title}</h3>
      {v.note ? <p>{v.note}</p> : null}
    </article>
  );
}

export function VideoGrid({ videos }: { videos: Video[] }) {
  return (
    <div className="vgrid">
      {videos.map((v) => (
        <Card key={v.src ?? v.youtube ?? v.title} v={v} />
      ))}
    </div>
  );
}
