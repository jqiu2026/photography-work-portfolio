"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cx } from "../components/cx";

/**
 * Full-bleed cross-fade between slides (never a cut or a slide). With `interval` it advances on its own, pausing on
 * hover, focus, hidden tab and in the static tier. `controls` adds previous / pause / next and a mono counter.
 */
export function Dissolve({
  slides,
  captions,
  interval = 7000,
  drift = false,
  controls = false,
  label,
  className,
  onChange,
}: {
  slides: ReactNode[];
  captions?: ReactNode[];
  interval?: number;
  /** Slow Ken Burns (at most 4% scale, 1.5% translate) on the active slide. */
  drift?: boolean;
  controls?: boolean;
  label: string;
  className?: string;
  onChange?: (i: number) => void;
}) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const hold = useRef(false);
  const n = slides.length;
  const go = useCallback(
    (to: number) => {
      const next = ((to % n) + n) % n;
      setI(next);
      onChange?.(next);
    },
    [n, onChange],
  );

  useEffect(() => {
    if (!playing || n < 2 || !interval) return;
    const id = setInterval(() => {
      const t = document.documentElement.getAttribute("data-hl-tier");
      if (hold.current || document.hidden || t === "static" || !document.documentElement.classList.contains("hl-js")) return;
      setI((c) => {
        const next = (c + 1) % n;
        onChange?.(next);
        return next;
      });
    }, interval);
    return () => clearInterval(id);
  }, [playing, n, interval, onChange]);

  const num = (v: number) => String(v).padStart(2, "0");
  return (
    <div
      className={cx("hl3-dissolve", drift && "hl3-dissolve--drift", className)}
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      onPointerEnter={() => (hold.current = true)}
      onPointerLeave={() => (hold.current = false)}
      onFocus={() => (hold.current = true)}
      onBlur={() => (hold.current = false)}
    >
      {slides.map((s, k) => (
        <div
          key={k}
          className={cx("hl3-dissolve__slide", k === i && "is-active")}
          aria-hidden={k === i ? undefined : true}
          inert={k === i ? undefined : true}
        >
          {s}
        </div>
      ))}
      {controls && n > 1 ? (
        <div className="hl3-dissolve__bar">
          {captions?.[i] ? <p className="hl3-mono hl3-dissolve__cap" aria-live="polite">{captions[i]}</p> : <span />}
          <div className="hl3-dissolve__ctl">
            <span className="hl3-mono">
              {num(i + 1)} / {num(n)}
            </span>
            <button type="button" onClick={() => go(i - 1)} aria-label="Previous photograph">
              ←
            </button>
            <button type="button" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause slideshow" : "Play slideshow"}>
              {playing ? "II" : "▶"}
            </button>
            <button type="button" onClick={() => go(i + 1)} aria-label="Next photograph">
              →
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
