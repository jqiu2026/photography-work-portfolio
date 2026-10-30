// Loads YouTube's IFrame Player API, once, and only when a visitor presses play.
export type YTPlayer = {
  loadVideoById(id: string): void;
  playVideo(): void;
  destroy(): void;
};
type YTNamespace = {
  Player: new (el: HTMLElement, opts: Record<string, unknown>) => YTPlayer;
  PlayerState: { ENDED: number };
};
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ready: Promise<YTNamespace> | null = null;
export function loadYT(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!ready)
    ready = new Promise((resolve, reject) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        if (window.YT) resolve(window.YT);
      };
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.async = true;
      s.onerror = () => {
        ready = null;
        reject(new Error("blocked"));
      };
      document.head.appendChild(s);
    });
  return ready;
}

export const thumbOf = (id: string) => `/video-thumbs/${id}.webp`;
export const watchUrl = (id: string, playlist?: string) =>
  playlist ? `https://www.youtube.com/watch?v=${id}&list=${playlist}` : `https://youtu.be/${id}`;
