"use client";

import { useEffect, useRef, useState } from "react";
import { useCalm } from "../motion/core";

/** Muted looping video. Shows only the poster for reduced motion or Save-Data; pauses off-screen. */
export function VideoBackground({ src, poster, className }: { src: string; poster: string; className?: string }) {
  const calm = useCalm();
  const ref = useRef<HTMLVideoElement>(null);
  const [saveData, setSaveData] = useState(false);
  useEffect(() => {
    setSaveData(!!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
  }, []);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? el.play().catch(() => {}) : el.pause()));
    io.observe(el);
    return () => io.disconnect();
  }, [calm, saveData]);
  if (calm || saveData)
    // biome-ignore lint/performance/noImgElement: framework-agnostic package
    return <img className={className} src={poster} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />;
  return <video ref={ref} className={className} src={src} poster={poster} muted loop playsInline preload="metadata" aria-hidden style={{ width: "100%", height: "100%", objectFit: "cover" }} />;
}
