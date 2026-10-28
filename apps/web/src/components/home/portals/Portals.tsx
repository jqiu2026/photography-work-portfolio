"use client";

import { type CSSProperties, type MouseEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { FRAG, VERT } from "./shader";
import { approach, type Door, diveDoor, lookOf, toGl, type WorldLink } from "./worlds";
import "./portals.css";

const REDUCE = "(prefers-reduced-motion: reduce)";
const DIVE_SECONDS = 1.15;

type Live = {
  hover: number[];
  hoverTo: number[];
  pointer: [number, number];
  pointerTo: [number, number];
  dive: number;
  diveAt: number;
  diveIdx: number;
  diveHref: string | null;
};

/**
 * The hub's home: four portals standing on a black glass floor, each a window into the world of one site. They are
 * plain links laid out in CSS; when WebGL is there, a canvas behind them draws the worlds, the light and the floor at
 * the links' positions. Looking at one lets its light into the room; following it steps through (the portal fills the
 * screen, then the site loads). With reduced motion, no WebGL or no script, each door shows a still picture of its
 * world and is an ordinary link.
 */
export function Portals({ worlds, children }: { worlds: WorldLink[]; children: ReactNode }) {
  const [reduce, setReduce] = useState<boolean | null>(null);
  const [gl, setGl] = useState(false);
  const [diving, setDiving] = useState<number | null>(null);
  const stage = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const doors = useRef<(HTMLSpanElement | null)[]>([]);
  const live = useRef<Live>({
    hover: [0, 0, 0, 0],
    hoverTo: [0, 0, 0, 0],
    pointer: [0, 0],
    pointerTo: [0, 0],
    dive: 0,
    diveAt: 0,
    diveIdx: -1,
    diveHref: null,
  });

  useEffect(() => {
    const mq = matchMedia(REDUCE);
    const set = () => setReduce(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  // coming back with the browser's back button restores the page as it was left: undo the dive
  useEffect(() => {
    const show = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      const s = live.current;
      s.dive = 0;
      s.diveIdx = -1;
      s.diveHref = null;
      setDiving(null);
    };
    addEventListener("pageshow", show);
    return () => removeEventListener("pageshow", show);
  }, []);

  useEffect(() => {
    if (reduce !== false) return;
    const cv = canvas.current;
    // hardware only: a software renderer would draw this a few frames a second and stall the page, so the still doors win
    const g = cv?.getContext("webgl", {
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
      failIfMajorPerformanceCaveat: true,
    });
    if (!cv || !g || softwareOnly(g)) return;
    const prog = program(g);
    if (!prog) return;
    g.useProgram(prog);
    const buf = g.createBuffer();
    g.bindBuffer(g.ARRAY_BUFFER, buf);
    g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
    const loc = g.getAttribLocation(prog, "p");
    g.enableVertexAttribArray(loc);
    g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0);
    const u = (name: string) => g.getUniformLocation(prog, name);
    const U = {
      res: u("uRes"),
      time: u("uTime"),
      pointer: u("uPointer"),
      door: u("uDoor"),
      hover: u("uHover"),
      accent: u("uAccent"),
      floor: u("uFloor"),
      dive: u("uDive"),
      diveIdx: u("uDiveIdx"),
      fade: u("uFade"),
    };
    g.uniform3fv(U.accent, new Float32Array(worlds.flatMap((w) => lookOf(w.key).accent)));

    // the canvas is sized to the screen; the resolution drops if frames run slow
    let quality = 1;
    let scale = 1;
    const size = () => {
      scale = Math.min(1.5, devicePixelRatio || 1) * quality;
      cv.width = Math.round(innerWidth * scale);
      cv.height = Math.round(innerHeight * scale);
      g.viewport(0, 0, cv.width, cv.height);
    };
    size();
    addEventListener("resize", size);

    const s = live.current;
    const onPointer = (e: PointerEvent) => {
      s.pointerTo = [(e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1)];
    };
    addEventListener("pointermove", onPointer, { passive: true });

    let raf = 0;
    let last = performance.now();
    let t = 0;
    let slow = 0;
    let frames = 0;
    let running = true;
    const doorData = new Float32Array(16);
    const hoverData = new Float32Array(4);
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      // adapt: if most of a second's frames were slow, draw fewer pixels
      frames++;
      if (dt > 0.026) slow++;
      if (frames >= 60) {
        if (slow > 30 && quality > 0.5) {
          quality = Math.max(0.5, quality * 0.8);
          size();
        }
        frames = 0;
        slow = 0;
      }
      const top = stage.current?.getBoundingClientRect();
      const fade = top ? Math.max(0, Math.min(1, 1 + top.top / (top.height * 0.85))) : 1;
      cv.style.opacity = String(fade);
      if (fade > 0) {
        s.pointer[0] = approach(s.pointer[0], s.pointerTo[0], 3, dt);
        s.pointer[1] = approach(s.pointer[1], s.pointerTo[1], 3, dt);
        let floor = 0;
        for (let i = 0; i < 4; i++) {
          s.hover[i] = approach(s.hover[i], s.diveIdx === i ? 1 : s.hoverTo[i], 7, dt);
          hoverData[i] = s.hover[i];
          const el = doors.current[i];
          if (!el) continue;
          const r = el.getBoundingClientRect();
          floor = Math.max(floor, r.bottom);
          let d: Door = { x: r.left, y: r.top, w: r.width, h: r.height };
          if (s.diveIdx === i) d = diveDoor(d, innerWidth, innerHeight, s.dive);
          doorData.set(toGl(d, innerHeight, scale), i * 4);
        }
        if (s.diveIdx >= 0) {
          s.dive = Math.min(1, (now - s.diveAt) / 1000 / DIVE_SECONDS);
          if (s.dive >= 1 && s.diveHref) {
            const href = s.diveHref;
            s.diveHref = null;
            location.assign(href);
          }
        }
        g.uniform2f(U.res, cv.width, cv.height);
        g.uniform1f(U.time, t);
        g.uniform2f(U.pointer, s.pointer[0], s.pointer[1]);
        g.uniform4fv(U.door, doorData);
        g.uniform1fv(U.hover, hoverData);
        g.uniform1f(U.floor, (innerHeight - floor) * scale);
        g.uniform1f(U.dive, s.dive);
        g.uniform1f(U.diveIdx, s.diveIdx);
        g.uniform1f(U.fade, fade);
        g.drawArrays(g.TRIANGLES, 0, 3);
      }
      if (running && !document.hidden) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    setGl(true);
    const vis = () => {
      if (!document.hidden && running) {
        cancelAnimationFrame(raf);
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener("visibilitychange", vis);
    const lost = (e: Event) => {
      e.preventDefault();
      running = false;
      setGl(false);
    };
    cv.addEventListener("webglcontextlost", lost);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      removeEventListener("resize", size);
      removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", vis);
      cv.removeEventListener("webglcontextlost", lost);
      setGl(false);
    };
  }, [reduce, worlds]);

  const look = (i: number, on: boolean) => {
    live.current.hoverTo[i] = on ? 1 : 0;
  };

  const step = (i: number, href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (!gl || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const s = live.current;
    if (s.diveIdx >= 0) return e.preventDefault();
    e.preventDefault();
    s.diveIdx = i;
    s.dive = 0;
    s.diveAt = performance.now();
    s.diveHref = href;
    setDiving(i);
    // if frames stall (a busy or hidden tab), go anyway
    window.setTimeout(
      () => {
        if (s.diveHref !== href) return;
        s.diveHref = null;
        location.assign(href);
      },
      DIVE_SECONDS * 1000 + 500,
    );
  };

  return (
    <section
      ref={stage}
      className="px"
      data-gl={gl ? "" : undefined}
      data-diving={diving !== null ? "" : undefined}
      aria-label="The Nexus"
    >
      {reduce === false ? <canvas ref={canvas} className="px-canvas" aria-hidden /> : null}
      <div className="px-hero">{children}</div>
      <nav className="px-gates" aria-label="Four portals, one per site">
        <ul>
          {worlds.map((w, i) => {
            const lk = lookOf(w.key);
            return (
              <li key={w.key} style={{ "--px-i": i } as CSSProperties}>
                <a
                  className="px-gate"
                  href={w.href}
                  data-world={w.key}
                  aria-describedby={`px-line-${w.key}`}
                  style={{ "--px-accent": lk.css, "--px-fallback": lk.fallback } as CSSProperties}
                  onPointerEnter={() => look(i, true)}
                  onPointerLeave={() => look(i, false)}
                  onFocus={() => look(i, true)}
                  onBlur={() => look(i, false)}
                  onClick={step(i, w.href)}
                >
                  <span
                    className="px-door"
                    aria-hidden
                    ref={(el) => {
                      doors.current[i] = el;
                    }}
                  />
                  <span className="px-label">
                    <span className="px-num" aria-hidden>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="px-name">{lk.name}</span>
                    <span className="px-site">{w.site}</span>
                  </span>
                  <span className="px-line" id={`px-line-${w.key}`}>
                    {w.line}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
      <p className="px-hint" aria-hidden>
        Look into a portal · step through to visit
      </p>
    </section>
  );
}

/** True when WebGL is drawn on the CPU (SwiftShader, llvmpipe and the like), which some browsers do not flag. */
function softwareOnly(g: WebGLRenderingContext) {
  const info = g.getExtension("WEBGL_debug_renderer_info");
  const name = String(g.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : g.RENDERER));
  return /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
}

function program(g: WebGLRenderingContext) {
  const sh = (type: number, src: string) => {
    const x = g.createShader(type);
    if (!x) return null;
    g.shaderSource(x, src);
    g.compileShader(x);
    if (!g.getShaderParameter(x, g.COMPILE_STATUS)) {
      console.warn(g.getShaderInfoLog(x));
      return null;
    }
    return x;
  };
  const v = sh(g.VERTEX_SHADER, VERT);
  const f = sh(g.FRAGMENT_SHADER, FRAG);
  const p = g.createProgram();
  if (!v || !f || !p) return null;
  g.attachShader(p, v);
  g.attachShader(p, f);
  g.linkProgram(p);
  return g.getProgramParameter(p, g.LINK_STATUS) ? p : null;
}
