"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { type Gate, type HubState, paintNexus } from "./nexus/hub";
import { PAINTERS, clamp, mix, vortex } from "./nexus/paint";
import { LOOKS, type RealmLink } from "./nexus/realms";
import type { Ambience } from "./nexus/sound";
import "./nexus/nexus.css";

type Phase = "hub" | "dive" | "realm" | "return";
const DIVE = 1.5;
const BACK = 1.2;
const mod = (n: number, m: number) => ((n % m) + m) % m;

/**
 * The hub's front door: the Nexus, a stone platform in a void with four portals, one per site. Arrow keys, the gate
 * buttons or a click turn the ring; stepping through a portal dives into that world, which fills the screen, with a
 * link on to the real site. Drawn in pixels on one canvas; the text and every control are ordinary HTML on top.
 */
export function Nexus({ realms, children }: { realms: RealmLink[]; children: ReactNode }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const section = useRef<HTMLElement>(null);
  const gateButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const enterLink = useRef<HTMLAnchorElement>(null);
  const [sel, setSel] = useState(0);
  const [phase, setPhaseState] = useState<Phase>("hub");
  const [sound, setSound] = useState(false);
  const [boot, setBoot] = useState<string | null>(null);
  const audio = useRef<Ambience | null>(null);
  const st = useRef({
    target: 0,
    phase: "hub" as Phase,
    phaseT: 0,
    ring: [] as Gate[],
    hub: { rot: 0, sel: 0, reveal: 0, dive: 0, previews: [] } as HubState,
    reduce: false,
    kick: () => {},
    scale: 4,
    mx: 0,
    my: 0,
  });

  const setPhase = useCallback((p: Phase) => {
    st.current.phase = p;
    st.current.phaseT = 0;
    setPhaseState(p);
    st.current.kick();
  }, []);

  const select = useCallback((i: number) => {
    const s = st.current;
    if (s.phase !== "hub") return;
    const cur = mod(Math.round(s.target), LOOKS.length);
    let d = i - cur;
    if (d > 2) d -= 4;
    if (d < -2) d += 4;
    s.target += d;
    s.hub.sel = i;
    setSel(i);
    s.kick();
  }, []);

  const move = useCallback((d: number) => select(mod(st.current.hub.sel + d, LOOKS.length)), [select]);

  const enter = useCallback(() => {
    const s = st.current;
    if (s.phase !== "hub") return;
    try {
      history.pushState({ nexus: LOOKS[s.hub.sel].key }, "", `#${LOOKS[s.hub.sel].key}`);
    } catch {}
    setPhase(s.reduce ? "realm" : "dive");
  }, [setPhase]);

  const back = useCallback(() => {
    const s = st.current;
    if (s.phase !== "realm") return;
    if (location.hash) {
      try {
        history.replaceState(null, "", location.pathname + location.search);
      } catch {}
    }
    setPhase(s.reduce ? "hub" : "return");
  }, [setPhase]);

  // the render loop
  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const s = st.current;
    const view = cv.getContext("2d");
    const buf = document.createElement("canvas");
    const b = buf.getContext("2d");
    if (!view || !b) return;
    s.reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    s.hub.previews = LOOKS.map(() => {
      const p = document.createElement("canvas");
      p.width = 32;
      p.height = 48;
      return p;
    });
    // a link to a world (#forge) opens it straight away
    const fromHash = LOOKS.findIndex((l) => `#${l.key}` === location.hash);
    if (fromHash >= 0) {
      s.target = fromHash;
      s.hub.rot = fromHash;
      s.hub.sel = fromHash;
      s.hub.reveal = 1;
      setSel(fromHash);
      s.phase = "realm";
      setPhaseState("realm");
    }
    if (s.reduce) s.hub.reveal = 1;

    let W = 0;
    let H = 0;
    const resize = () => {
      W = innerWidth;
      H = innerHeight;
      cv.width = W;
      cv.height = H;
      s.scale = W >= 1200 ? 4 : W >= 700 ? 3.5 : 3;
      buf.width = Math.max(120, Math.round(W / s.scale));
      buf.height = Math.max(120, Math.round(H / s.scale));
      view.imageSmoothingEnabled = false;
      s.kick();
    };

    let t = 8;
    let last = performance.now();
    let raf = 0;
    let frameNo = 0;
    const frame = (now: number) => {
      raf = 0;
      const dt = s.reduce ? 0 : Math.min(0.05, (now - last) / 1000);
      last = now;
      const away = scrollY > innerHeight * 1.1;
      t += dt;
      s.phaseT += dt;
      frameNo++;
      const hub = s.hub;
      hub.reveal = Math.min(1, hub.reveal + dt / 2.6);
      hub.rot += (s.target - hub.rot) * (s.reduce ? 1 : Math.min(1, dt * 5));
      const ease = s.reduce ? 1 : Math.min(1, dt * 3);
      hub.tint = mix(hub.tint ?? LOOKS[hub.sel].accent, LOOKS[hub.sel].accent, ease);
      hub.mx = (hub.mx ?? 0) + (s.mx - (hub.mx ?? 0)) * Math.min(1, dt * 2);
      hub.my = (hub.my ?? 0) + (s.my - (hub.my ?? 0)) * Math.min(1, dt * 2);

      if (s.phase === "dive" && s.phaseT >= DIVE) setPhase("realm");
      if (s.phase === "return" && s.phaseT >= BACK) setPhase("hub");

      const bw = buf.width;
      const bh = buf.height;
      if (frameNo % 2 === 0 || s.reduce)
        hub.previews.forEach((p, i) => {
          const pc = p.getContext("2d");
          if (pc) PAINTERS[LOOKS[i].key](pc, p.width, p.height, t + i * 17);
        });
      const look = LOOKS[hub.sel];
      let wobble = 0;
      let shimmer = 0;
      const world = () => PAINTERS[look.key](b, bw, bh, t);
      if (s.phase === "hub") {
        hub.dive = 0;
        s.ring = paintNexus(b, bw, bh, t, hub);
      } else if (s.phase === "dive") {
        const p = s.phaseT;
        wobble = Math.sin((Math.PI * p) / DIVE);
        if (p < DIVE / 2) {
          hub.dive = p / (DIVE / 2);
          paintNexus(b, bw, bh, t, hub);
          vortex(b, bw, bh, t, look.accent, hub.dive * 0.8);
        } else {
          world();
          vortex(b, bw, bh, t, look.accent, 1 - (p - DIVE / 2) / (DIVE / 2));
        }
      } else if (s.phase === "realm") {
        world();
        if (look.key === "forge") shimmer = 0.6;
      } else {
        const p = s.phaseT;
        wobble = Math.sin((Math.PI * p) / BACK);
        if (p < 0.5) {
          world();
          vortex(b, bw, bh, t, look.accent, p / 0.5);
        } else {
          hub.dive = 1 - clamp((p - 0.5) / (BACK - 0.5));
          paintNexus(b, bw, bh, t, hub);
          vortex(b, bw, bh, t, look.accent, hub.dive * 0.8);
        }
      }

      // up to the screen in hard pixels; a portal makes the view swim, the forge's heat makes it shimmer
      if (wobble > 0.01 || shimmer > 0) {
        const sy = H / bh;
        for (let y = 0; y < bh; y += 2) {
          const dx =
            Math.sin(y * 0.16 + t * 6) * wobble * s.scale * 4 +
            Math.sin(y * 0.5 + t * 9) * shimmer * (y / bh) * s.scale;
          view.drawImage(buf, 0, y, bw, 2, Math.round(dx), Math.round(y * sy), W, Math.ceil(2 * sy));
        }
      } else view.drawImage(buf, 0, 0, bw, bh, 0, 0, W, H);

      cv.style.opacity = String(s.phase === "hub" ? 1 - 0.72 * clamp(scrollY / innerHeight) : 1);
      if (!s.reduce && !document.hidden) {
        if (away && s.phase === "hub") setTimeout(() => s.kick(), 120);
        else s.kick();
      }
    };
    s.kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    resize();
    addEventListener("resize", resize);
    const vis = () => !document.hidden && s.kick();
    document.addEventListener("visibilitychange", vis);
    return () => {
      cancelAnimationFrame(raf);
      s.kick = () => {};
      removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", vis);
    };
  }, [setPhase]);

  // pointer: hover a gate to turn the ring to it, click the front gate to step through
  useEffect(() => {
    const s = st.current;
    const hit = (e: PointerEvent | MouseEvent) => {
      if (s.phase !== "hub" || scrollY > innerHeight * 0.5) return null;
      if ((e.target as HTMLElement).closest("a,button,input,textarea,select,[role=dialog],.hm-dock")) return null;
      const x = e.clientX / s.scale;
      const y = e.clientY / s.scale;
      const g = [...s.ring].reverse().find((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
      return g ?? null;
    };
    const onMove = (e: PointerEvent) => {
      if (!s.reduce && e.pointerType === "mouse") {
        s.mx = (e.clientX / innerWidth) * 2 - 1;
        s.my = (e.clientY / innerHeight) * 2 - 1;
      }
      const g = hit(e);
      if (section.current) section.current.style.cursor = g ? "pointer" : "";
    };
    const onClick = (e: MouseEvent) => {
      const g = hit(e);
      if (!g) return;
      if (g.i === s.hub.sel) enter();
      else select(g.i);
    };
    addEventListener("pointermove", onMove);
    addEventListener("click", onClick);
    return () => {
      removeEventListener("pointermove", onMove);
      removeEventListener("click", onClick);
    };
  }, [enter, select]);

  // keys: arrows turn the ring while the Nexus is in view; Escape leaves a world
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = st.current;
      if (e.key === "Escape" && s.phase === "realm") return back();
      if (s.phase !== "hub" || scrollY > innerHeight * 0.5 || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement as HTMLElement | null;
      if (el?.closest("input,textarea,select,[contenteditable=true]")) return;
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        move(e.key === "ArrowRight" ? 1 : -1);
        if (el?.closest(".nx-gates")) gateButtons.current[mod(st.current.hub.sel, 4)]?.focus();
      }
    };
    const onPop = () => {
      const s = st.current;
      const i = LOOKS.findIndex((l) => `#${l.key}` === location.hash);
      if (i < 0 && s.phase === "realm") setPhase(s.reduce ? "hub" : "return");
      if (i >= 0 && s.phase === "hub") {
        select(i);
        setPhase(s.reduce ? "realm" : "dive");
      }
    };
    addEventListener("keydown", onKey);
    addEventListener("popstate", onPop);
    return () => {
      removeEventListener("keydown", onKey);
      removeEventListener("popstate", onPop);
    };
  }, [back, move, select, setPhase]);

  // a world takes the whole screen: no page scroll behind it; focus moves in and comes back out
  useEffect(() => {
    const root = document.documentElement;
    if (phase === "dive" || phase === "realm" || phase === "return") root.style.overflow = "hidden";
    else root.style.overflow = "";
    if (phase === "realm") enterLink.current?.focus({ preventScroll: true });
    if (phase === "hub" && document.activeElement === document.body)
      gateButtons.current[st.current.hub.sel]?.focus({ preventScroll: true });
    audio.current?.go(phase === "realm" || phase === "dive" ? LOOKS[st.current.hub.sel].key : "nexus");
    return () => {
      root.style.overflow = "";
    };
  }, [phase]);

  useEffect(() => () => audio.current?.close(), []);

  // arrival: a short readout while the Nexus assembles (skipped with reduced motion or a link to a world)
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || location.hash) return;
    const lines = ["> link established", "> reading coordinates", "> four gates online", "> welcome to the nexus"];
    const ids = lines.map((l, i) => setTimeout(() => setBoot(l), 250 + i * 650));
    ids.push(setTimeout(() => setBoot(null), 250 + lines.length * 650 + 500));
    return () => ids.forEach(clearTimeout);
  }, []);

  const toggleSound = async () => {
    try {
      if (!audio.current) audio.current = new (await import("./nexus/sound")).Ambience();
      if (sound) audio.current.off();
      else await audio.current.on(phase === "realm" ? LOOKS[sel].key : "nexus");
      setSound(!sound);
    } catch {
      setSound(false);
    }
  };

  const look = LOOKS[sel];
  const link = realms.find((r) => r.key === look.key);
  const host = link ? link.href.replace(/^https?:\/\//, "").replace(/\/$/, "") : "";
  return (
    <section ref={section} className="nx" data-phase={phase} aria-labelledby="h">
      <canvas ref={canvas} className="nx-canvas" aria-hidden />
      <div className="nx-scrim" aria-hidden />
      <div className="nx-hero">{children}</div>

      <div
        className="nx-console"
        role="group"
        aria-label="The Nexus: four portals"
        style={{ "--nx-accent": `rgb(${look.accent.join(",")})` } as React.CSSProperties}
      >
        <p className="nx-readout" aria-hidden>
          {boot ?? (
            <>
              <span>dimension 0</span> · the nexus · <span>{String(sel + 1).padStart(2, "0")}/04</span>
            </>
          )}
        </p>
        <div className="nx-gates">
          {LOOKS.map((l, i) => {
            const r = realms.find((x) => x.key === l.key);
            return (
              <button
                key={l.key}
                ref={(el) => {
                  gateButtons.current[i] = el;
                }}
                type="button"
                className="nx-gate"
                aria-pressed={sel === i}
                style={{ "--nx-accent": `rgb(${l.accent.join(",")})` } as React.CSSProperties}
                onClick={() => (sel === i ? enter() : select(i))}
              >
                <span className="nx-gate__name">{l.name}</span>
                <span className="nx-gate__site">{r?.site}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="nx-go"
          style={{ "--nx-accent": `rgb(${look.accent.join(",")})` } as React.CSSProperties}
          onClick={enter}
        >
          Step through to {look.name}
          <kbd aria-hidden>↵</kbd>
        </button>
        <button type="button" className="nx-sound" aria-pressed={sound} onClick={toggleSound}>
          {sound ? "Sound on" : "Sound off"}
        </button>
        <p className="nx-hint" aria-hidden>
          ← → turn the ring · click a portal
        </p>
      </div>

      {phase === "realm" && link ? (
        <div
          className="nx-world"
          role="dialog"
          aria-modal="true"
          aria-labelledby="nx-world-name"
          style={{ "--nx-accent": `rgb(${look.accent.join(",")})` } as React.CSSProperties}
        >
          <div className="nx-world__panel">
            <p className="nx-readout">
              dimension {look.dimension} · {look.mood}
            </p>
            <h2 id="nx-world-name" className="nx-world__name">
              {look.name}
            </h2>
            <p className="nx-world__site">{link.site}</p>
            <p className="nx-world__line">{link.line}</p>
            <div className="nx-world__actions">
              <a ref={enterLink} className="nx-go" href={link.href}>
                Enter {host}
              </a>
              <button type="button" className="nx-back" onClick={back}>
                Back to the Nexus <kbd aria-hidden>Esc</kbd>
              </button>
            </div>
          </div>
          <button type="button" className="nx-sound nx-sound--world" aria-pressed={sound} onClick={toggleSound}>
            {sound ? "Sound on" : "Sound off"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
