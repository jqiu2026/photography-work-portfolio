/**
 * Motion tiers for the v3 design (docs/project/18-design-prompt-v3.md section 1.4). No WebGL: the tiers only decide how
 * much CSS and IntersectionObserver motion runs. Pure functions, unit-tested; `readSignals`/`probeFrames` touch the browser.
 *   full     parallax, focus pull, dissolves, marquees
 *   reduced  no parallax, no focus pull; dissolves become 300 ms fades
 *   static   nothing moves (prefers-reduced-motion, "Calm", Save-Data, slow network, no JS): content simply present
 */
export type MotionTier = "full" | "reduced" | "static";
export type MotionChoice = "auto" | "full" | "calm";

export type MotionSignals = {
  reducedMotion: boolean;
  saveData: boolean;
  effectiveType?: string;
  choice: MotionChoice;
  battery?: { level: number; charging: boolean };
  deviceMemory?: number;
  hardwareConcurrency?: number;
  touch: boolean;
  /** Mean frame time (ms) of the load probe, when it ran. */
  probeMs?: number;
};

const SLOW = new Set(["slow-2g", "2g", "3g"]);

/** Mean frame time above this (about 40 fps) drops to the reduced tier. */
export const SLOW_FRAME_MS = 25;

/** First match wins. Hard stops (reduced motion, Save-Data, slow network, Calm) can never be overridden. */
export function selectMotionTier(s: MotionSignals): MotionTier {
  if (s.reducedMotion) return "static";
  if (s.choice === "calm") return "static";
  if (s.saveData || (s.effectiveType && SLOW.has(s.effectiveType))) return "static";
  if (s.choice === "full") return "full";
  if (s.battery && s.battery.level < 0.2 && !s.battery.charging) return "reduced";
  if (s.deviceMemory !== undefined && s.deviceMemory <= 2) return "reduced";
  if (s.touch && s.hardwareConcurrency !== undefined && s.hardwareConcurrency <= 4) return "reduced";
  if (s.probeMs !== undefined && s.probeMs > SLOW_FRAME_MS) return "reduced";
  return "full";
}

/** Mean of frame deltas, ignoring the first (it includes page load). */
export function meanFrameMs(deltas: number[]): number | undefined {
  const d = deltas.slice(1);
  if (d.length < 10) return undefined;
  return d.reduce((a, b) => a + b, 0) / d.length;
}

const KEY = "hl-motion";
export function readMotionChoice(): MotionChoice {
  try {
    const v = localStorage.getItem(KEY);
    return v === "full" || v === "calm" ? v : "auto";
  } catch {
    return "auto";
  }
}
export function writeMotionChoice(c: MotionChoice) {
  try {
    if (c === "auto") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, c);
  } catch {}
}

type Extras = Navigator & {
  connection?: { saveData?: boolean; effectiveType?: string };
  deviceMemory?: number;
  getBattery?: () => Promise<{ level: number; charging: boolean }>;
};

export async function readMotionSignals(): Promise<MotionSignals> {
  const n = navigator as Extras;
  let battery: MotionSignals["battery"];
  try {
    const b = await n.getBattery?.();
    if (b) battery = { level: b.level, charging: b.charging };
  } catch {}
  return {
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    saveData: n.connection?.saveData === true,
    effectiveType: n.connection?.effectiveType,
    choice: readMotionChoice(),
    battery,
    deviceMemory: n.deviceMemory,
    hardwareConcurrency: n.hardwareConcurrency,
    touch: matchMedia("(pointer: coarse)").matches,
  };
}

/** Samples requestAnimationFrame for `ms` and resolves with the mean frame time (undefined if too few frames). */
export function probeFrames(ms = 2000): Promise<number | undefined> {
  return new Promise((resolve) => {
    const deltas: number[] = [];
    let last = performance.now();
    const start = last;
    const tick = (t: number) => {
      deltas.push(t - last);
      last = t;
      if (t - start >= ms) resolve(meanFrameMs(deltas));
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/** Sets the attributes the CSS reads: `data-hl-tier` on <html>. */
export function applyTier(t: MotionTier, root: HTMLElement = document.documentElement) {
  root.setAttribute("data-hl-tier", t);
}

/** Parallax offset in px for a layer: speed (-0.15..0.25 of the scroll distance) capped at 18vh of travel. */
export function parallaxOffset(progress: number, speed: number, viewportH: number): number {
  const cap = viewportH * 0.18;
  const raw = (progress - 0.5) * viewportH * 2 * speed;
  return Math.max(-cap, Math.min(cap, raw));
}
