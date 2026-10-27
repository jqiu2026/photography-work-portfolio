/*
 * Pixel painting for the Nexus. Everything is drawn at low resolution with whole-pixel rectangles and scaled up with hard
 * edges, so every world reads as blocks. No images, no 3D: plain canvas 2D, deterministic noise, time in seconds.
 */
export type RGB = readonly [number, number, number];
export type Painter = (c: CanvasRenderingContext2D, w: number, h: number, t: number) => void;

export const TAU = Math.PI * 2;
export const hex = (h: string): RGB => {
  const n = Number.parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const rgba = (c: RGB, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
export const mix = (a: RGB, b: RGB, k: number): RGB => [
  a[0] + (b[0] - a[0]) * k,
  a[1] + (b[1] - a[1]) * k,
  a[2] + (b[2] - a[2]) * k,
];
export const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
export const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);
export const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
export const noise1 = (x: number) => {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return hash(i) * (1 - u) + hash(i + 1) * u;
};
export const noise2 = (x: number, y: number) => {
  const i = Math.floor(x);
  const j = Math.floor(y);
  const fx = x - i;
  const fy = y - j;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash(i + j * 57);
  const b = hash(i + 1 + j * 57);
  const c = hash(i + (j + 1) * 57);
  const d = hash(i + 1 + (j + 1) * 57);
  return (a * (1 - ux) + b * ux) * (1 - uy) + (c * (1 - ux) + d * ux) * uy;
};
export const fbm1 = (x: number) => (noise1(x) * 0.57 + noise1(x * 2.03 + 17) * 0.29 + noise1(x * 4.1 + 41) * 0.14) / 1;

export function fill(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, col: string) {
  c.fillStyle = col;
  c.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
}

/** A vertical gradient in hard bands (`step` pixels tall), the pixel-art way. */
export function bands(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  stops: RGB[],
  step = 2,
  alpha = 1,
) {
  for (let yy = 0; yy < h; yy += step) {
    const p = yy / Math.max(1, h - 1);
    const seg = p * (stops.length - 1);
    const i = Math.min(stops.length - 2, Math.floor(seg));
    c.fillStyle = rgba(mix(stops[i], stops[i + 1], seg - i), alpha);
    c.fillRect(Math.round(x), Math.round(y + yy), Math.round(w), step);
  }
}

/** A block with a light top-left edge and a dark bottom-right edge. */
export function block(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  base: RGB,
  light = 0.25,
  dark = 0.3,
) {
  fill(c, x, y, s, s, rgba(base));
  if (s < 3) return;
  const e = Math.max(1, Math.round(s / 6));
  fill(c, x, y, s, e, rgba(mix(base, [255, 255, 255], light)));
  fill(c, x, y, e, s, rgba(mix(base, [255, 255, 255], light * 0.6)));
  fill(c, x, y + s - e, s, e, rgba(mix(base, [0, 0, 0], dark)));
  fill(c, x + s - e, y, e, s, rgba(mix(base, [0, 0, 0], dark * 0.7)));
}

export function stars(c: CanvasRenderingContext2D, w: number, h: number, t: number, n: number, tint: RGB, spin = 0) {
  const cx = w / 2;
  const cy = h * 0.4;
  for (let i = 0; i < n; i++) {
    let x = hash(i * 3.1) * w;
    let y = hash(i * 7.7) * h;
    if (spin) {
      const a = spin * t * (0.4 + hash(i) * 0.6);
      const dx = x - cx;
      const dy = y - cy;
      x = cx + dx * Math.cos(a) - dy * Math.sin(a);
      y = cy + dx * Math.sin(a) + dy * Math.cos(a);
      if (x < 0 || y < 0 || x > w || y > h) continue;
    }
    const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * (1 + hash(i * 1.3) * 2) + i));
    const big = hash(i * 9.1) > 0.93 ? 2 : 1;
    fill(c, x, y, big, big, rgba(mix([255, 255, 255], tint, hash(i * 2.2) * 0.6), tw * (0.4 + 0.6 * hash(i * 5.5))));
  }
}

/** Blocky clouds: tiles where 2D noise passes a threshold; a tile with sky above is lit, one with sky below is shaded. */
function cloudBand(
  c: CanvasRenderingContext2D,
  w: number,
  y0: number,
  rows: number,
  T: number,
  off: number,
  seed: number,
  top: RGB,
  under: RGB,
  alpha: number,
  thresh = 0.62,
) {
  const shift = off % T;
  const base = Math.floor(off / T);
  const on = (i: number, r: number) => {
    if (r < 0 || r >= rows) return false;
    const v = noise2((i + base) * 0.21 + seed, r * 0.45 + seed * 3);
    const edge = 1 - Math.abs(r + 0.5 - rows / 2) / (rows / 2);
    return v * (0.5 + 0.5 * edge) > thresh - 0.25;
  };
  for (let i = -1; i <= w / T + 1; i++) {
    for (let r = 0; r < rows; r++) {
      if (!on(i, r)) continue;
      const x = i * T - shift;
      const y = y0 + r * T;
      const lit = !on(i, r - 1);
      const shade = !on(i, r + 1);
      const body = mix(top, under, (r / rows) * 0.55);
      fill(c, x, y, T, T, rgba(body, alpha));
      if (lit) fill(c, x, y, T, Math.max(1, T / 3), rgba(mix(top, [255, 255, 255], 0.6), alpha));
      if (shade) fill(c, x, y + T - Math.max(1, T / 3), T, Math.max(1, T / 3), rgba(under, alpha));
      if (!on(i - 1, r)) fill(c, x, y, 1, T, rgba(mix(body, [255, 255, 255], 0.3), alpha));
    }
  }
}

/* ------------------------------------------------------------------------------------------------------------------
 * Exposure (photography): a daylight world of terraced grass, drifting from noon to golden hour.
 * ---------------------------------------------------------------------------------------------------------------- */
export const paintExposure: Painter = (c, w, h, t) => {
  const golden = 0.5 + 0.5 * Math.sin(t * 0.045);
  const T = Math.max(2, Math.round(h / 30));
  const top = mix(hex("#3d7de3"), hex("#4b4f9e"), golden * 0.55);
  const horizon = mix(hex("#c4e8ff"), hex("#ffcf8f"), golden);
  bands(c, 0, 0, w, Math.ceil(h * 0.8), [top, mix(top, horizon, 0.6), horizon], 2);
  // a square sun with a stepped halo
  const s = Math.max(3, Math.round(h * 0.085));
  const sx = Math.round(w * 0.74);
  const sy = Math.round(h * (0.16 + golden * 0.14));
  const sun = mix(hex("#fffbe0"), hex("#ffe1a0"), golden);
  fill(c, sx - s * 1.6, sy - s * 1.6, s * 3.2, s * 3.2, rgba(sun, 0.12));
  fill(c, sx - s, sy - s, s * 2, s * 2, rgba(sun, 0.28));
  fill(c, sx - s / 2, sy - s / 2, s, s, rgba(sun));
  cloudBand(c, w, h * 0.06, 3, T, t * 1.6, 3, [255, 255, 255], mix(horizon, [200, 210, 230], 0.5), 0.9, 0.7);
  cloudBand(c, w, h * 0.22, 2, Math.max(1, T - 1), t * 0.9, 9, [255, 255, 255], horizon, 0.55, 0.72);
  // far ridge in haze
  const haze = mix(horizon, hex("#5b7fae"), 0.45);
  for (let x = 0; x < w; x += T) {
    const k = fbm1((x + t * 1.2) * 0.011 + 5);
    const top2 = Math.round((h * 0.5 + (1 - k) * h * 0.2) / T) * T;
    fill(c, x, top2, T, h - top2, rgba(haze));
  }
  // birds
  for (let i = 0; i < 4; i++) {
    const bx = (((t * (6 + i * 2) + hash(i) * w * 2) % (w + 40)) + w + 40) % (w + 40);
    const by = h * (0.2 + hash(i * 4.4) * 0.2) + Math.sin(t * 2 + i) * 2;
    const flap = Math.sin(t * 9 + i * 2) > 0 ? 1 : 0;
    fill(c, w - bx, by + flap, 1, 1, "rgba(30,30,50,.8)");
    fill(c, w - bx + 1, by, 1, 1, "rgba(30,30,50,.8)");
    fill(c, w - bx + 2, by + flap, 1, 1, "rgba(30,30,50,.8)");
  }
  // terraced hills of grass, dirt and stone, with trees
  const off = t * 3;
  const shift = off % T;
  const base = Math.floor(off / T);
  const grass = mix(hex("#5fb23c"), hex("#8fae3c"), golden * 0.5);
  for (let i = -1; i <= w / T + 1; i++) {
    const wx = i + base;
    const hh = Math.round((h * 0.62 + (1 - fbm1(wx * 0.06)) * h * 0.18) / T) * T;
    const x = i * T - shift;
    block(c, x, hh, T, grass, 0.3, 0.2);
    for (let y = hh + T; y < h; y += T) {
      const deep = (y - hh) / T;
      const col = deep < 3 ? hex("#7b5434") : hash(wx * 3.3 + deep) > 0.9 ? hex("#9a9a9a") : hex("#6f6f74");
      block(c, x, y, T, mix(col, [0, 0, 0], Math.min(0.5, deep * 0.05)), 0.12, 0.25);
    }
    if (hash(wx * 13.37) > 0.84 && T >= 2) {
      for (let k = 1; k <= 3; k++) block(c, x, hh - k * T, T, hex("#6b4a2b"), 0.1, 0.2);
      for (let dx = -1; dx <= 1; dx++)
        for (let dy = 0; dy < 3; dy++)
          if (!(Math.abs(dx) === 1 && dy === 0)) block(c, x + dx * T, hh - (4 + dy) * T, T, hex("#3f8f2e"), 0.2, 0.25);
    } else if (hash(wx * 7.1) > 0.7) {
      const sway = Math.sin(t * 2 + wx) > 0.3 ? 1 : 0;
      fill(c, x + T / 2 + sway, hh - 2, 1, 2, rgba(mix(grass, [255, 255, 255], 0.2)));
      if (hash(wx * 2.9) > 0.6) fill(c, x + T / 2 + sway, hh - 3, 1, 1, hash(wx) > 0.5 ? "#ff6b8a" : "#ffe36b");
    }
  }
  // pollen in the light
  for (let i = 0; i < 26; i++) {
    const px = (hash(i * 1.7) * w + t * (2 + hash(i) * 3)) % w;
    const py = h * 0.35 + hash(i * 3.9) * h * 0.5 + Math.sin(t + i) * 3;
    fill(c, px, py, 1, 1, rgba([255, 244, 200], 0.5 + 0.5 * Math.sin(t * 3 + i)));
  }
  // warm grade at golden hour
  if (golden > 0.5) fill(c, 0, 0, w, h, rgba(hex("#ff9a3c"), (golden - 0.5) * 0.16));
};

/* ------------------------------------------------------------------------------------------------------------------
 * Forge (make): a crimson cavern over a lava sea; an anvil throws sparks.
 * ---------------------------------------------------------------------------------------------------------------- */
export const paintForge: Painter = (c, w, h, t) => {
  const T = Math.max(2, Math.round(h / 30));
  bands(c, 0, 0, w, h, [hex("#120204"), hex("#3a0907"), hex("#7c1d0b"), hex("#b8360f")], 2);
  // distant basalt columns
  for (let i = 0; i < 14; i++) {
    const x = Math.round((hash(i * 5.3) * w) / T) * T;
    const top = h * (0.25 + hash(i * 2.1) * 0.3);
    fill(
      c,
      x,
      top,
      T * (1 + Math.floor(hash(i) * 2)),
      h - top,
      rgba(mix(hex("#2a0909"), hex("#5a1a10"), hash(i * 3.3) * 0.5)),
    );
    fill(c, x, top, T, 1, "rgba(255,120,60,.35)");
  }
  // jagged ceiling with dripping glow
  for (let x = 0; x < w; x += T) {
    const k = fbm1(x * 0.04 + 3);
    const d = Math.round((h * 0.06 + k * h * 0.16) / T) * T;
    fill(c, x, 0, T, d, "#1a0505");
    fill(c, x, d - 1, T, 1, "rgba(255,90,40,.45)");
    if (hash(x * 1.9) > 0.86) {
      const fall = ((t * 0.7 + hash(x)) % 1) * (h * 0.75 - d);
      fill(c, x + T / 2, d + fall, 1, 2, "#ffb347");
    }
  }
  // lava falls
  for (const fx of [0.18, 0.83]) {
    const x = Math.round((w * fx) / T) * T;
    const top = h * 0.12;
    for (let y = top; y < h * 0.8; y += T) {
      const seg = Math.floor(y / T + t * 9) % 3;
      fill(c, x, y, T, T, seg === 0 ? "#ffd25a" : seg === 1 ? "#ff8c2a" : "#ff5a1a");
    }
    fill(c, x - T, h * 0.78, T * 3, T, "rgba(255,210,90,.6)");
  }
  // lava sea
  const sea = Math.round(h * 0.8);
  for (let y = sea; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const n = noise2(x * 0.06 + t * 0.35, y * 0.25 - t * 0.2);
      const col = n > 0.72 ? "#ffe07a" : n > 0.5 ? "#ff9a2e" : n > 0.3 ? "#f2561a" : "#b8300d";
      fill(c, x, y + Math.round(Math.sin(x * 0.2 + t * 2) * 0.6), 2, 2, col);
    }
  }
  bands(c, 0, sea - h * 0.25, w, h * 0.25, [hex("#000000"), hex("#ff6a2b")], 2, 0.18);
  // the forge: a brick plinth and an anvil, sparks every beat
  const ax = Math.round(w * 0.58);
  const ay = Math.round(sea - T * 3);
  for (let i = -3; i <= 3; i++)
    for (let j = 0; j < 3; j++) block(c, ax + i * T, ay + j * T, T, hex("#2c1414"), 0.15, 0.4);
  fill(c, ax - T * 2, ay - T, T * 4, T, "#0d0505");
  fill(c, ax - T, ay - T * 2, T * 3, T, "#0d0505");
  fill(c, ax + T * 2, ay - T * 2, T, T * 0.5, "#0d0505");
  fill(c, ax - T * 2, ay - T * 2, T * 5, 1, "rgba(255,130,60,.8)");
  const beat = t % 1.15;
  if (beat < 0.08) fill(c, ax - T * 3, ay - T * 4, T * 7, T * 3, "rgba(255,220,140,.18)");
  for (let k = 0; k < 22; k++) {
    const vx = (hash(k * 3.7 + Math.floor(t / 1.15)) - 0.5) * 70;
    const vy = -30 - hash(k * 1.3) * 50;
    const x = ax + T / 2 + vx * beat;
    const y = ay - T * 2 + vy * beat + 60 * beat * beat;
    if (y < sea) fill(c, x, y, 1, 1, rgba(mix(hex("#fff3b0"), hex("#ff6a2b"), beat / 1.15), 1 - beat / 1.15));
  }
  // embers rising
  for (let i = 0; i < 40; i++) {
    const life = (t * (0.08 + hash(i) * 0.1) + hash(i * 2.3)) % 1;
    const x = hash(i * 4.1) * w + Math.sin(t * 1.5 + i) * 4;
    const y = sea - life * h * 0.85;
    fill(c, x, y, 1, 1, rgba(hex(i % 3 ? "#ff7a2a" : "#ffd25a"), 1 - life));
  }
};

/* ------------------------------------------------------------------------------------------------------------------
 * Resonance (music): a violet void; obsidian pillars on a pale island light up like an equalizer on the beat.
 * ---------------------------------------------------------------------------------------------------------------- */
export const BPM = 92;
export const paintResonance: Painter = (c, w, h, t) => {
  const T = Math.max(2, Math.round(h / 32));
  const beatN = (t * BPM) / 60;
  const phase = beatN % 1;
  const env = Math.exp(-phase * 4);
  bands(c, 0, 0, w, h, [hex("#030108"), hex("#0d0420"), hex("#1c0a36"), hex("#0a0414")], 2);
  stars(c, w, h, t, Math.round((w * h) / 140), hex("#c9a8ff"), 0.004);
  // the waveform halo
  const cx = w / 2;
  const cy = h * 0.3;
  const R = Math.min(w, h) * 0.2 * (1 + env * 0.05);
  for (let a = 0; a < TAU; a += 0.035) {
    const r = R + Math.sin(a * 9 + t * 2.2) * env * h * 0.025 + Math.sin(a * 23 - t * 3) * h * 0.006;
    fill(c, cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.92, 1, 1, rgba(hex("#c48cff"), 0.45 + env * 0.5));
  }
  fill(c, cx - 1, cy - 1, 3, 3, rgba(hex("#f1e3ff"), 0.4 + env * 0.6));
  // far islands bobbing
  for (let i = 0; i < 4; i++) {
    const ix = w * (0.12 + i * 0.26) + Math.sin(t * 0.2 + i) * 4;
    const iy = h * (0.5 + hash(i * 2.2) * 0.12) + Math.sin(t * 0.6 + i * 2) * 2;
    const iw = Math.round((T * (3 + hash(i) * 3)) / 2) * 2;
    fill(c, ix - iw / 2, iy, iw, T * 0.6, "#cfc79a");
    fill(c, ix - iw / 3, iy + T * 0.6, (iw * 2) / 3, T * 0.6, "#8b7fa0");
    fill(c, ix - iw / 6, iy + T * 1.2, iw / 3, T * 0.6, "#4e3f6e");
  }
  // the main island
  const top = Math.round(h * 0.74);
  const half = Math.round((w * 0.42) / T) * T;
  for (let r = 0; r < 6; r++) {
    const hw = Math.round((half * (1 - r * 0.16)) / T) * T;
    for (let x = cx - hw; x < cx + hw; x += T)
      block(c, x, top + r * T, T, r === 0 ? hex("#e8e0ad") : mix(hex("#bcb284"), hex("#3a2c55"), r / 5), 0.15, 0.25);
  }
  // pillars: an equalizer of light
  const n = 7;
  for (let i = 0; i < n; i++) {
    const x = Math.round((cx - half * 0.8 + (i * half * 1.6) / (n - 1)) / T) * T;
    const ph = Math.round((h * (0.18 + hash(i * 3.3) * 0.22)) / T) * T;
    for (let y = top - ph; y < top; y += T) block(c, x, y, T, hex("#170a26"), 0.18, 0.4);
    const level = env * (0.35 + 0.65 * hash(i * 1.9 + Math.floor(beatN))) + 0.12;
    const beam = Math.round((h * 0.25 * level) / 2) * 2;
    bands(c, x, top - ph - beam, T, beam, [hex("#000000"), hex("#b77cff")], 2, 0.5);
    block(c, x, top - ph - T, T, mix(hex("#7b3cff"), hex("#f0dcff"), level), 0.4, 0.2);
  }
  // motes
  for (let i = 0; i < 34; i++) {
    const life = (t * (0.05 + hash(i) * 0.06) + hash(i * 2.7)) % 1;
    const x = hash(i * 6.1) * w + Math.sin(t + i) * 6;
    const y = h - life * h;
    fill(c, x, y, 1, 1, rgba(hex("#d7b8ff"), (1 - Math.abs(life - 0.5) * 2) * 0.9));
  }
};

/* ------------------------------------------------------------------------------------------------------------------
 * Altitude (flying): above a sea of cloud, floating islands with waterfalls, wind, and a plane now and then.
 * ---------------------------------------------------------------------------------------------------------------- */
export const paintAltitude: Painter = (c, w, h, t) => {
  const T = Math.max(2, Math.round(h / 30));
  bands(c, 0, 0, w, Math.ceil(h * 0.7), [hex("#163f9c"), hex("#3f86d8"), hex("#9fd6f5"), hex("#e7f7ff")], 2);
  // low sun
  const s = Math.max(3, Math.round(h * 0.07));
  const sx = Math.round(w * 0.2);
  const sy = Math.round(h * 0.48);
  fill(c, sx - s * 2, sy - s * 0.6, s * 4, s * 1.2, "rgba(255,240,200,.25)");
  fill(c, sx - s / 2, sy - s / 2, s, s, "#fff6dc");
  // the far cloud sea
  cloudBand(c, w, h * 0.56, 4, T, t * 4, 21, [244, 250, 255], [170, 196, 226], 1, 0.6);
  fill(c, 0, h * 0.56 + T * 3, w, h, "#d6e6f6");
  // floating islands with waterfalls
  for (let i = 0; i < 3; i++) {
    const span = w + 80;
    const ix = ((((hash(i * 9.9) * span - t * (2.5 + i)) % span) + span) % span) - 40;
    const iy = h * (0.3 + i * 0.09) + Math.sin(t * 0.7 + i) * 2;
    const tw = 3 + i;
    for (let k = 0; k < tw; k++) block(c, ix + k * T, iy, T, hex("#62b345"), 0.3, 0.2);
    for (let r = 1; r < 4; r++)
      for (let k = r; k < tw - r + 1; k++)
        block(c, ix + k * T, iy + r * T, T, mix(hex("#7b5434"), hex("#4a3a50"), r / 4), 0.1, 0.3);
    block(c, ix + T, iy - T, T, hex("#3f8f2e"), 0.2, 0.25);
    const fx = ix + (tw - 1) * T;
    for (let y = iy + T; y < h * 0.6; y += 2) {
      const on = Math.floor(y / 2 + t * 14) % 3;
      fill(c, fx + T / 3, y, Math.max(1, T / 3), 2, on ? "rgba(140,200,255,.8)" : "rgba(255,255,255,.9)");
    }
  }
  // a plane every so often, with a contrail
  const cycle = 16;
  const k = (t % cycle) / cycle;
  if (k < 0.6) {
    const px = w + 20 - (k / 0.6) * (w + 60);
    const py = h * 0.2 + Math.sin(t * 0.5) * 2;
    for (let i = 1; i < 40; i++) fill(c, px + 6 + i * 2, py + 1, 2, 1, `rgba(255,255,255,${0.6 * (1 - i / 40)})`);
    fill(c, px, py, 7, 2, "#f4f6fa");
    fill(c, px + 2, py - 2, 2, 6, "#dfe5ee");
    fill(c, px + 6, py - 2, 1, 2, "#dfe5ee");
    fill(c, px, py + 1, 1, 1, "#2a3a55");
  }
  // the near cloud sea, faster
  cloudBand(c, w, h * 0.74, 5, T + 1, t * 11, 4, [255, 255, 255], [150, 180, 214], 1, 0.58);
  fill(c, 0, h * 0.74 + (T + 1) * 4, w, h, "#e9f2fb");
  // wind
  for (let i = 0; i < 18; i++) {
    const len = 6 + hash(i) * 18;
    const x = w - ((t * (60 + hash(i * 2) * 80) + hash(i * 3) * w * 3) % (w + len * 2));
    const y = hash(i * 5.5) * h * 0.85;
    fill(c, x, y, len, 1, "rgba(255,255,255,.35)");
  }
};

export const PAINTERS = {
  exposure: paintExposure,
  resonance: paintResonance,
  altitude: paintAltitude,
  forge: paintForge,
} as const;

/** The vortex drawn while stepping through a portal: a spiral of light in the world's colour. */
export function vortex(c: CanvasRenderingContext2D, w: number, h: number, t: number, accent: RGB, k: number) {
  if (k <= 0) return;
  fill(c, 0, 0, w, h, rgba(mix(accent, [20, 0, 40], 0.5), k * 0.45));
  const cx = w / 2;
  const cy = h / 2;
  const R = Math.hypot(w, h) / 2;
  const n = 260;
  for (let i = 0; i < n; i++) {
    const r = ((i / n + t * 0.35 + hash(i) * 0.3) % 1) * R;
    const a = i * 2.39996 + t * (1.5 + (i % 3)) + r * 0.02;
    const s = r > R * 0.5 ? 2 : 1;
    fill(
      c,
      cx + Math.cos(a) * r,
      cy + Math.sin(a) * r,
      s,
      s,
      rgba(mix(accent, [255, 255, 255], hash(i * 3) * 0.6), k * (0.4 + 0.6 * hash(i * 7))),
    );
  }
}
