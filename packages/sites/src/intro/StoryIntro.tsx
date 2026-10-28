"use client";

import { type CSSProperties, Fragment, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SCENES, type SceneName } from "./scenes";
import "./intro.css";

export type IntroChapter = {
  /** short name in the counter ("Scores") */
  name: string;
  /** the line that rises in */
  title: string;
  line?: string;
  scene: SceneName;
  /** a photograph for this chapter; the scene glows over it */
  image?: { src: string; srcSet?: string; alt: string; color?: string };
};

const REDUCE = "(prefers-reduced-motion: reduce)";
const FADE = 0.9;

/**
 * The opening of a site, told in a few chapters like the photography site's story: full-screen scenes, a counter, a
 * line that rises in, and a bar with Pause, the chapters and Skip the story. It plays by itself; arrows, the chapter
 * marks and Pause hand control to the visitor. Skip, the end, Escape or scrolling fades it away to the page below.
 * With reduced motion or without script it never appears and the page is complete on its own.
 */
export function StoryIntro({
  site,
  chapters,
  accent,
  seconds = 5.5,
}: { site: string; chapters: IntroChapter[]; accent: string; seconds?: number }) {
  // unknown until mounted (the cover holds meanwhile); true means no intro at all
  const [reduce, setReduce] = useState<boolean | null>(null);
  useEffect(() => setReduce(matchMedia(REDUCE).matches), []);
  const [open, setOpen] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const canvas = useRef<HTMLCanvasElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const skipBtn = useRef<HTMLButtonElement>(null);
  const st = useRef({ index: 0, prev: -1, since: 0, t: 0, playing: true, progress: 0 });

  const close = useCallback(() => {
    setLeaving(true);
    window.setTimeout(() => setOpen(false), 700);
    document.documentElement.classList.remove("si-on");
  }, []);

  const go = useCallback(
    (i: number, byHand = true) => {
      const s = st.current;
      const n = Math.max(0, Math.min(chapters.length - 1, i));
      if (n === s.index) return;
      s.prev = s.index;
      s.index = n;
      s.since = 0;
      s.progress = 0;
      setIndex(n);
      if (byHand) {
        s.playing = false;
        setPlaying(false);
      }
    },
    [chapters.length],
  );

  // nothing to show with reduced motion: take the cover down at once
  useEffect(() => {
    if (reduce === null) return;
    if (reduce) {
      document.documentElement.classList.remove("si-on");
      setOpen(false);
    } else root.current?.focus({ preventScroll: true });
  }, [reduce]);

  // the clock and the painting
  useEffect(() => {
    if (reduce !== false || !open) return;
    const cv = canvas.current;
    const c = cv?.getContext("2d");
    if (!cv || !c) return;
    const s = st.current;
    let raf = 0;
    let last = performance.now();
    const size = () => {
      const dpr = Math.min(1.5, devicePixelRatio || 1);
      const q = Math.max(1, (innerWidth * dpr) / 1600);
      cv.width = Math.round((innerWidth * dpr) / q);
      cv.height = Math.round((innerHeight * dpr) / q);
    };
    size();
    addEventListener("resize", size);
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      s.t += dt;
      s.since += dt;
      if (s.playing) {
        s.progress = Math.min(1, s.progress + dt / seconds);
        if (s.progress >= 1) {
          if (s.index < chapters.length - 1) go(s.index + 1, false);
          else {
            s.playing = false;
            setPlaying(false);
          }
        }
      }
      root.current?.style.setProperty("--si-p", String(s.progress));
      const w = cv.width;
      const h = cv.height;
      const k = Math.min(1, s.since / FADE);
      if (s.prev >= 0 && k < 1) {
        SCENES[chapters[s.prev].scene](c, w, h, s.t);
        c.globalAlpha = k;
      }
      SCENES[chapters[s.index].scene](c, w, h, s.t);
      c.globalAlpha = 1;
      if (!document.hidden) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    const vis = () => {
      if (!document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener("visibilitychange", vis);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", size);
      document.removeEventListener("visibilitychange", vis);
    };
  }, [reduce, open, chapters, seconds, go]);

  // keys, the wheel and a swipe
  useEffect(() => {
    if (reduce !== false || !open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return close();
      if (e.key === "ArrowRight") return go(st.current.index + 1);
      if (e.key === "ArrowLeft") return go(st.current.index - 1);
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        if ((e.target as HTMLElement).closest("button")) return;
        e.preventDefault();
        close();
      }
    };
    let y0 = 0;
    const onWheel = (e: WheelEvent) => e.deltaY > 30 && close();
    const onTouchStart = (e: TouchEvent) => {
      y0 = e.touches[0]?.clientY ?? 0;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (y0 - (e.changedTouches[0]?.clientY ?? y0) > 60) close();
    };
    addEventListener("keydown", onKey);
    addEventListener("wheel", onWheel, { passive: true });
    addEventListener("touchstart", onTouchStart, { passive: true });
    addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      removeEventListener("keydown", onKey);
      removeEventListener("wheel", onWheel);
      removeEventListener("touchstart", onTouchStart);
      removeEventListener("touchend", onTouchEnd);
    };
  }, [reduce, open, close, go]);

  // no page scroll behind it while it plays
  useEffect(() => {
    if (reduce !== false || !open) return;
    const html = document.documentElement;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = "";
    };
  }, [reduce, open]);

  if (reduce !== false || !open) return null;
  const ch = chapters[index];
  const last = index === chapters.length - 1 && !playing;
  // straight into body, so no ancestor's stacking context can put the page's cover above it
  return createPortal(
    <div
      ref={root}
      className="si"
      data-leaving={leaving ? "" : undefined}
      role="region"
      aria-roledescription="introduction"
      aria-label={`${site}: introduction`}
      tabIndex={-1}
      style={{ "--si-accent": accent } as CSSProperties}
    >
      {ch.image ? (
        <img
          key={ch.image.src}
          className="si-photo"
          src={ch.image.src}
          srcSet={ch.image.srcSet}
          sizes="100vw"
          alt={ch.image.alt}
          style={{ backgroundColor: ch.image.color }}
        />
      ) : null}
      <canvas ref={canvas} className="si-canvas" data-over-photo={ch.image ? "" : undefined} aria-hidden />
      <div className="si-shade" aria-hidden />
      <p className="si-brand" aria-hidden>
        Jerry Qiu / {site}
      </p>
      <p className="si-count" aria-hidden>
        <b>{String(index + 1).padStart(2, "0")}</b> / {String(chapters.length).padStart(2, "0")} {ch.name}
      </p>
      <div className="si-words" key={index} aria-live="polite">
        <p className="si-title">
          {ch.title.split(" ").map((word, i) => (
            <Fragment key={`${word}-${i}`}>
              <span style={{ "--i": i } as CSSProperties}>{word}</span>{" "}
            </Fragment>
          ))}
        </p>
        {ch.line ? <p className="si-line">{ch.line}</p> : null}
      </div>
      <div className="si-bar">
        <button
          type="button"
          className="si-play"
          onClick={() => {
            const s = st.current;
            if (!s.playing && s.index === chapters.length - 1 && s.progress >= 1) {
              go(0, false);
            }
            s.playing = !s.playing;
            setPlaying(s.playing);
          }}
        >
          {playing ? "Pause" : last ? "Replay" : "Play"}
        </button>
        <ol className="si-marks" aria-label="Chapters">
          {chapters.map((c, i) => (
            <li key={c.name}>
              <button
                type="button"
                aria-label={`Chapter ${i + 1}: ${c.name}`}
                aria-current={i === index ? "step" : undefined}
                data-done={i < index ? "" : undefined}
                onClick={() => go(i)}
              >
                <span />
              </button>
            </li>
          ))}
        </ol>
        <span className="si-state" aria-hidden>
          {playing ? "Playing" : "Paused"}
        </span>
        <button ref={skipBtn} type="button" className="si-skip" onClick={close}>
          {last ? `Into the ${site.toLowerCase()} site` : "Skip the story"} <span aria-hidden>→</span>
        </button>
      </div>
    </div>,
    document.body,
  );
}

/**
 * Put this in <head>: before the first paint of the home page it shows a black cover (only when motion is allowed and
 * script runs), so the page does not flash before the intro mounts. The intro takes it down; it also fades by itself.
 */
export function IntroCover() {
  if (typeof window !== "undefined") return null;
  return (
    <script
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html:
          '(function(){try{if(location.pathname==="/"&&!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.classList.add("si-on")}catch(e){}})()',
      }}
    />
  );
}
