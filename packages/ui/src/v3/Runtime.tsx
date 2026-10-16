"use client";

import { useEffect } from "react";
import {
  applyTier,
  parallaxOffset,
  probeFrames,
  readMotionSignals,
  readMotionChoice,
  selectMotionTier,
  writeMotionChoice,
  type MotionChoice,
  type MotionTier,
} from "./tier";

const REVEAL = "[data-reveal]:not(.is-in), [data-pull]:not(.is-in)";

function currentTier(): MotionTier {
  const t = document.documentElement.getAttribute("data-hl-tier");
  return t === "reduced" || t === "static" ? t : "full";
}

/** Re-evaluates the tier from live signals (and the optional frame probe), then writes it to <html>. */
export async function evaluateTier(probe = true): Promise<MotionTier> {
  const signals = await readMotionSignals();
  let tier = selectMotionTier(signals);
  if (tier === "full" && probe && signals.choice !== "full") {
    const probeMs = await probeFrames(2000);
    tier = selectMotionTier({ ...signals, probeMs });
  }
  applyTier(tier);
  return tier;
}

/**
 * The only client JavaScript the v3 layer needs globally: decides the motion tier, marks revealed elements, drives the
 * parallax fallback, depth scatter and the cursor label. All of it is optional; the page is finished without it.
 */
export function Runtime() {
  useEffect(() => {
    let alive = true;
    const cleanups: (() => void)[] = [];

    // Tier. The inline script already set `static` (or left it for us); refine with real signals and a short probe.
    if (document.documentElement.getAttribute("data-hl-tier") !== "static") {
      evaluateTier().then((t) => {
        if (!alive) return;
        if (t === "static") document.querySelectorAll<HTMLElement>(REVEAL).forEach((el) => el.classList.add("is-in"));
      });
    }

    // Reveal + focus pull: one observer, entering the 20..60% band of the viewport.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -22% 0px", threshold: 0.08 },
    );
    document.querySelectorAll<HTMLElement>(REVEAL).forEach((el) => io.observe(el));
    const mo = new MutationObserver(() => document.querySelectorAll<HTMLElement>(REVEAL).forEach((el) => io.observe(el)));
    mo.observe(document.body, { childList: true, subtree: true });
    cleanups.push(() => (io.disconnect(), mo.disconnect()));

    // Parallax fallback where CSS scroll-driven animations do not exist.
    const cssPar = typeof CSS !== "undefined" && CSS.supports?.("animation-timeline: view()");
    if (!cssPar) {
      let raf = 0;
      const layers = () => Array.from(document.querySelectorAll<HTMLElement>("[data-depth]"));
      const update = () => {
        raf = 0;
        if (currentTier() !== "full") {
          layers().forEach((l) => (l.style.transform = ""));
          return;
        }
        const vh = window.innerHeight;
        for (const l of layers()) {
          const host = l.parentElement ?? l;
          const r = host.getBoundingClientRect();
          if (r.bottom < -vh || r.top > vh * 2) continue;
          const p = (vh - r.top) / (vh + r.height);
          l.style.transform = `translate3d(0, ${parallaxOffset(p, Number(l.dataset.depth) || 0, vh).toFixed(1)}px, 0)`;
        }
      };
      const req = () => {
        if (!raf) raf = requestAnimationFrame(update);
      };
      addEventListener("scroll", req, { passive: true });
      addEventListener("resize", req);
      req();
      cleanups.push(() => (removeEventListener("scroll", req), removeEventListener("resize", req), cancelAnimationFrame(raf)));
    }

    // Pointer depth for [data-scatter] layers (fine pointers, full tier): up to 14 px opposite the pointer, 800 ms lag.
    if (matchMedia("(pointer: fine)").matches) {
      const onMove = (ev: PointerEvent) => {
        if (currentTier() !== "full") return;
        const x = (ev.clientX / innerWidth - 0.5) * 2;
        const y = (ev.clientY / innerHeight - 0.5) * 2;
        document.documentElement.style.setProperty("--hl3-px", String(-x));
        document.documentElement.style.setProperty("--hl3-py", String(-y));
      };
      addEventListener("pointermove", onMove, { passive: true });
      cleanups.push(() => removeEventListener("pointermove", onMove));

      // Cursor label: a 72 px circle that follows (200 ms lag) over [data-cursor] regions.
      const dot = document.createElement("div");
      dot.className = "hl3-cursor";
      dot.setAttribute("aria-hidden", "true");
      document.body.appendChild(dot);
      let tx = 0,
        ty = 0,
        cx = 0,
        cy = 0,
        raf = 0,
        on = false;
      const loop = () => {
        cx += (tx - cx) * 0.18;
        cy += (ty - cy) * 0.18;
        dot.style.transform = `translate3d(${cx - 36}px, ${cy - 36}px, 0)`;
        raf = on || Math.abs(tx - cx) > 0.5 || Math.abs(ty - cy) > 0.5 ? requestAnimationFrame(loop) : 0;
      };
      const over = (ev: PointerEvent) => {
        const host = (ev.target as Element | null)?.closest?.<HTMLElement>("[data-cursor]");
        tx = ev.clientX;
        ty = ev.clientY;
        if (host && currentTier() !== "static") {
          dot.textContent = host.dataset.cursor ?? "";
          if (!on) {
            cx = tx;
            cy = ty;
          }
          on = true;
          dot.classList.add("is-on");
          if (!raf) raf = requestAnimationFrame(loop);
        } else if (on) {
          on = false;
          dot.classList.remove("is-on");
        }
      };
      addEventListener("pointermove", over, { passive: true });
      cleanups.push(() => (removeEventListener("pointermove", over), cancelAnimationFrame(raf), dot.remove()));
    }

    return () => {
      alive = false;
      cleanups.forEach((c) => c());
    };
  }, []);
  return null;
}

/** Footer control for the "Calm" choice (kept from the earlier design; stored under hl-motion). */
export function MotionToggle({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      aria-pressed={undefined}
      onClick={(e) => {
        const next: MotionChoice = readMotionChoice() === "calm" ? "auto" : "calm";
        writeMotionChoice(next);
        if (next === "calm") {
          applyTier("static");
          document.querySelectorAll<HTMLElement>(REVEAL).forEach((el) => el.classList.add("is-in"));
        } else {
          document.documentElement.classList.add("hl-js");
          evaluateTier(false);
        }
        e.currentTarget.textContent = next === "calm" ? "Motion: calm (on)" : "Motion: calm (off)";
      }}
    >
      Motion: calm
    </button>
  );
}
