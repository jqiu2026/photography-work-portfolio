"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react";
import { cx } from "../components/cx";
import type { Preset } from "../tokens";
import { Governor, downgrade, readChoice, readSignals, selectTier, writeChoice, type Choice, type Tier } from "./tier";
import {
  createStore,
  parseColor,
  sceneProgress,
  updateScroll,
  type Scene as SceneRecord,
  type StoreState,
} from "./store";

type StageCtx = {
  tier: Tier;
  choice: Choice;
  setChoice: (c: Choice) => void;
  store: StoreState;
  /** Fire a streak of light across the stage (the Pour / Threshold recipes use this). */
  pulse: (direction?: 1 | -1, strength?: number) => void;
  registerScene: (s: SceneRecord) => () => void;
  scenes: { id: string; label: string }[];
  world: Preset;
};

const Ctx = createContext<StageCtx | null>(null);

export function useStage(): StageCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStage must be used inside <StageProvider>");
  return c;
}

/** Safe variant for components that also render outside a stage (returns null). */
export function useStageOptional() {
  return useContext(Ctx);
}

const FALLBACK_FIELD: [number, number, number] = [0.03, 0.03, 0.05];

function cssColor(name: string, fallback: [number, number, number]) {
  return parseColor(getComputedStyle(document.documentElement).getPropertyValue(name), fallback);
}

/**
 * The persistent stage. Wrap the page content: it renders the static poster layer (always, so the first paint is
 * beautiful and complete), upgrades to a WebGL canvas when the tier allows, and exposes scenes, tier and a pulse.
 * Without JavaScript, with reduced motion, Save-Data or no WebGL the page is just the poster plus the content.
 */
export function StageProvider({
  world = "hub",
  quiet = false,
  cinema = false,
  children,
}: {
  world?: Preset;
  /** Inner pages: poster only (no canvas, no pinning), same index control and scenes. */
  quiet?: boolean;
  /** Pure-black field behind photographs (photography portfolio and gallery pages). */
  cinema?: boolean;
  children: ReactNode;
}) {
  const storeRef = useRef<StoreState>(createStore());
  const store = storeRef.current;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<import("./renderer").StageRenderer | null>(null);
  const [tier, setTier] = useState<Tier>("static");
  const [choice, setChoiceState] = useState<Choice>("auto");
  const [scenes, setScenes] = useState<{ id: string; label: string }[]>([]);

  const registerScene = useCallback(
    (s: SceneRecord) => {
      store.scenes.push(s);
      store.scenes.sort((a, b) => (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
      setScenes(store.scenes.map((x) => ({ id: x.id, label: x.label })));
      return () => {
        const i = store.scenes.indexOf(s);
        if (i >= 0) store.scenes.splice(i, 1);
        setScenes(store.scenes.map((x) => ({ id: x.id, label: x.label })));
      };
    },
    [store],
  );

  // Tier selection: once, after first paint (never before LCP), then the runtime governor.
  useEffect(() => {
    if (quiet) return;
    let cancelled = false;
    const c = readChoice();
    setChoiceState(c);
    const run = () =>
      readSignals().then((sig) => {
        if (cancelled) return;
        const t = selectTier(sig);
        setTier(t);
        document.documentElement.setAttribute("data-hl-tier", t);
      });
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number })
      .requestIdleCallback;
    if (idle) idle(run, { timeout: 1200 });
    else setTimeout(run, 200);
    return () => {
      cancelled = true;
    };
  }, [quiet]);

  const setChoice = useCallback((c: Choice) => {
    writeChoice(c);
    setChoiceState(c);
    readSignals().then((sig) => {
      const t = selectTier({ ...sig, choice: c });
      setTier(t);
      document.documentElement.setAttribute("data-hl-tier", t);
    });
  }, []);

  // Scroll + pointer feed the store; CSS custom properties let DOM effects follow the same numbers.
  useEffect(() => {
    if (tier === "static") {
      document.documentElement.style.removeProperty("--hl-wdth-boost");
      return;
    }
    const root = document.documentElement;
    let prevY = window.scrollY;
    let last = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.max(0.001, (now - last) / 1000);
      last = now;
      const y = window.scrollY;
      updateScroll(store, prevY, y, window.innerHeight, document.documentElement.scrollHeight, dt);
      prevY = y;
      root.style.setProperty("--hl-wdth-boost", String(Math.min(22, Math.abs(store.velocity) * 12).toFixed(2)));
      root.style.setProperty("--hl-progress", store.progress.toFixed(4));
      for (const s of store.scenes)
        s.el.style.setProperty("--hl-p", sceneProgress(s.el, window.innerHeight).toFixed(4));
      store.pointer.vx *= 0.85;
      store.pointer.vy *= 0.85;
    };
    raf = requestAnimationFrame(loop);
    const onMove = (e: PointerEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = 1 - e.clientY / window.innerHeight;
      store.pointer.vx = (x - store.pointer.x) * 60;
      store.pointer.vy = (y - store.pointer.y) * 60;
      store.pointer.x = x;
      store.pointer.y = y;
    };
    const down = () => {
      store.pointer.down = true;
    };
    const up = () => {
      store.pointer.down = false;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
    };
  }, [tier, store]);

  // The canvas: lazy-imported, paused off-screen/hidden, governed.
  useEffect(() => {
    if (tier === "static") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let renderer: import("./renderer").StageRenderer | null = null;
    let ro: ResizeObserver | null = null;
    const gov = new Governor();
    let lastFrame = performance.now();
    (async () => {
      try {
        const { StageRenderer } = await import("./renderer");
        if (disposed) return;
        const mk = () => {
          const sc = store.scenes[store.sceneIndex];
          const field = sc?.field ? parseColor(sc.field, FALLBACK_FIELD) : cssColor("--hl-field", FALLBACK_FIELD);
          const accent = sc?.accent ? parseColor(sc.accent, [0.4, 0.6, 1]) : cssColor("--hl-accent", [0.4, 0.6, 1]);
          return { field, accent };
        };
        const { field, accent } = mk();
        renderer = new StageRenderer(canvas, world, tier, {
          progress: 0,
          velocity: 0,
          pointer: store.pointer,
          field,
          accent,
          param: 0,
          scene: 0,
        });
        rendererRef.current = renderer;
        renderer.onFrame = () => {
          if (!renderer) return;
          const now = performance.now();
          const ms = now - lastFrame;
          lastFrame = now;
          const { field: f, accent: a } = mk();
          // ease the palette toward the scene's colours (liquid wipe stand-in)
          const lerp = (p: number[], q: number[]) => p.map((v, i) => v + (q[i] - v) * 0.06) as [number, number, number];
          renderer.inputs.field = lerp(renderer.inputs.field, f);
          renderer.inputs.accent = lerp(renderer.inputs.accent, a);
          renderer.inputs.progress = store.progress;
          renderer.inputs.velocity = store.velocity;
          renderer.inputs.param = store.param;
          renderer.inputs.scene = store.sceneIndex;
          if (ms < 250 && gov.push(ms)) setTier((t) => downgrade(t));
        };
        ro = new ResizeObserver(() => renderer?.resize());
        ro.observe(document.documentElement);
        const vis = () => (document.hidden ? renderer?.stop() : renderer?.start());
        document.addEventListener("visibilitychange", vis);
        renderer.start();
        canvas.dataset.ready = "true";
        // Arrival: one streak of light on the first visit of a session (never repeated, never under reduced motion).
        try {
          if (!sessionStorage.getItem("hl-arrived")) {
            sessionStorage.setItem("hl-arrived", "1");
            setTimeout(() => renderer?.streak(1, 1), 400);
          }
        } catch {
          setTimeout(() => renderer?.streak(1, 1), 400);
        }
        (canvas as HTMLElement & { _vis?: () => void })._vis = vis;
      } catch {
        // float targets or WebGL2 failed after all: stay on the poster
        setTier("static");
      }
    })();
    return () => {
      disposed = true;
      const v = (canvas as HTMLElement & { _vis?: () => void })._vis;
      if (v) document.removeEventListener("visibilitychange", v);
      ro?.disconnect();
      renderer?.destroy();
      rendererRef.current = null;
      canvas.dataset.ready = "";
    };
  }, [tier, world, store]);

  const pulse = useCallback((direction: 1 | -1 = 1, strength = 1) => {
    rendererRef.current?.streak(direction, strength);
  }, []);

  const value = useMemo<StageCtx>(
    () => ({ tier, choice, setChoice, store, pulse, registerScene, scenes, world }),
    [tier, choice, setChoice, store, pulse, registerScene, scenes, world],
  );

  return (
    <Ctx.Provider value={value}>
      <div className="hl-stage" aria-hidden="true" data-world={world} data-cinema={cinema || undefined}>
        <div className="hl-stage__poster" />
        {tier !== "static" ? <canvas ref={canvasRef} className="hl-stage__canvas" /> : null}
      </div>
      {children}
    </Ctx.Provider>
  );
}

/**
 * A scene: a real section of the page (anchor target, landmark) that also tells the stage its palette and how its
 * local progress maps to the world's scalar. Without JS it is simply a section.
 */
export function Scene({
  id,
  label,
  as: Tag = "section",
  field,
  accent,
  param,
  pin,
  className,
  children,
  ...rest
}: {
  id: string;
  label: string;
  as?: ElementType;
  field?: string;
  accent?: string;
  param?: (p: number) => number;
  /** Extra scroll distance, in viewport heights, that the content stays pinned (CSS sticky inside a tall wrapper) */
  pin?: number;
  className?: string;
  children: ReactNode;
} & Record<string, unknown>) {
  const ref = useRef<HTMLElement>(null);
  const stage = useStageOptional();
  const register = stage?.registerScene;
  // biome-ignore lint/correctness/useExhaustiveDependencies: the scene record is rebuilt only when its identity changes
  useEffect(() => {
    if (!register || !ref.current) return;
    return register({ id, label, el: ref.current, field, accent, param });
  }, [register, id, label, field, accent]);
  return (
    <Tag
      ref={ref}
      id={id}
      data-hl-scene
      aria-label={label}
      className={cx("hl-scene", pin ? "hl-scene--pinned" : undefined, className)}
      style={pin ? ({ "--hl-pin": pin } as React.CSSProperties) : undefined}
      {...rest}
    >
      {pin ? <div className="hl-scene__sticky">{children}</div> : children}
    </Tag>
  );
}
