/**
 * Quality tiers for the stage (docs/project/redesign-brief.md section 3.4). Pure functions: the signals are read once
 * by `readSignals` (browser) and `selectTier` decides, so every rule is unit-tested without a browser.
 *   full    fluid + streaks + halation
 *   reduced cheaper passes, lower resolution, capped frame rate
 *   static  no canvas: posters and CSS only (also the no-JS state)
 */
export type Tier = "full" | "reduced" | "static";
export type Choice = "auto" | "full" | "calm";

export type Signals = {
  reducedMotion: boolean;
  saveData: boolean;
  /** navigator.connection.effectiveType, when present */
  effectiveType?: string;
  webgl2: boolean;
  /** The visitor's stored "Motion" choice: auto, full (capability result) or calm (static). */
  choice: Choice;
  /** Battery level 0..1 and whether it is charging, when the Battery API exists */
  battery?: { level: number; charging: boolean };
  deviceMemory?: number;
  hardwareConcurrency?: number;
  touch: boolean;
  /** 75th percentile frame time (ms) of the probe, when it ran */
  probeP75?: number;
};

const SLOW = new Set(["slow-2g", "2g", "3g"]);

/** First match wins. Order matters and is documented in the brief. */
export function selectTier(s: Signals): Tier {
  if (s.reducedMotion) return "static";
  if (s.saveData || (s.effectiveType && SLOW.has(s.effectiveType))) return "static";
  if (!s.webgl2) return "static";
  if (s.choice === "calm") return "static";
  if (s.battery && s.battery.level < 0.2 && !s.battery.charging) return "reduced";
  const weak =
    (s.deviceMemory !== undefined && s.deviceMemory <= 2) ||
    (s.touch && s.hardwareConcurrency !== undefined && s.hardwareConcurrency <= 4);
  if (weak) return "reduced";
  if (s.probeP75 !== undefined) {
    if (s.probeP75 > 40) return "static";
    if (s.probeP75 > 24) return "reduced";
  }
  return "full";
}

/** Runtime governor: one step down when the moving average of frame time stays above the limit. */
export function downgrade(t: Tier): Tier {
  return t === "full" ? "reduced" : "static";
}

export class Governor {
  private samples: number[] = [];
  private slowMs = 0;
  constructor(
    private limit = 28,
    private window = 60,
    private sustainMs = 2000,
  ) {}
  /** Feed one frame time (ms). Returns true when the tier should drop. */
  push(frameMs: number): boolean {
    this.samples.push(frameMs);
    if (this.samples.length > this.window) this.samples.shift();
    if (this.samples.length < this.window) return false;
    const avg = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
    this.slowMs = avg > this.limit ? this.slowMs + frameMs : 0;
    if (this.slowMs >= this.sustainMs) {
      this.reset();
      return true;
    }
    return false;
  }
  reset() {
    this.samples = [];
    this.slowMs = 0;
  }
}

/** Per-tier render settings the stage reads. */
export const tierSettings = {
  full: { sim: 128, dye: 512, dprCap: 1.5, fps: 60, vorticity: true, pressureIterations: 20, streakSegments: 24 },
  reduced: { sim: 64, dye: 256, dprCap: 1, fps: 30, vorticity: false, pressureIterations: 10, streakSegments: 10 },
} as const;

const KEY = "hl-motion";
export function readChoice(): Choice {
  try {
    const v = localStorage.getItem(KEY);
    return v === "full" || v === "calm" ? v : "auto";
  } catch {
    return "auto";
  }
}
export function writeChoice(c: Choice) {
  try {
    if (c === "auto") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, c);
  } catch {}
}

type NavigatorExtras = Navigator & {
  connection?: { saveData?: boolean; effectiveType?: string };
  deviceMemory?: number;
  getBattery?: () => Promise<{ level: number; charging: boolean }>;
};

function hasWebgl2(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!c.getContext("webgl2");
  } catch {
    return false;
  }
}

export async function readSignals(): Promise<Signals> {
  const n = navigator as NavigatorExtras;
  let battery: Signals["battery"];
  try {
    const b = await n.getBattery?.();
    if (b) battery = { level: b.level, charging: b.charging };
  } catch {}
  return {
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    saveData: n.connection?.saveData === true,
    effectiveType: n.connection?.effectiveType,
    webgl2: hasWebgl2(),
    choice: readChoice(),
    battery,
    deviceMemory: n.deviceMemory,
    hardwareConcurrency: n.hardwareConcurrency,
    touch: matchMedia("(pointer: coarse)").matches,
  };
}
