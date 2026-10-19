"use client";

import { type RefObject, useEffect, useRef, useSyncExternalStore } from "react";
import { CHAPTERS } from "@/content/home-story";

const clamp = (v: number) => Math.min(1, Math.max(0, v));

/* ---- the story store: which chapter is on screen, and how the automatic mode is doing ---- */

export type Mode = "auto" | "manual" | "paused" | "done";
type Snapshot = { chapter: number; mode: Mode; motion: boolean };

let snap: Snapshot = { chapter: 0, mode: "manual", motion: false };
const subs = new Set<() => void>();
function set(next: Partial<Snapshot>) {
  const merged = { ...snap, ...next };
  if (merged.chapter === snap.chapter && merged.mode === snap.mode && merged.motion === snap.motion) return;
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
    const ease = (s: { target: number; current: number }) => {
      if (s.current < 0) s.current = s.target;
      else s.current += (s.target - s.current) * 0.3;
      if (Math.abs(s.target - s.current) < 0.0007) s.current = s.target;
      return s.current === s.target;
    };
    const frame = () => {
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
      set({ chapter: active });
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
  const end = last ? tops[tops.length - 1]! + Math.max(0, last.offsetHeight - innerHeight) : 0;
  return { tops, end };
}

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
        lastSet.current = -1;
        raf = requestAnimationFrame(tick);
      }
    };
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = prev ? Math.min(0.1, (now - prev) / 1000) : 0;
      prev = now;
      if (hold.current || document.hidden) return;
      // something else moved the page (scrollbar drag, an anchor, find in page): that is the reader
      if (lastSet.current >= 0 && Math.abs(scrollY - lastSet.current) > 6) return change("manual");
      const { tops, end } = cache;
      if (pos >= end - 1) return change("done");
      let c = 0;
      tops.forEach((t, i) => {
        if (pos >= t - 1) c = i;
      });
      const a = tops[c] ?? 0;
      const b = c + 1 < tops.length ? tops[c + 1]! : end;
      const secs = CHAPTERS[c]?.seconds ?? 10;
      // quick and slow: three beats per chapter (a fast push, then a slow hold)
      const t = Math.min(1, Math.max(0, (pos - a) / Math.max(1, b - a)));
      const beat = 1 + 0.78 * Math.sin(t * Math.PI * 6);
      pos = Math.min(end, pos + ((b - a) / secs) * dt * beat);
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
