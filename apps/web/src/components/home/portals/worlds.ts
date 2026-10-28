export type WorldKey = "exposure" | "resonance" | "altitude" | "forge";

/** What the home page knows about each site; the scene adds the look. */
export type WorldLink = { key: WorldKey; site: string; href: string; line: string };

export type WorldLook = {
  key: WorldKey;
  name: string;
  /** the light that spills out of the portal (sRGB 0..1) */
  accent: [number, number, number];
  /** the same light as CSS, for the labels and the no-WebGL fallback */
  css: string;
  /** what you see through it, for the fallback's gradient */
  fallback: string;
};

/**
 * Four dimensions off one dark room. Each has its own light: the gold of a valley at noon, the violet of a void that
 * keeps time, the cyan above a cloud sea, the orange of a molten forge.
 */
export const WORLDS: WorldLook[] = [
  {
    key: "exposure",
    name: "Exposure",
    accent: [1.0, 0.78, 0.42],
    css: "#ffc76b",
    fallback: "linear-gradient(180deg, #ffe2a8 0%, #f3b45e 42%, #5d8a4a 70%, #24361f 100%)",
  },
  {
    key: "resonance",
    name: "Resonance",
    accent: [0.68, 0.48, 1.0],
    css: "#ad7bff",
    fallback: "radial-gradient(120% 80% at 50% 40%, #6b3fd6 0%, #2a1258 45%, #07030f 100%)",
  },
  {
    key: "altitude",
    name: "Altitude",
    accent: [0.45, 0.85, 1.0],
    css: "#73d9ff",
    fallback: "linear-gradient(180deg, #2e7fd1 0%, #79c4f2 48%, #eaf6ff 66%, #9fc7e6 100%)",
  },
  {
    key: "forge",
    name: "Forge",
    accent: [1.0, 0.42, 0.16],
    css: "#ff6b29",
    fallback: "radial-gradient(110% 80% at 50% 90%, #ffb347 0%, #ff5a1f 30%, #6e1208 65%, #160304 100%)",
  },
];

export const lookOf = (key: WorldKey) => WORLDS.find((w) => w.key === key) as WorldLook;

/** A portal's opening on screen, in CSS pixels from the top left of the viewport. */
export type Door = { x: number; y: number; w: number; h: number };

/**
 * The door in the canvas's own pixels with y up (as the shader sees it): centre, half width and half height. `scale` is
 * canvas pixels per CSS pixel, `height` the canvas height in CSS pixels.
 */
export function toGl(d: Door, height: number, scale: number): [number, number, number, number] {
  return [(d.x + d.w / 2) * scale, (height - (d.y + d.h / 2)) * scale, (d.w / 2) * scale, (d.h / 2) * scale];
}

/**
 * Stepping through: the chosen door slides to the middle of the screen and grows until it covers it. `t` runs 0..1;
 * the growth is slow at first and then rushes, so it reads as being pulled in.
 */
export function diveDoor(d: Door, vw: number, vh: number, t: number): Door {
  const k = Math.min(1, Math.max(0, t));
  const move = 1 - (1 - k) ** 3;
  const grow = 1 + k ** 2.6 * (Math.max(vw / d.w, vh / d.h) * 2.6);
  const cx = d.x + d.w / 2 + (vw / 2 - (d.x + d.w / 2)) * move;
  const cy = d.y + d.h / 2 + (vh / 2 - (d.y + d.h / 2)) * move;
  const w = d.w * grow;
  const h = d.h * grow;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

/** Eases a value toward a target at `rate` per second, independent of the frame rate. */
export const approach = (v: number, target: number, rate: number, dt: number) =>
  v + (target - v) * (1 - Math.exp(-rate * dt));

/** How far portal `i` has opened `t` seconds after the scene starts: one after another, out of the mist, eased. */
export function bloom(t: number, i: number) {
  const k = Math.min(1, Math.max(0, (t - 0.35 - i * 0.28) / 1.5));
  return 1 - (1 - k) ** 3;
}

/** 1 with the pointer on the door, falling off over about a door's width away from it; 0 far off or with no pointer. */
export function nearness([x, y]: [number, number], r: { left: number; top: number; width: number; height: number }) {
  const dx = Math.max(r.left - x, 0, x - (r.left + r.width));
  const dy = Math.max(r.top - y, 0, y - (r.top + r.height));
  return Math.exp(-Math.hypot(dx, dy) / Math.max(1, r.width));
}

/**
 * With nothing looked at, the room drifts through the four worlds on its own: each takes a turn of about seven
 * seconds, swelling and fading, overlapping the next. 0..1 for world `i` at `t` seconds.
 */
export function tour(t: number, i: number) {
  const d = (((t / 7 - i) % 4) + 4) % 4;
  return d < 1.4 ? Math.sin((Math.PI * d) / 1.4) ** 2 : 0;
}

/**
 * Where each world's flood comes from once the portals have scrolled away (fractions of the screen, y down): the sun
 * from high on the right, the rings from the middle, the sky from overhead, the heat from below.
 */
export const FLOOD_FROM: Record<WorldKey, [number, number]> = {
  exposure: [0.85, -0.1],
  resonance: [0.5, 0.5],
  altitude: [0.5, -0.25],
  forge: [0.5, 1.15],
};
