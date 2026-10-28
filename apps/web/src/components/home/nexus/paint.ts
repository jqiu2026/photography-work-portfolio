/*
 * Painting for the Nexus: smooth light, not pixels. Gradients, curves and glows on a 2D canvas, deterministic noise,
 * time in seconds. Each world is a pure painter `(ctx, w, h, t)`, so it draws the same at any size.
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
export const fbm1 = (x: number) => noise1(x) * 0.57 + noise1(x * 2.03 + 17) * 0.29 + noise1(x * 4.1 + 41) * 0.14;

/* ---------- drawing helpers ---------- */
export function rect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, col: string) {
  c.fillStyle = col;
  c.fillRect(x, y, w, h);
}

/** A vertical gradient over a box. */
export function vgrad(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, stops: RGB[], a = 1) {
  const g = c.createLinearGradient(0, y, 0, y + h);
  stops.forEach((s, i) => g.addColorStop(i / Math.max(1, stops.length - 1), rgba(s, a)));
  c.fillStyle = g;
  c.fillRect(x, y, w, h);
}

/** A soft round light: a radial gradient fading to nothing. */
export function glow(c: CanvasRenderingContext2D, x: number, y: number, r: number, col: RGB, a: number) {
  if (r <= 0 || a <= 0) return;
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(col, a));
  g.addColorStop(0.35, rgba(col, a * 0.45));
  g.addColorStop(1, rgba(col, 0));
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
}

export function dot(c: CanvasRenderingContext2D, x: number, y: number, r: number, col: string) {
  c.fillStyle = col;
  c.beginPath();
  c.arc(x, y, Math.max(0.3, r), 0, TAU);
  c.fill();
}

/** A filled terrain line: y for each x from `f`, closed down to the bottom of the frame, with a vertical gradient. */
export function ridge(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  f: (x: number) => number,
  top: RGB,
  bottom: RGB,
  step = 6,
  a = 1,
) {
  c.beginPath();
  c.moveTo(-step, h);
  let minY = h;
  for (let x = -step; x <= w + step; x += step) {
    const y = f(x);
    minY = Math.min(minY, y);
    c.lineTo(x, y);
  }
  c.lineTo(w + step, h);
  c.closePath();
  const g = c.createLinearGradient(0, minY, 0, h);
  g.addColorStop(0, rgba(top, a));
  g.addColorStop(1, rgba(bottom, a));
  c.fillStyle = g;
  c.fill();
}

export function stars(c: CanvasRenderingContext2D, w: number, h: number, t: number, n: number, tint: RGB, spin = 0) {
  const cx = w / 2;
  const cy = h * 0.4;
  const u = Math.max(1, h / 500);
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
    const col = mix([255, 255, 255], tint, hash(i * 2.2) * 0.5);
    const big = hash(i * 9.1) > 0.94;
    dot(c, x, y, (big ? 1.4 : 0.7) * u, rgba(col, tw * (0.35 + 0.65 * hash(i * 5.5))));
    if (big) glow(c, x, y, 6 * u, col, 0.25 * tw);
  }
}

/** Now and then a star falls: a bright head and a fading tail. */
export function meteors(c: CanvasRenderingContext2D, w: number, h: number, t: number, tint: RGB, every = 5) {
  for (let k = 0; k < 2; k++) {
    const slot = Math.floor((t + k * every * 0.5) / every);
    const life = ((t + k * every * 0.5) % every) / 0.9;
    if (life > 1) continue;
    const x0 = w * (0.2 + hash(slot * 3.1 + k) * 0.7);
    const y0 = h * (0.05 + hash(slot * 7.7 + k) * 0.3);
    const x = x0 - life * w * 0.25;
    const y = y0 + life * h * 0.12;
    const len = w * 0.08;
    const g = c.createLinearGradient(x, y, x + len, y - len * 0.48);
    g.addColorStop(0, rgba([255, 255, 255], 1 - life));
    g.addColorStop(1, rgba(tint, 0));
    c.strokeStyle = g;
    c.lineWidth = Math.max(1, h / 400);
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + len, y - len * 0.48);
    c.stroke();
  }
}

/** Soft cumulus: overlapping rounded puffs, lit on top. */
function cloud(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  lit: RGB,
  shade: RGB,
  a: number,
  seed: number,
) {
  const puffs = 5 + Math.floor(hash(seed) * 3);
  for (let k = 0; k < puffs; k++) {
    const px = x + (k / (puffs - 1) - 0.5) * s * 2.2;
    const py = y - Math.sin((k / (puffs - 1)) * Math.PI) * s * (0.35 + hash(seed + k) * 0.3);
    const r = s * (0.45 + hash(seed * 3 + k) * 0.35);
    const g = c.createRadialGradient(px, py - r * 0.4, r * 0.1, px, py, r);
    g.addColorStop(0, rgba(lit, a));
    g.addColorStop(0.75, rgba(mix(lit, shade, 0.5), a * 0.9));
    g.addColorStop(1, rgba(shade, 0));
    c.fillStyle = g;
    c.beginPath();
    c.arc(px, py, r, 0, TAU);
    c.fill();
  }
}

/* ------------------------------------------------------------------------------------------------------------------
 * Exposure (photography): a valley in daylight, drifting from noon into golden hour, seen through a viewfinder.
 * ---------------------------------------------------------------------------------------------------------------- */
export const paintExposure: Painter = (c, w, h, t) => {
  const golden = 0.5 + 0.5 * Math.sin(t * 0.045);
  const u = h / 100;
  const top = mix(hex("#3d7de3"), hex("#4b4f9e"), golden * 0.55);
  const horizon = mix(hex("#cdeaff"), hex("#ffcf8f"), golden);
  vgrad(c, 0, 0, w, h, [top, mix(top, horizon, 0.6), horizon]);
  const sx = w * 0.74;
  const sy = h * (0.16 + golden * 0.16);
  const sun = mix(hex("#fffbe0"), hex("#ffd590"), golden);
  glow(c, sx, sy, 34 * u, sun, 0.55);
  dot(c, sx, sy, 4.2 * u, rgba(sun));
  for (let i = 0; i < 4; i++) {
    const span = w + 40 * u;
    const x = ((((hash(i * 4.2) * span + t * (4 + i * 2) * u * 0.3) % span) + span) % span) - 20 * u;
    cloud(
      c,
      x,
      h * (0.1 + hash(i) * 0.14),
      (6 + hash(i * 2) * 5) * u,
      [255, 255, 255],
      mix(horizon, [170, 180, 210], 0.5),
      0.85,
      i * 11,
    );
  }
  const haze = mix(horizon, hex("#4d6b9a"), 0.25);
  const range = (y0: number, amp: number, f: number, seed: number, near: number, speed: number) => {
    const col = mix(mix(horizon, hex("#4d6b9a"), near), hex("#7a5a7a"), golden * 0.25);
    const at = (x: number) => {
      const wx = x + t * speed * u;
      const r = 1 - Math.abs(noise1(wx * f + seed) * 2 - 1);
      return y0 - r * r * amp - fbm1(wx * f * 3 + seed) * amp * 0.25;
    };
    ridge(c, w, h, at, mix(col, [255, 245, 230], 0.12), mix(col, haze, 0.4), 4);
  };
  range(h * 0.58, h * 0.3, 0.0035, 5, 0.25, 0.4);
  range(h * 0.67, h * 0.2, 0.006, 41, 0.45, 0.9);
  // birds
  c.strokeStyle = "rgba(30,30,50,.75)";
  c.lineWidth = Math.max(1, u * 0.25);
  for (let i = 0; i < 4; i++) {
    const bx = w - ((((t * (6 + i * 2) * u * 0.4 + hash(i) * w * 2) % (w + 40)) + w + 40) % (w + 40));
    const by = h * (0.2 + hash(i * 4.4) * 0.2) + Math.sin(t * 2 + i) * u;
    const f = Math.sin(t * 9 + i * 2) * u * 0.8;
    c.beginPath();
    c.moveTo(bx - u * 1.4, by - f);
    c.quadraticCurveTo(bx - u * 0.5, by - u * 0.6, bx, by);
    c.quadraticCurveTo(bx + u * 0.5, by - u * 0.6, bx + u * 1.4, by - f);
    c.stroke();
  }
  // rolling hills with round trees
  const hills = (y0: number, amp: number, f: number, seed: number, col: RGB, speed: number) => {
    const at = (x: number) => y0 - fbm1((x + t * speed * u) * f + seed) * amp;
    ridge(c, w, h, at, mix(col, [255, 250, 200], 0.18), mix(col, [20, 50, 20], 0.35), 4);
    const cell = 14 * u;
    const off = (t * speed * u) % cell;
    for (let x = -off; x < w + cell; x += cell) {
      const id = Math.round((x + t * speed * u) / cell);
      if (hash(id * 7.7 + seed) < 0.62) continue;
      const tx = x + hash(id) * cell * 0.5;
      const ty = at(tx);
      const r = (2.4 + hash(id * 3) * 1.6) * u * (y0 / h);
      rect(c, tx - r * 0.12, ty - r * 1.2, r * 0.24, r * 1.25, "#5a3d26");
      glow(c, tx, ty - r * 0.2, r * 1.6, [20, 40, 20], 0.2);
      dot(c, tx, ty - r * 1.6, r, rgba(mix(col, hex("#1f5a2a"), 0.5)));
      dot(c, tx - r * 0.3, ty - r * 1.9, r * 0.55, rgba(mix(col, hex("#b4e88a"), 0.35)));
    }
  };
  hills(h * 0.8, h * 0.12, 0.004, 7, mix(hex("#6fb85a"), hex("#a3a85a"), golden * 0.5), 1.4);
  hills(h * 0.94, h * 0.1, 0.007, 19, mix(hex("#4f9e43"), hex("#8a8f3c"), golden * 0.5), 3);
  // the meadow in front
  c.lineWidth = Math.max(1, u * 0.3);
  for (let i = 0; i < w; i += Math.max(2, u * 0.9)) {
    const id = Math.floor(i + t * 4 * u);
    const tall = (1.5 + hash(id * 1.3) * 4) * u;
    const sway = Math.sin(t * 2 + i * 0.03) * u * 0.8;
    c.strokeStyle = rgba(mix(hex("#3f8a35"), hex("#a6cf62"), hash(id)), 0.9);
    c.beginPath();
    c.moveTo(i, h);
    c.quadraticCurveTo(i, h - tall * 0.6, i + sway, h - tall);
    c.stroke();
    if (hash(id * 9.1) > 0.97) dot(c, i + sway, h - tall, u * 0.6, hash(id) > 0.5 ? "#ff7a96" : "#fff2a8");
  }
  // pollen in the light
  for (let i = 0; i < 30; i++) {
    const px = (hash(i * 1.7) * w + t * (2 + hash(i) * 3) * u) % w;
    const py = h * 0.35 + hash(i * 3.9) * h * 0.5 + Math.sin(t + i) * u;
    glow(c, px, py, u * 0.9, [255, 244, 200], 0.6 * (0.5 + 0.5 * Math.sin(t * 3 + i)));
  }
  // a lens flare away from the sun
  c.globalCompositeOperation = "lighter";
  for (let k = 1; k <= 4; k++) {
    const fx = sx + (w / 2 - sx) * k * 0.55;
    const fy = sy + (h / 2 - sy) * k * 0.55;
    glow(c, fx, fy, (2.5 + (k % 3) * 2.5) * u, k % 2 ? hex("#ffd6a0") : hex("#a0e0ff"), 0.18);
  }
  c.globalCompositeOperation = "source-over";
  // the viewfinder: corner marks and a focus box that roams, then locks
  const m = Math.min(w, h) * 0.05;
  const L = m * 0.8;
  c.strokeStyle = "rgba(255,255,255,.6)";
  c.lineWidth = Math.max(1, u * 0.22);
  for (const [cx, cy, dx, dy] of [
    [m, m, 1, 1],
    [w - m, m, -1, 1],
    [m, h - m, 1, -1],
    [w - m, h - m, -1, -1],
  ] as const) {
    c.beginPath();
    c.moveTo(cx + dx * L, cy);
    c.lineTo(cx, cy);
    c.lineTo(cx, cy + dy * L);
    c.stroke();
  }
  const cyc = t % 6;
  const fxp = w * (0.35 + 0.3 * noise1(Math.floor(t / 6) * 3.3));
  const fyp = h * (0.45 + 0.2 * noise1(Math.floor(t / 6) * 5.1));
  const locked = cyc > 4;
  const bs = m * (locked ? 1.1 : 1.4 - cyc * 0.06);
  if (!locked || Math.floor(t * 6) % 2 === 0) {
    c.strokeStyle = locked ? "rgba(140,255,150,.9)" : "rgba(255,255,255,.75)";
    c.strokeRect(fxp - bs, fyp - bs, bs * 2, bs * 2);
  }
  if (golden > 0.5) rect(c, 0, 0, w, h, rgba(hex("#ff9a3c"), (golden - 0.5) * 0.16));
};

/* ------------------------------------------------------------------------------------------------------------------
 * Forge (make): a crimson cavern over a lava sea; an anvil throws sparks; a tower builds itself.
 * ---------------------------------------------------------------------------------------------------------------- */
export const paintForge: Painter = (c, w, h, t) => {
  const u = h / 100;
  vgrad(c, 0, 0, w, h, [hex("#0e0203"), hex("#360806"), hex("#7c1d0b"), hex("#c03a10")]);
  // distant basalt columns
  for (let i = 0; i < 16; i++) {
    const x = hash(i * 5.3) * w;
    const top = h * (0.25 + hash(i * 2.1) * 0.3);
    const cw = (2 + hash(i) * 4) * u;
    const g = c.createLinearGradient(x, 0, x + cw, 0);
    const base = mix(hex("#2a0909"), hex("#5a1a10"), hash(i * 3.3) * 0.5);
    g.addColorStop(0, rgba(mix(base, hex("#ff7a3c"), 0.2)));
    g.addColorStop(1, rgba(mix(base, [0, 0, 0], 0.3)));
    c.fillStyle = g;
    c.fillRect(x, top, cw, h - top);
  }
  // the ceiling, hanging down, with drips of light
  const ceil = (x: number) => h * 0.06 + fbm1(x * 0.012 + 3) * h * 0.16;
  c.beginPath();
  c.moveTo(-5, 0);
  for (let x = -5; x <= w + 5; x += 5) c.lineTo(x, ceil(x));
  c.lineTo(w + 5, 0);
  c.closePath();
  const cg = c.createLinearGradient(0, 0, 0, h * 0.24);
  cg.addColorStop(0, "#140404");
  cg.addColorStop(1, "#2e0a07");
  c.fillStyle = cg;
  c.fill();
  for (let i = 0; i < 9; i++) {
    const x = hash(i * 1.9) * w;
    const d = ceil(x);
    const fall = ((t * 0.7 + hash(i)) % 1) * (h * 0.75 - d);
    glow(c, x, d + fall, u * 1.2, hex("#ffb347"), 0.9);
  }
  // lava falls
  for (const fx of [0.18, 0.93]) {
    const x = w * fx;
    const fw = 3 * u;
    const g = c.createLinearGradient(x - fw, 0, x + fw, 0);
    g.addColorStop(0, "rgba(255,90,26,0)");
    g.addColorStop(0.5, "rgba(255,190,80,1)");
    g.addColorStop(1, "rgba(255,90,26,0)");
    c.fillStyle = g;
    c.fillRect(x - fw, h * 0.12, fw * 2, h * 0.7);
    for (let k = 0; k < 8; k++) {
      const y = h * 0.12 + ((t * 0.5 + k / 8) % 1) * h * 0.68;
      glow(c, x, y, fw * 1.2, hex("#fff0a0"), 0.5);
    }
    glow(c, x, h * 0.8, fw * 5, hex("#ffb04a"), 0.5);
  }
  // the lava sea
  const sea = h * 0.8;
  vgrad(c, 0, sea, w, h - sea, [hex("#ff7a20"), hex("#d23a0c"), hex("#7a1806")]);
  c.globalCompositeOperation = "lighter";
  for (let i = 0; i < 26; i++) {
    const x = ((hash(i * 2.7) * w + t * (4 + hash(i) * 6) * u) % (w + 20 * u)) - 10 * u;
    const y = sea + hash(i * 5.1) * (h - sea);
    glow(c, x, y, (3 + hash(i * 3) * 6) * u, hex("#ffd060"), 0.35 + 0.25 * Math.sin(t * 2 + i));
  }
  c.globalCompositeOperation = "source-over";
  c.strokeStyle = "rgba(255,230,140,.55)";
  c.lineWidth = Math.max(1, u * 0.3);
  for (let k = 0; k < 4; k++) {
    c.beginPath();
    for (let x = 0; x <= w; x += 6) {
      const y = sea + (k * (h - sea)) / 4 + Math.sin(x * 0.02 + t * 1.6 + k) * u * 0.8;
      if (x === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();
  }
  vgrad(c, 0, sea - h * 0.25, w, h * 0.25, [hex("#000000"), hex("#ff6a2b")], 0.18);
  // the forge: a stone plinth and an anvil; sparks every beat
  const ax = w * 0.58;
  const ay = sea - 5 * u;
  c.fillStyle = "#2c1414";
  c.beginPath();
  c.roundRect(ax - 9 * u, ay, 18 * u, 6 * u, u);
  c.fill();
  c.fillStyle = "#120707";
  c.beginPath();
  c.moveTo(ax - 7 * u, ay);
  c.lineTo(ax - 4 * u, ay - 2.5 * u);
  c.lineTo(ax - 6 * u, ay - 4 * u);
  c.lineTo(ax + 7 * u, ay - 4 * u);
  c.quadraticCurveTo(ax + 9 * u, ay - 3.6 * u, ax + 10 * u, ay - 5 * u);
  c.lineTo(ax + 5 * u, ay - 2.5 * u);
  c.lineTo(ax + 7 * u, ay);
  c.closePath();
  c.fill();
  rect(c, ax - 6 * u, ay - 4.2 * u, 13 * u, u * 0.3, "rgba(255,140,70,.8)");
  const beat = t % 1.15;
  if (beat < 0.12) glow(c, ax, ay - 4 * u, 18 * u, hex("#ffdc8c"), 0.4 * (1 - beat / 0.12));
  c.globalCompositeOperation = "lighter";
  for (let k = 0; k < 26; k++) {
    const vx = (hash(k * 3.7 + Math.floor(t / 1.15)) - 0.5) * 60 * u;
    const vy = (-25 - hash(k * 1.3) * 45) * u;
    const x = ax + vx * beat;
    const y = ay - 4 * u + vy * beat + 55 * u * beat * beat;
    if (y < sea) glow(c, x, y, u * 0.9, mix(hex("#fff3b0"), hex("#ff6a2b"), beat / 1.15), 1 - beat / 1.15);
  }
  c.globalCompositeOperation = "source-over";
  // something being made: a tower that builds itself, block by block, then starts again
  const bx = w * 0.76;
  const T = 4 * u;
  c.fillStyle = "#2c1414";
  c.fillRect(bx - T * 1.6, sea - T, T * 3.2, T);
  const prog = (t % 14) / 14;
  const plan = 15;
  const placed = Math.min(plan, Math.floor(prog * (plan + 4)));
  for (let k = 0; k < placed; k++) {
    const col = (k % 3) - 1;
    const row = Math.floor(k / 3) + 1;
    const metal = k % 4 === 0 ? hex("#cfc8be") : k % 2 ? hex("#6b3a2a") : hex("#8a4b30");
    const land = (prog * (plan + 4) - k) * 4;
    const drop = land < 1 ? (1 - land) * T * 3 : 0;
    const x = bx + col * T - T / 2;
    const y = sea - T - row * T - drop;
    const g = c.createLinearGradient(x, y, x, y + T);
    g.addColorStop(0, rgba(mix(metal, [255, 200, 150], 0.35)));
    g.addColorStop(1, rgba(mix(metal, [0, 0, 0], 0.35)));
    c.fillStyle = g;
    c.beginPath();
    c.roundRect(x + 0.6, y + 0.6, T - 1.2, T - 1.2, T * 0.12);
    c.fill();
    if (land >= 1 && land < 1.6) glow(c, x + T / 2, y + T, T, hex("#ffd25a"), 0.6 * (1.6 - land));
  }
  // embers rising
  c.globalCompositeOperation = "lighter";
  for (let i = 0; i < 46; i++) {
    const life = (t * (0.08 + hash(i) * 0.1) + hash(i * 2.3)) % 1;
    const x = hash(i * 4.1) * w + Math.sin(t * 1.5 + i) * 2 * u;
    const y = sea - life * h * 0.85;
    glow(c, x, y, u * 0.8, hex(i % 3 ? "#ff7a2a" : "#ffd25a"), 1 - life);
  }
  c.globalCompositeOperation = "source-over";
};

/* ------------------------------------------------------------------------------------------------------------------
 * Resonance (music): a violet void; obsidian pillars on a pale island light up like an equalizer on the beat.
 * ---------------------------------------------------------------------------------------------------------------- */
export const BPM = 92;
export const paintResonance: Painter = (c, w, h, t) => {
  const u = h / 100;
  const beatN = (t * BPM) / 60;
  const env = Math.exp(-(beatN % 1) * 4);
  vgrad(c, 0, 0, w, h, [hex("#030108"), hex("#0d0420"), hex("#1c0a36"), hex("#0a0414")]);
  glow(c, w * 0.3, h * 0.35, 50 * u, hex("#5a2a9a"), 0.22);
  glow(c, w * 0.75, h * 0.25, 40 * u, hex("#2a3a9a"), 0.18);
  stars(c, w, h, t, Math.round((w * h) / (90 * u * u)), hex("#c9a8ff"), 0.004);
  meteors(c, w, h, t, hex("#c48cff"), 4);
  // an oscilloscope ribbon across the void
  c.globalCompositeOperation = "lighter";
  c.lineWidth = Math.max(1, u * 0.35);
  c.strokeStyle = rgba(hex("#e2c8ff"), 0.35 + 0.45 * env);
  c.beginPath();
  for (let x = 0; x <= w; x += 3) {
    const y =
      h * 0.58 + Math.sin(x * 0.015 + t * 1.5) * h * 0.03 * (0.4 + env) + Math.sin(x * 0.045 - t * 3) * h * 0.012 * env;
    if (x === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  c.stroke();
  // the waveform halo
  const cx = w / 2;
  const cy = h * 0.3;
  const R = Math.min(w, h) * 0.2 * (1 + env * 0.05);
  c.strokeStyle = rgba(hex("#c48cff"), 0.5 + env * 0.45);
  c.lineWidth = Math.max(1, u * 0.4);
  c.beginPath();
  for (let a = 0; a <= TAU + 0.01; a += 0.02) {
    const r = R + Math.sin(a * 9 + t * 2.2) * env * h * 0.025 + Math.sin(a * 23 - t * 3) * h * 0.006;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r * 0.92;
    if (a === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  c.stroke();
  glow(c, cx, cy, R * 0.9, hex("#8a4cff"), 0.12 + env * 0.15);
  glow(c, cx, cy, 2 * u, hex("#f1e3ff"), 0.6 + env * 0.4);
  c.globalCompositeOperation = "source-over";
  // far islands bobbing
  const island = (x: number, y: number, iw: number, top: RGB) => {
    c.fillStyle = rgba(top);
    c.beginPath();
    c.ellipse(x, y, iw / 2, iw * 0.08, 0, 0, TAU);
    c.fill();
    const g = c.createLinearGradient(0, y, 0, y + iw * 0.45);
    g.addColorStop(0, rgba(mix(top, hex("#3a2c55"), 0.4)));
    g.addColorStop(1, rgba(hex("#1a1030"), 0));
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(x - iw / 2, y);
    c.quadraticCurveTo(x - iw * 0.2, y + iw * 0.25, x, y + iw * 0.45);
    c.quadraticCurveTo(x + iw * 0.2, y + iw * 0.25, x + iw / 2, y);
    c.closePath();
    c.fill();
  };
  for (let i = 0; i < 4; i++) {
    island(
      w * (0.12 + i * 0.26) + Math.sin(t * 0.2 + i) * u,
      h * (0.5 + hash(i * 2.2) * 0.12) + Math.sin(t * 0.6 + i * 2) * u * 0.6,
      (8 + hash(i) * 8) * u,
      hex("#cfc79a"),
    );
  }
  // the main island and its pillars
  const top = h * 0.74;
  const half = w * 0.42;
  island(cx, top, half * 2, hex("#e8e0ad"));
  const n = 7;
  for (let i = 0; i < n; i++) {
    const x = cx - half * 0.8 + (i * half * 1.6) / (n - 1);
    const ph = h * (0.18 + hash(i * 3.3) * 0.22);
    const pw = 2.6 * u;
    const g = c.createLinearGradient(x - pw / 2, 0, x + pw / 2, 0);
    g.addColorStop(0, "#2a1640");
    g.addColorStop(0.4, "#170a26");
    g.addColorStop(1, "#0c0516");
    c.fillStyle = g;
    c.fillRect(x - pw / 2, top - ph, pw, ph);
    const level = env * (0.35 + 0.65 * hash(i * 1.9 + Math.floor(beatN))) + 0.12;
    const beam = h * 0.25 * level;
    const bg = c.createLinearGradient(0, top - ph - beam, 0, top - ph);
    bg.addColorStop(0, "rgba(183,124,255,0)");
    bg.addColorStop(1, rgba(hex("#b77cff"), 0.6));
    c.fillStyle = bg;
    c.fillRect(x - pw * 0.35, top - ph - beam, pw * 0.7, beam);
    c.globalCompositeOperation = "lighter";
    glow(c, x, top - ph - pw * 0.4, pw * 3, hex("#b77cff"), 0.4 * level + 0.15);
    c.globalCompositeOperation = "source-over";
    c.fillStyle = rgba(mix(hex("#7b3cff"), hex("#f0dcff"), level));
    c.beginPath();
    c.moveTo(x, top - ph - pw * 1.4);
    c.lineTo(x + pw * 0.55, top - ph - pw * 0.4);
    c.lineTo(x, top - ph + pw * 0.4);
    c.lineTo(x - pw * 0.55, top - ph - pw * 0.4);
    c.closePath();
    c.fill();
  }
  // motes
  c.globalCompositeOperation = "lighter";
  for (let i = 0; i < 40; i++) {
    const life = (t * (0.05 + hash(i) * 0.06) + hash(i * 2.7)) % 1;
    const x = hash(i * 6.1) * w + Math.sin(t + i) * 2 * u;
    glow(c, x, h - life * h, u * 0.8, hex("#d7b8ff"), (1 - Math.abs(life - 0.5) * 2) * 0.9);
  }
  c.globalCompositeOperation = "source-over";
};

/* ------------------------------------------------------------------------------------------------------------------
 * Altitude (flying): above a sea of cloud, floating islands with waterfalls, wind, a plane now and then; noon to dusk.
 * ---------------------------------------------------------------------------------------------------------------- */
export const paintAltitude: Painter = (c, w, h, t) => {
  const u = h / 100;
  const dusk = 0.5 + 0.5 * Math.sin(t * 0.04 + 2);
  vgrad(c, 0, 0, w, h, [
    mix(hex("#123a94"), hex("#2a1f6e"), dusk * 0.7),
    mix(hex("#3b80d6"), hex("#8a4f9e"), dusk * 0.6),
    mix(hex("#9fd3f3"), hex("#ff9f6b"), dusk * 0.7),
    mix(hex("#f2e6c8"), hex("#ffd08a"), dusk),
  ]);
  const sx = w * 0.22;
  const sy = h * (0.42 + dusk * 0.14);
  glow(c, sx, sy, 30 * u, hex("#ffe9b8"), 0.55);
  dot(c, sx, sy, 3.6 * u, "#fff6dc");
  const lit = (base: string) => mix(hex(base), hex("#ffd2b8"), dusk * 0.6);
  const deep = (base: string) => mix(hex(base), hex("#8a6fa8"), dusk * 0.6);
  const sea = (y0: number, amp: number, f: number, seed: number, speed: number, a: string, b: string) =>
    ridge(c, w, h, (x) => y0 - fbm1((x + t * speed * u) * f + seed) * amp, lit(a), deep(b), 4);
  sea(h * 0.64, h * 0.08, 0.012, 5, 1.5, "#eef4ff", "#b9cde6");
  // floating islands with waterfalls
  for (let i = 0; i < 3; i++) {
    const span = w + 30 * u;
    const ix = ((((hash(i * 9.9) * span - t * (1 + i * 0.4) * u) % span) + span) % span) - 15 * u;
    const iy = h * (0.28 + i * 0.09) + Math.sin(t * 0.7 + i) * u * 0.6;
    const iw = (9 + i * 3) * u;
    c.fillStyle = "#62b345";
    c.beginPath();
    c.ellipse(ix, iy, iw / 2, iw * 0.09, 0, 0, TAU);
    c.fill();
    const g = c.createLinearGradient(0, iy, 0, iy + iw * 0.6);
    g.addColorStop(0, "#7b5434");
    g.addColorStop(1, "#3a2c40");
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(ix - iw / 2, iy);
    c.quadraticCurveTo(ix - iw * 0.15, iy + iw * 0.3, ix, iy + iw * 0.6);
    c.quadraticCurveTo(ix + iw * 0.15, iy + iw * 0.3, ix + iw / 2, iy);
    c.closePath();
    c.fill();
    dot(c, ix - iw * 0.2, iy - iw * 0.12, iw * 0.12, "#3f8f2e");
    dot(c, ix - iw * 0.08, iy - iw * 0.16, iw * 0.09, "#4fa83a");
    const fx = ix + iw * 0.38;
    const wg = c.createLinearGradient(0, iy, 0, h * 0.66);
    wg.addColorStop(0, "rgba(200,235,255,.9)");
    wg.addColorStop(1, "rgba(200,235,255,0)");
    c.fillStyle = wg;
    c.fillRect(fx - u * 0.5, iy, u, Math.max(0, h * 0.66 - iy));
    for (let k = 0; k < 6; k++) {
      const y = iy + ((t * 0.8 + k / 6) % 1) * (h * 0.66 - iy);
      dot(c, fx, y, u * 0.5, "rgba(255,255,255,.8)");
    }
  }
  // a plane every so often, with a contrail
  const k = (t % 16) / 16;
  if (k < 0.6) {
    const px = w + 10 * u - (k / 0.6) * (w + 30 * u);
    const py = h * 0.2 + Math.sin(t * 0.5) * u;
    const cg = c.createLinearGradient(px, 0, px + 40 * u, 0);
    cg.addColorStop(0, "rgba(255,255,255,.7)");
    cg.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = cg;
    c.fillRect(px + 2 * u, py - u * 0.15, 40 * u, u * 0.3);
    c.fillStyle = "#eef2f8";
    c.beginPath();
    c.ellipse(px, py, 2.4 * u, 0.45 * u, 0, 0, TAU);
    c.fill();
    c.beginPath();
    c.moveTo(px - 0.4 * u, py);
    c.lineTo(px + 0.8 * u, py - 2 * u);
    c.lineTo(px + 1.4 * u, py - 2 * u);
    c.lineTo(px + 0.8 * u, py);
    c.lineTo(px + 1.4 * u, py + 2 * u);
    c.lineTo(px + 0.8 * u, py + 2 * u);
    c.closePath();
    c.fill();
  }
  sea(h * 0.78, h * 0.1, 0.009, 11, 4, "#f6f9ff", "#a9c1df");
  sea(h * 0.94, h * 0.12, 0.007, 23, 8, "#ffffff", "#9db5d6");
  // wind
  c.strokeStyle = "rgba(255,255,255,.35)";
  c.lineWidth = Math.max(1, u * 0.15);
  for (let i = 0; i < 18; i++) {
    const len = (4 + hash(i) * 10) * u;
    const x = w - ((t * (30 + hash(i * 2) * 40) * u + hash(i * 3) * w * 3) % (w + len * 2));
    const y = hash(i * 5.5) * h * 0.85;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + len, y);
    c.stroke();
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
  const cx = w / 2;
  const cy = h / 2;
  const R = Math.hypot(w, h) / 2;
  const g = c.createRadialGradient(cx, cy, 0, cx, cy, R);
  g.addColorStop(0, rgba(mix(accent, [255, 255, 255], 0.6), k * 0.7));
  g.addColorStop(0.5, rgba(mix(accent, [30, 0, 60], 0.3), k * 0.5));
  g.addColorStop(1, rgba([10, 0, 20], k * 0.6));
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  c.globalCompositeOperation = "lighter";
  c.lineWidth = Math.max(1, h / 300);
  for (let arm = 0; arm < 6; arm++) {
    c.strokeStyle = rgba(mix(accent, [255, 255, 255], 0.4), k * 0.5);
    c.beginPath();
    for (let s = 0; s <= 1; s += 0.02) {
      const r = s * R;
      const a = arm * (TAU / 6) + s * 5 + t * 2.4;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (s === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();
  }
  for (let i = 0; i < 120; i++) {
    const r = ((i / 120 + t * 0.35 + hash(i) * 0.3) % 1) * R;
    const a = i * 2.39996 + t * (1.5 + (i % 3)) + r * 0.01;
    dot(
      c,
      cx + Math.cos(a) * r,
      cy + Math.sin(a) * r,
      Math.max(0.6, r / R) * h * 0.004,
      rgba(mix(accent, [255, 255, 255], 0.5), k),
    );
  }
  c.globalCompositeOperation = "source-over";
}
