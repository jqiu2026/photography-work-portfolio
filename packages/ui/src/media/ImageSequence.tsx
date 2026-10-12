"use client";

import { useMotionValueEvent, type MotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useCalm, useSceneProgress } from "../motion/core";

type Conn = { saveData?: boolean; effectiveType?: string };

/**
 * Scroll-scrubbed frame sequence drawn to a canvas. Put it inside <PinnedScene> (or pass `progress`).
 * Frames load progressively (first, then every 8th, then the rest). On Save-Data, slow connections or
 * reduced motion it shows only the `poster` (or the middle frame) and never downloads the sequence.
 */
export function ImageSequence({ frames, poster, progress, alt, className }: { frames: string[]; poster?: string; progress?: MotionValue<number>; alt: string; className?: string }) {
  const calm = useCalm();
  const scene = useSceneProgress();
  const p = progress ?? scene;
  const canvas = useRef<HTMLCanvasElement>(null);
  const imgs = useRef<(HTMLImageElement | undefined)[]>([]);
  const [lite, setLite] = useState(false);
  const [near, setNear] = useState(false);
  const last = useRef(-1);

  const draw = (i: number) => {
    const c = canvas.current;
    if (!c) return;
    // nearest loaded frame at or below i, else above
    let img: HTMLImageElement | undefined;
    for (let k = i; k >= 0 && !img; k--) if (imgs.current[k]?.complete) img = imgs.current[k];
    for (let k = i + 1; k < frames.length && !img; k++) if (imgs.current[k]?.complete) img = imgs.current[k];
    if (!img || !img.naturalWidth) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = c.clientWidth * dpr;
    const h = c.clientHeight * dpr;
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    ctx.drawImage(img, (w - img.naturalWidth * s) / 2, (h - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s);
  };

  // Only start downloading frames when the sequence is within ~1.5 screens of the viewport.
  useEffect(() => {
    const el = canvas.current;
    if (!el) { setNear(true); return; }
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "150% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [lite, calm]);

  useEffect(() => {
    if (!near) return;
    const conn = (navigator as Navigator & { connection?: Conn }).connection;
    if (calm || conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType ?? "")) { setLite(true); return; }
    let cancelled = false;
    const order = [0, ...frames.map((_, i) => i).filter((i) => i % 8 === 0 && i), ...frames.map((_, i) => i).filter((i) => i % 8 !== 0)];
    const load = (i: number) => new Promise<void>((res) => {
      const im = new window.Image();
      im.decoding = "async";
      im.onload = () => { imgs.current[i] = im; if (i === 0 || Math.abs(i - last.current) < 8) draw(Math.max(0, last.current)); res(); };
      im.onerror = () => res();
      im.src = frames[i];
    });
    (async () => {
      await load(order[0]);
      draw(0);
      for (let n = 1; n < order.length && !cancelled; n += 4) await Promise.all(order.slice(n, n + 4).map(load));
    })();
    const onResize = () => draw(Math.max(0, last.current));
    window.addEventListener("resize", onResize);
    return () => { cancelled = true; window.removeEventListener("resize", onResize); };
    // biome-ignore lint/correctness/useExhaustiveDependencies: draw is stable enough for this effect
  }, [frames, calm, near]);

  useMotionValueEvent(p, "change", (v) => {
    const i = Math.max(0, Math.min(frames.length - 1, Math.round(v * (frames.length - 1))));
    if (i !== last.current) { last.current = i; draw(i); }
  });

  if (lite || calm)
    // biome-ignore lint/performance/noImgElement: framework-agnostic package
    return <img className={className} src={poster ?? frames[Math.floor(frames.length / 2)]} alt={alt} style={{ width: "100%", height: "100%", objectFit: "cover" }} />;
  return <canvas ref={canvas} className={className} role="img" aria-label={alt} style={{ width: "100%", height: "100%", display: "block" }} />;
}
