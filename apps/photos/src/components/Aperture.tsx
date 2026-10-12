"use client";

import { useEffect, useRef } from "react";

export type ApertureSlide = { key: string; caption: string; node: React.ReactNode };

const STOPS = ["1.4", "2", "2.8", "4", "5.6", "8", "11", "16"];

/**
 * Photography's signature scene: scroll is the aperture. For each photograph the iris stops down (f/1.4 to f/16) and
 * the picture pulls from soft to sharp; a mono readout shows the f-number. The blur and vignette are deliberate effects
 * confined to this scene; every photograph ends sharp and unfiltered, and the gallery pages never apply them.
 * Without JS, with reduced motion, Save-Data or Calm the slides simply stack with their captions.
 */
export function Aperture({ slides }: { slides: ApertureSlide[] }) {
  const root = useRef<HTMLDivElement>(null);
  const readout = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current;
    const scene = el?.closest<HTMLElement>("[data-hl-scene]");
    if (!el || !scene) return;
    const html = document.documentElement;
    if (!html.classList.contains("hl-js") || html.dataset.hlTier === "static") return;
    const items = Array.from(el.querySelectorAll<HTMLElement>("[data-slide]"));
    let raf = 0;
    let visible = true;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(scene);
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible || html.dataset.hlTier === "static") return;
      // 0..1 across the pinned travel (scene height minus one viewport)
      const r = scene.getBoundingClientRect();
      const travel = Math.max(1, r.height - window.innerHeight);
      const p = Math.min(1, Math.max(0, -r.top / travel));
      const n = items.length;
      const f = Math.min(n - 1e-6, p * n);
      const idx = Math.floor(f);
      const q = f - idx; // 0..1 within a slide
      items.forEach((it, i) => {
        const on = i === idx;
        const last = i === n - 1;
        const o = i === 0 ? Math.min(1, (1 - q) * 8) : Math.min(1, q * 8, last ? 1 : (1 - q) * 8);
        it.style.setProperty("--o", String(on ? Math.max(0, Math.min(1, o)) : 0));
        if (on) {
          const stop = q * (STOPS.length - 1);
          const blur = Math.max(0, 1 - q * 2.2) * 14;
          const radius = 0.78 - q * 0.22;
          it.style.setProperty("--blur", `${blur.toFixed(2)}px`);
          it.style.setProperty("--iris", radius.toFixed(3));
          if (readout.current) readout.current.textContent = `f/${STOPS[Math.round(stop)]}`;
        }
      });
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  return (
    <div ref={root} className="apt">
      <p className="apt__readout hl-eyebrow" aria-hidden="true">
        <span ref={readout}>f/1.4</span>
      </p>
      <ol className="apt__slides">
        {slides.map((s) => (
          <li key={s.key} data-slide className="apt__slide">
            <div className="apt__photo">{s.node}</div>
            <p className="apt__caption">{s.caption}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
