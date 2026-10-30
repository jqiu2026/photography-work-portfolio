"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Vid } from "@/lib/videos-data";
import { loadYT, thumbOf, type YTPlayer, watchUrl } from "./yt";

/**
 * A player for one video or a whole playlist, on this site. The video is YouTube's own embedded player, shown as
 * YouTube provides it (nothing is placed over it, which its embed policy forbids); it stays on the page, the next video
 * follows when one ends, and the list below it switches videos. Nothing is requested from YouTube until play is pressed:
 * the posters are files on this site. The only way off the page is the "Watch on YouTube" link.
 */
export function VideoDeck({
  videos,
  playlistId,
  list = true,
  autoStart = false,
}: {
  videos: Vid[];
  playlistId?: string;
  list?: boolean;
  autoStart?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState(false);
  const player = useRef<YTPlayer | null>(null);
  const host = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);

  const play = useCallback(
    async (i: number) => {
      const v = videos[i];
      if (!v) return;
      indexRef.current = i;
      setIndex(i);
      setStarted(true);
      if (player.current) {
        player.current.loadVideoById(v.id);
        return;
      }
      try {
        const YT = await loadYT();
        const el = document.createElement("div");
        host.current?.replaceChildren(el);
        player.current = new YT.Player(el, {
          host: "https://www.youtube-nocookie.com",
          videoId: v.id,
          width: "100%",
          height: "100%",
          playerVars: { autoplay: 1, rel: 0, playsinline: 1, origin: window.location.origin },
          events: {
            onReady: (e: { target: YTPlayer }) => e.target.playVideo(),
            onStateChange: (e: { data: number }) => {
              if (e.data === YT.PlayerState.ENDED && indexRef.current < videos.length - 1) void play(indexRef.current + 1);
            },
            onError: () => setFailed(true),
          },
        });
      } catch {
        setFailed(true);
      }
    },
    [videos],
  );

  useEffect(() => {
    if (autoStart) void play(0);
    return () => {
      player.current?.destroy();
      player.current = null;
    };
  }, [autoStart, play]);

  const current = videos[index];
  return (
    <section className="deck" aria-label="Video player">
      <div className="deck-main">
        <div className="deck-stage">
          <div className="deck-video" ref={host} />
          {/* the poster only exists before play, when there is no YouTube player to cover */}
          {!started ? (
            <div className="deck-poster" style={{ backgroundImage: `url(${thumbOf(current.id)})` }}>
              <button type="button" className="go" aria-label={`Play ${current.title}`} onClick={() => void play(index)}>
                &#9654;
              </button>
            </div>
          ) : null}
          {failed ? <p className="deck-err">This video cannot be played here right now.</p> : null}
        </div>
        <div className="deck-meta">
          <h2>{current.title}</h2>
          <a className="yt" href={watchUrl(current.id, playlistId)} target="_blank" rel="noopener noreferrer">
            Watch on YouTube
          </a>
        </div>
      </div>
      {list && videos.length > 1 ? (
        <ol className="deck-list" aria-label="Videos in this playlist">
          {videos.map((v, i) => (
            <li key={v.id} aria-current={started && i === index ? "true" : undefined}>
              <button type="button" onClick={() => void play(i)}>
                <span className="n" aria-hidden="true">
                  {started && i === index ? "▶" : i + 1}
                </span>
                {/* biome-ignore lint/performance/noImgElement: local thumbnail files */}
                <img src={thumbOf(v.id)} alt="" width={160} height={90} loading="lazy" decoding="async" draggable={false} />
                <span className="t">{v.title}</span>
              </button>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
