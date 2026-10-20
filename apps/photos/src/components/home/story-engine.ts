"use client";

import { type RefObject, useEffect, useRef, useSyncExternalStore } from "react";
import { CHAPTERS, RAMP } from "@/content/home-story";

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const rgb = (h: string) => [1, 3, 5].map((i) => Number.parseInt(h.slice(i, i + 2), 16));
const mix = (a: string, b: string, t: number) => {
  const x = rgb(a);
  const y = rgb(b);
  return `rgb(${x.map((v, i) => Math.round(v + ((y[i] ?? v) - v) * t)).join(" ")})`;
};

/* ---- the story store: which chapter is on screen, and how the automatic mode is doing ---- */

export type Mode = "auto" | "manual" | "paused" | "done";
type Snapshot = { chapter: number; mode: Mode; motion: boolean; bar: boolean };

let snap: Snapshot = { chapter: 0, mode: "manual", motion: false, bar: false };
const subs = new Set<() => void>();
function set(next: Partial<Snapshot>) {
  const merged = { ...snap, ...next };
  if (
    merged.chapter === snap.chapter &&
    merged.mode === snap.mode &&
    merged.motion === snap.motion &&
    merged.bar === snap.bar
  )
    return;
  snap = merged;
  for (const s of subs) s();
}
export function useStory(): Snapshot {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    () => snap,
    () => snap,
  );
}

/* ---- per element progress listeners (scenes that need the number in React, not only in CSS) ---- */

const listeners = new WeakMap<Element, Set<(p: number) => void>>();
/** Calls `fn` with the eased progress (0 to 1) of the `data-scroll` element in `ref` whenever it changes. */
export function useProgress(ref: RefObject<Element | null>, fn: (p: number) => void) {
  const latest = useRef(fn);
  latest.current = fn;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const call = (p: number) => latest.current(p);
    const set = listeners.get(el) ?? new Set();
    set.add(call);
    listeners.set(el, set);
    return () => {
      set.delete(call);
    };
  }, [ref]);
}

/** The page y that puts a pinned element at progress `p`. */
export function yForProgress(el: HTMLElement, p: number) {
  const top = el.getBoundingClientRect().top + scrollY;
  return top + p * Math.max(0, el.offsetHeight - innerHeight);
}

/* ---- the scroll engine ---- */

export const motionAllowed = () =>
  typeof document !== "undefined" &&
  document.documentElement.hasAttribute("data-hj-motion") &&
  !matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * One scroll engine for the whole page. Every element marked `data-scroll` gets `--p` (0 to 1, eased so it glides):
 *  - `pin`: through a tall section with a sticky stage (0 at its top, 1 when its end reaches the bottom of the window),
 *  - `pass`: the whole way from entering at the bottom of the window to leaving at the top.
 * Elements near the screen also get `data-live` (their CSS loops run only then). It also keeps the chapter store, the
 * heads-up display's segments (`[data-seg]` get `--f`, how far through their chapter the reader is) and the page
 * `--page`. With no motion (reduced motion, calm, no script) it writes each element's `data-still` once and stops.
 */
export function useScrollStory(root: RefObject<HTMLElement | null>, motion: boolean) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const items = [...el.querySelectorAll<HTMLElement>("[data-scroll]")];
    if (!motion) {
      for (const it of items) {
        it.style.setProperty("--p", it.dataset.still ?? "1");
        it.setAttribute("data-live", "");
      }
      return;
    }
    const chapters = [...el.querySelectorAll<HTMLElement>("[data-chapter]")];
    const segs = [...document.querySelectorAll<HTMLElement>("[data-seg]")];
    const state = items.map(() => ({ target: 0, current: -1 }));
    let raf = 0;
    let last = 0;
    let k = 0.4;
    const ease = (s: { target: number; current: number }) => {
      if (s.current < 0) s.current = s.target;
      else s.current += (s.target - s.current) * k;
      if (Math.abs(s.target - s.current) < 0.0007) s.current = s.target;
      return s.current === s.target;
    };
    const frame = (now: number) => {
      // glide at the same speed on any display: about 0.4 of the gap per 60 Hz frame
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      k = 1 - (1 - 0.4) ** (dt * 60);
      let done = true;
      items.forEach((it, i) => {
        const s = state[i];
        if (!s) return;
        const before = s.current;
        done = ease(s) && done;
        if (s.current !== before) {
          it.style.setProperty("--p", s.current.toFixed(4));
          const ls = listeners.get(it);
          if (ls) for (const l of ls) l(s.current);
        }
      });
      if (done) last = 0;
      raf = done ? 0 : requestAnimationFrame(frame);
    };
    let tops: number[] = [];
    const layout = () => {
      tops = chapters.map((c) => c.getBoundingClientRect().top + scrollY);
    };
    const measure = () => {
      const vh = innerHeight;
      items.forEach((it, i) => {
        const r = it.getBoundingClientRect();
        const mode = it.dataset.scroll;
        const t = mode === "pin" ? -r.top / Math.max(1, r.height - vh) : (vh - r.top) / (vh + r.height);
        const s = state[i];
        if (s) s.target = clamp(t);
        it.toggleAttribute("data-live", r.bottom > -vh * 0.2 && r.top < vh * 1.2);
      });
      // chapters: the one holding the middle of the window, and how far through each the reader is
      const y = scrollY;
      let active = 0;
      tops.forEach((t, i) => {
        if (y + vh * 0.5 >= t) active = i;
      });
      // the timeline bar leaves the booking chapter once the scroll to the shoot is under way
      const shoot = chapters.findIndex((c) => c.dataset.chapter === "moment");
      set({ chapter: active, bar: shoot >= 0 && y + vh * 0.7 >= (tops[shoot] ?? Number.POSITIVE_INFINITY) });
      // one continuous backdrop: the page color glides from each chapter's color to the next, in the last screen of a chapter
      let c = 0;
      tops.forEach((t, i) => {
        if (t - vh <= y) c = i;
      });
      const into = CHAPTERS[c]?.bg ?? "#050505";
      const from = c > 0 ? (CHAPTERS[c - 1]?.bg ?? into) : into;
      const k = clamp((y - ((tops[c] ?? 0) - vh)) / vh);
      el.style.setProperty("--bgc", mix(from, into, k * k * (3 - 2 * k)));
      const last = chapters[chapters.length - 1];
      const end = last ? tops[tops.length - 1]! + Math.max(0, last.offsetHeight - vh) : 0;
      segs.forEach((seg, i) => {
        const a = tops[i] ?? 0;
        const b = i + 1 < tops.length ? tops[i + 1]! : end;
        seg.style.setProperty("--f", clamp((y - a) / Math.max(1, b - a)).toFixed(4));
      });
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const remeasure = () => {
      layout();
      measure();
    };
    remeasure();
    addEventListener("scroll", measure, { passive: true });
    addEventListener("resize", remeasure);
    const ro = new ResizeObserver(remeasure);
    ro.observe(document.documentElement);
    return () => {
      removeEventListener("scroll", measure);
      removeEventListener("resize", remeasure);
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [root, motion]);
}

/* ---- the automatic mode ---- */

export function chapterTops(root: HTMLElement) {
  const els = [...root.querySelectorAll<HTMLElement>("[data-chapter]")];
  const tops = els.map((c) => c.getBoundingClientRect().top + scrollY);
  const last = els[els.length - 1];
  const pinned = last ? tops[tops.length - 1]! + Math.max(0, last.offsetHeight - innerHeight) : 0;
  // the story plays on to the bottom of the page: the questions and the end
  const end = Math.max(pinned, document.documentElement.scrollHeight - innerHeight);
  // each chapter is two moves: the animation while it is pinned, then the scroll over to the next chapter
  const moves: { a: number; b: number; secs: number; ramp?: number; cross?: boolean }[] = [];
  els.forEach((c, i) => {
    const top = tops[i]!;
    const pinEnd = Math.min(end, top + Math.max(0, c.offsetHeight - innerHeight));
    const lastOne = i + 1 >= tops.length;
    const next = lastOne ? end : tops[i + 1]!;
    const id = CHAPTERS[i]?.id;
    const secs = CHAPTERS[i]?.seconds ?? 5;
    if (pinEnd - top > 2) moves.push({ a: top, b: pinEnd, secs, ramp: id ? RAMP[id] : undefined });
    if (next - pinEnd > 2) moves.push({ a: pinEnd, b: next, secs: lastOne ? 2.4 : CROSS_SECONDS, cross: true });
  });
  return { tops, end, moves };
}

/** How long the scroll from one pinned chapter to the next takes in the automatic mode. */
const CROSS_SECONDS = 1.1;

/** Scroll position `y` to the page without the page's smooth scrolling getting in the way. */
const jump = (y: number) => scrollTo({ top: y, behavior: "instant" as ScrollBehavior });

/**
 * Plays the story: scrolls the page slowly, chapter by chapter, at the pace set in the story data. Any wheel, touch,
 * key or scrollbar movement by the reader hands control back (`manual`); `resume()` carries on from where they are.
 * It holds while the pointer or focus is on something marked `data-hold`, while the tab is hidden, and under reduced
 * motion it never starts.
 */
export function useAutoplay(root: RefObject<HTMLElement | null>, enabled: boolean) {
  const mode = useRef<Mode>("manual");
  const hold = useRef(false);
  const lastSet = useRef(-1);

  useEffect(() => {
    const el = root.current;
    if (!enabled || !el) {
      set({ mode: "manual", motion: false });
      return;
    }
    set({ motion: true });
    let raf = 0;
    let prev = 0;
    let pos = scrollY;
    let cache = chapterTops(el);
    const refresh = () => {
      cache = chapterTops(el);
    };
    const change = (m: Mode) => {
      mode.current = m;
      set({ mode: m });
      cancelAnimationFrame(raf);
      raf = 0;
      if (m === "auto") {
        pos = scrollY;
        prev = 0;
        at = -1;
        lastSet.current = -1;
        raf = requestAnimationFrame(tick);
      }
    };
    // every move eases in and eases out (u is how far through its time the move is)
    let u = 0;
    let at = -1;
    const cubic = (x: number) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);
    // a capped speed: ease in for `r` seconds, one steady speed, ease out for `r` seconds (sine ramps)
    const trapezoid = (x: number, T: number, r: number) => {
      const v = 1 / (T - r);
      const ramp = (t: number) => v * (t / 2 - (r * Math.sin((Math.PI * t) / r)) / (2 * Math.PI));
      const t = x * T;
      if (t < r) return ramp(t);
      if (t > T - r) return 1 - ramp(T - t);
      return (v * r) / 2 + v * (t - r);
    };
    const ease = (x: number, mv: { secs: number; ramp?: number }) =>
      mv.ramp ? trapezoid(x, mv.secs, mv.ramp) : cubic(x);
    const unease = (y: number, mv: { secs: number; ramp?: number }) => {
      let lo = 0;
      let hi = 1;
      for (let i = 0; i < 16; i++) {
        const m = (lo + hi) / 2;
        if (ease(m, mv) < y) lo = m;
        else hi = m;
      }
      return (lo + hi) / 2;
    };
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = prev ? Math.min(0.05, (now - prev) / 1000) : 0;
      prev = now;
      if (document.hidden) return;
      // something else moved the page (scrollbar drag, an anchor, find in page): that is the reader
      if (lastSet.current >= 0 && Math.abs(scrollY - lastSet.current) > 6) return change("manual");
      const { moves, end } = cache;
      if (pos >= end - 1) return change("done");
      let m = 0;
      moves.forEach((mv, i) => {
        if (pos >= mv.a - 1) m = i;
      });
      const mv = moves[m];
      if (!mv) return change("done");
      // the pointer resting on a mockup holds the story still, but never in the middle of the scroll between chapters
      if (hold.current && !mv.cross) return;
      if (m !== at) {
        at = m;
        u = unease(Math.min(1, Math.max(0, (pos - mv.a) / Math.max(1, mv.b - mv.a))), mv);
      }
      u = Math.min(1, u + dt / mv.secs);
      pos = Math.min(end, u >= 1 ? mv.b + 0.5 : mv.a + (mv.b - mv.a) * ease(u, mv));
      lastSet.current = pos;
      jump(pos);
    };
    const toManual = () => {
      if (mode.current === "auto") change("manual");
    };
    const onKey = (e: KeyboardEvent) => {
      // keys that move the page (not Tab, not typing into a field)
      if (!["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " ", "Spacebar"].includes(e.key)) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [role=slider], [contenteditable], button, a")) return;
      toManual();
    };
    const enter = (e: Event) => {
      if ((e.target as HTMLElement).closest?.("[data-hold]")) hold.current = true;
    };
    const leave = (e: Event) => {
      const t = e.target as HTMLElement;
      if (t.closest?.("[data-hold]") && !t.closest("[data-hold]:hover, [data-hold]:focus-within")) hold.current = false;
    };
    const sync = () => {
      hold.current = Boolean(el.querySelector("[data-hold]:hover, [data-hold]:focus-within"));
    };
    addEventListener("wheel", toManual, { passive: true });
    addEventListener("touchstart", toManual, { passive: true });
    addEventListener("keydown", onKey);
    addEventListener("resize", refresh);
    el.addEventListener("pointerover", enter);
    el.addEventListener("pointerout", leave);
    el.addEventListener("focusin", enter);
    el.addEventListener("focusout", sync);
    el.addEventListener("pointerout", sync);
    const ro = new ResizeObserver(refresh);
    ro.observe(document.documentElement);
    // a first visit plays after a beat; coming back to a place (a link with #, a restored scroll) does not
    const wantAuto = !location.hash && scrollY < 40;
    mode.current = wantAuto ? "auto" : "manual";
    set({ mode: mode.current });
    const start = setTimeout(() => {
      refresh();
      if (mode.current !== "auto") return;
      if (scrollY < 40) change("auto");
      else change("manual");
    }, 1400);
    const ctl = (e: Event) => {
      const m = (e as CustomEvent<Mode>).detail;
      refresh();
      change(m);
    };
    el.addEventListener("hj-mode", ctl);
    return () => {
      clearTimeout(start);
      cancelAnimationFrame(raf);
      ro.disconnect();
      removeEventListener("wheel", toManual);
      removeEventListener("touchstart", toManual);
      removeEventListener("keydown", onKey);
      removeEventListener("resize", refresh);
      el.removeEventListener("pointerover", enter);
      el.removeEventListener("pointerout", leave);
      el.removeEventListener("focusin", enter);
      el.removeEventListener("focusout", sync);
      el.removeEventListener("pointerout", sync);
      el.removeEventListener("hj-mode", ctl);
    };
  }, [root, enabled]);

  return (m: Mode) => root.current?.dispatchEvent(new CustomEvent("hj-mode", { detail: m }));
}
