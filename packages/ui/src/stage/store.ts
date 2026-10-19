/**
 * Stage store: a plain mutable object read by the renderer every frame (no React state per frame).
 * Scroll progress and velocity come from the window; the pointer from pointer events.
 */
export type Scene = {
  id: string;
  label: string;
  el: HTMLElement;
  /** palette overrides for this scene (CSS colors); default is the page's field and accent */
  field?: string;
  accent?: string;
  /** maps the scene's local progress (0..1) to the world's scalar (altitude, aperture, spotlight radius) */
  param?: (p: number) => number;
};

export type StoreState = {
  progress: number;
  velocity: number;
  pointer: { x: number; y: number; vx: number; vy: number; down: boolean };
  sceneIndex: number;
  param: number;
  scenes: Scene[];
};

export function createStore(): StoreState {
  return {
    progress: 0,
    velocity: 0,
    pointer: { x: 0.5, y: 0.5, vx: 0, vy: 0, down: false },
    sceneIndex: 0,
    param: 0,
    scenes: [],
  };
}

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/** Local progress of a scene: 0 when its top meets the viewport bottom, 1 when its bottom leaves the top. */
export function sceneProgress(el: HTMLElement, vh: number): number {
  const r = el.getBoundingClientRect();
  return clamp((vh - r.top) / (vh + r.height));
}

/** Parses "#rrggbb" or "rgb(r, g, b)" into 0..1 floats. Falls back to the given default. */
export function parseColor(input: string, fallback: [number, number, number]): [number, number, number] {
  const s = input.trim();
  const hex = /^#([0-9a-f]{6})$/i.exec(s);
  if (hex) {
    const n = Number.parseInt(hex[1], 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  const rgb = /^rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)/i.exec(s);
  if (rgb) return [Number(rgb[1]) / 255, Number(rgb[2]) / 255, Number(rgb[3]) / 255];
  return fallback;
}

/** Updates scroll-derived values. `dt` in seconds. Velocity is in viewport heights per second, smoothed. */
export function updateScroll(store: StoreState, prevY: number, y: number, vh: number, docH: number, dt: number) {
  const raw = dt > 0 ? (y - prevY) / vh / dt : 0;
  // critically damped follow (same family as the `settle` spring)
  store.velocity += (raw - store.velocity) * clamp(dt * 10);
  store.progress = clamp(y / Math.max(1, docH - vh));
  // current scene = the last one whose top is above the viewport's vertical centre
  let idx = 0;
  for (let i = 0; i < store.scenes.length; i++) {
    if (store.scenes[i].el.getBoundingClientRect().top <= vh * 0.5) idx = i;
  }
  store.sceneIndex = idx;
  const sc = store.scenes[idx];
  store.param = sc?.param ? sc.param(sceneProgress(sc.el, vh)) : store.progress;
}
