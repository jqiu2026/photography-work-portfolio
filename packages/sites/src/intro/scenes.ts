/*
 * The drawn scenes of the site intros: smooth canvas painting, time in seconds, any size. Each is `(ctx, w, h, t)`.
 * Music listens (waves, bars, a staff, rings), flying looks out (horizon, clouds, a route, a runway), make builds
 * (a blueprint, code, blocks, a circuit).
 */
type RGB = readonly [number, number, number];
type Scene = (c: CanvasRenderingContext2D, w: number, h: number, t: number) => void;

const TAU = Math.PI * 2;
const rgba = (c: RGB, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mix = (a: RGB, b: RGB, k: number): RGB => [
  a[0] + (b[0] - a[0]) * k,
  a[1] + (b[1] - a[1]) * k,
  a[2] + (b[2] - a[2]) * k,
];
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const noise = (x: number) => {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return hash(i) * (1 - u) + hash(i + 1) * u;
};

function bg(c: CanvasRenderingContext2D, w: number, h: number, top: RGB, bottom: RGB) {
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, rgba(top));
  g.addColorStop(1, rgba(bottom));
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
}
function glow(c: CanvasRenderingContext2D, x: number, y: number, r: number, col: RGB, a: number) {
  if (r <= 0 || a <= 0) return;
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(col, a));
  g.addColorStop(0.4, rgba(col, a * 0.4));
  g.addColorStop(1, rgba(col, 0));
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
}
function dust(c: CanvasRenderingContext2D, w: number, h: number, t: number, col: RGB, n = 60) {
  c.globalCompositeOperation = "lighter";
  for (let i = 0; i < n; i++) {
    const life = (t * (0.03 + hash(i) * 0.04) + hash(i * 2.7)) % 1;
    const x = hash(i * 6.1) * w + Math.sin(t * 0.6 + i) * 10;
    glow(c, x, h - life * h, 1.5 + hash(i * 3) * 2.5, col, (1 - Math.abs(life - 0.5) * 2) * 0.7);
  }
  c.globalCompositeOperation = "source-over";
}

/* ---------- music ---------- */
const BPM = 84;
const beat = (t: number) => Math.exp(-(((t * BPM) / 60) % 1) * 4);
const VIOLET: RGB = [183, 124, 255];
const MAGENTA: RGB = [255, 110, 200];

const waves: Scene = (c, w, h, t) => {
  bg(c, w, h, [6, 3, 16], [20, 6, 34]);
  glow(c, w * 0.5, h * 0.5, h * 0.8, [90, 40, 160], 0.25);
  const e = beat(t);
  c.globalCompositeOperation = "lighter";
  for (let k = 0; k < 6; k++) {
    const col = mix(VIOLET, MAGENTA, k / 5);
    c.strokeStyle = rgba(col, 0.25 + 0.35 * (1 - k / 6) + e * 0.2);
    c.lineWidth = Math.max(1, h / 400) * (k === 0 ? 2.5 : 1.2);
    c.beginPath();
    for (let x = 0; x <= w; x += 4) {
      const p = x / w;
      const amp = h * (0.06 + 0.05 * k) * Math.sin(p * Math.PI) * (0.6 + 0.4 * e);
      const y = h * 0.5 + Math.sin(p * (6 + k) + t * (1 + k * 0.3)) * amp + Math.sin(p * 23 - t * 3) * amp * 0.15;
      if (x === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();
  }
  c.globalCompositeOperation = "source-over";
  dust(c, w, h, t, VIOLET);
};

const bars: Scene = (c, w, h, t) => {
  bg(c, w, h, [4, 2, 12], [16, 4, 28]);
  const n = Math.max(24, Math.round(w / 34));
  const bw = w / n;
  const e = beat(t);
  for (let i = 0; i < n; i++) {
    const level =
      0.12 + 0.75 * noise(i * 0.35 + t * 1.3) * (0.55 + 0.45 * e) * (0.6 + 0.4 * Math.sin((i / n) * Math.PI));
    const bh = level * h * 0.7;
    const x = i * bw + bw * 0.18;
    const g = c.createLinearGradient(0, h - bh, 0, h);
    g.addColorStop(0, rgba(mix(MAGENTA, VIOLET, i / n), 0.95));
    g.addColorStop(1, rgba(VIOLET, 0.1));
    c.fillStyle = g;
    c.beginPath();
    c.roundRect(x, h - bh, bw * 0.64, bh, bw * 0.2);
    c.fill();
    c.globalCompositeOperation = "lighter";
    glow(c, x + bw * 0.32, h - bh, bw * 1.4, mix(MAGENTA, VIOLET, i / n), 0.35);
    c.globalCompositeOperation = "source-over";
  }
  dust(c, w, h, t, MAGENTA, 30);
};

const staff: Scene = (c, w, h, t) => {
  bg(c, w, h, [8, 4, 18], [14, 6, 26]);
  const gap = h * 0.045;
  const y0 = h * 0.5 - gap * 2;
  c.strokeStyle = "rgba(230,215,255,.35)";
  c.lineWidth = Math.max(1, h / 700);
  for (let l = 0; l < 5; l++) {
    c.beginPath();
    c.moveTo(0, y0 + l * gap);
    c.lineTo(w, y0 + l * gap);
    c.stroke();
  }
  const play = w * 0.35;
  const g = c.createLinearGradient(play - 40, 0, play + 40, 0);
  g.addColorStop(0, "rgba(183,124,255,0)");
  g.addColorStop(0.5, "rgba(183,124,255,.35)");
  g.addColorStop(1, "rgba(183,124,255,0)");
  c.fillStyle = g;
  c.fillRect(play - 40, y0 - gap * 3, 80, gap * 10);
  const spacing = gap * 3.2;
  const off = (t * gap * 4) % spacing;
  for (let i = -1; i < w / spacing + 2; i++) {
    const id = i + Math.floor((t * gap * 4) / spacing);
    const x = w - (i * spacing + off);
    const step = Math.floor(hash(id * 3.7) * 9) - 2;
    const y = y0 + gap * 4 - step * (gap / 2);
    const near = Math.max(0, 1 - Math.abs(x - play) / (gap * 2));
    const col = mix([230, 215, 255], MAGENTA, near);
    c.fillStyle = rgba(col, 0.9);
    c.beginPath();
    c.ellipse(x, y, gap * 0.62, gap * 0.45, -0.35, 0, TAU);
    c.fill();
    c.strokeStyle = rgba(col, 0.9);
    c.beginPath();
    c.moveTo(x + gap * 0.58, y);
    c.lineTo(x + gap * 0.58, y - gap * 3.2);
    c.stroke();
    if (near > 0) {
      c.globalCompositeOperation = "lighter";
      glow(c, x, y, gap * 3, MAGENTA, near * 0.6);
      c.globalCompositeOperation = "source-over";
    }
  }
  dust(c, w, h, t, VIOLET, 30);
};

const rings: Scene = (c, w, h, t) => {
  bg(c, w, h, [5, 2, 12], [12, 4, 24]);
  const cx = w * 0.5;
  const cy = h * 0.55;
  c.globalCompositeOperation = "lighter";
  for (let k = 0; k < 9; k++) {
    const life = (t * 0.18 + k / 9) % 1;
    const r = life * Math.hypot(w, h) * 0.55;
    c.strokeStyle = rgba(mix(VIOLET, MAGENTA, life), (1 - life) * 0.55);
    c.lineWidth = Math.max(1, h / 300) * (1 - life) * 3 + 0.5;
    c.beginPath();
    c.ellipse(cx, cy, r, r * 0.55, 0, 0, TAU);
    c.stroke();
  }
  glow(c, cx, cy, h * 0.12 * (1 + beat(t) * 0.3), MAGENTA, 0.6);
  c.globalCompositeOperation = "source-over";
};

/* ---------- flying ---------- */
const SKY: RGB = [111, 216, 255];

const horizon: Scene = (c, w, h, t) => {
  const roll = Math.sin(t * 0.35) * 0.12;
  const pitch = Math.sin(t * 0.22) * h * 0.06;
  c.save();
  c.translate(w / 2, h / 2 + pitch);
  c.rotate(roll);
  const R = Math.hypot(w, h);
  const sky = c.createLinearGradient(0, -R, 0, 0);
  sky.addColorStop(0, "#0b2a6b");
  sky.addColorStop(1, "#6fb4e8");
  c.fillStyle = sky;
  c.fillRect(-R, -R, R * 2, R);
  const gr = c.createLinearGradient(0, 0, 0, R);
  gr.addColorStop(0, "#5a4a3a");
  gr.addColorStop(1, "#1d1712");
  c.fillStyle = gr;
  c.fillRect(-R, 0, R * 2, R);
  c.strokeStyle = "rgba(255,255,255,.9)";
  c.lineWidth = Math.max(1, h / 450);
  c.beginPath();
  c.moveTo(-R, 0);
  c.lineTo(R, 0);
  c.stroke();
  c.font = `${Math.round(h * 0.022)}px ui-monospace, monospace`;
  c.fillStyle = "rgba(255,255,255,.8)";
  for (let p = -20; p <= 20; p += 5) {
    if (p === 0) continue;
    const y = -p * h * 0.018;
    const lw = p % 10 === 0 ? w * 0.12 : w * 0.06;
    c.beginPath();
    c.moveTo(-lw / 2, y);
    c.lineTo(lw / 2, y);
    c.stroke();
    if (p % 10 === 0) c.fillText(String(Math.abs(p)), lw / 2 + 8, y + 4);
  }
  c.restore();
  // the fixed aircraft symbol and a heading tape
  c.strokeStyle = "#ffd36b";
  c.lineWidth = Math.max(2, h / 220);
  c.beginPath();
  c.moveTo(w / 2 - w * 0.12, h / 2);
  c.lineTo(w / 2 - w * 0.04, h / 2);
  c.lineTo(w / 2, h / 2 + h * 0.02);
  c.lineTo(w / 2 + w * 0.04, h / 2);
  c.lineTo(w / 2 + w * 0.12, h / 2);
  c.stroke();
  const hdg = (t * 4) % 360;
  c.fillStyle = "rgba(0,0,0,.35)";
  c.fillRect(w * 0.3, h * 0.06, w * 0.4, h * 0.06);
  c.fillStyle = "rgba(255,255,255,.85)";
  c.font = `${Math.round(h * 0.022)}px ui-monospace, monospace`;
  c.textAlign = "center";
  for (let d = -40; d <= 40; d += 10) {
    const v = Math.round((hdg + d) / 10) * 10;
    const x = w / 2 + (v - hdg) * ((w * 0.4) / 90);
    if (x < w * 0.3 || x > w * 0.7) continue;
    c.fillText(String(((v % 360) + 360) % 360).padStart(3, "0"), x, h * 0.1);
  }
  c.textAlign = "start";
};

const clouds: Scene = (c, w, h, t) => {
  bg(c, w, h, [20, 64, 150], [170, 210, 240]);
  glow(c, w * 0.75, h * 0.25, h * 0.6, [255, 240, 210], 0.45);
  // puffs rushing past, far ones slower
  for (let i = 0; i < 26; i++) {
    const depth = hash(i * 3.3);
    const speed = 0.04 + depth * 0.22;
    const life = (t * speed + hash(i)) % 1;
    const x = w + 200 - life * (w + 400);
    const y = h * (0.2 + hash(i * 7.1) * 0.7);
    const r = h * (0.05 + depth * 0.18);
    const g = c.createRadialGradient(x, y - r * 0.3, r * 0.1, x, y, r);
    g.addColorStop(0, `rgba(255,255,255,${0.35 + depth * 0.5})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(x, y, r * 1.8, r, 0, 0, TAU);
    c.fill();
  }
  c.strokeStyle = "rgba(255,255,255,.35)";
  c.lineWidth = 1;
  for (let i = 0; i < 24; i++) {
    const len = 30 + hash(i) * 90;
    const x = w - ((t * (500 + hash(i * 2) * 600) + hash(i * 3) * w * 3) % (w + len * 2));
    const y = hash(i * 5.5) * h;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + len, y);
    c.stroke();
  }
};

const route: Scene = (c, w, h, t) => {
  bg(c, w, h, [4, 10, 22], [8, 18, 34]);
  c.strokeStyle = "rgba(111,216,255,.08)";
  c.lineWidth = 1;
  const step = Math.max(28, w / 30);
  for (let x = 0; x < w; x += step) {
    c.beginPath();
    c.moveTo(x, 0);
    c.lineTo(x, h);
    c.stroke();
  }
  for (let y = 0; y < h; y += step) {
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(w, y);
    c.stroke();
  }
  const pts = [0, 1, 2, 3, 4, 5].map((i) => [w * (0.12 + i * 0.15), h * (0.35 + Math.sin(i * 1.7) * 0.18)] as const);
  const prog = (t * 0.12) % 1.2;
  c.strokeStyle = rgba(SKY, 0.9);
  c.lineWidth = Math.max(1.5, h / 300);
  c.setLineDash([8, 6]);
  c.beginPath();
  const total = pts.length - 1;
  let head: readonly [number, number] = pts[0];
  for (let i = 0; i < total; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const k = Math.max(0, Math.min(1, prog * total - i));
    if (k <= 0) break;
    const mx = (a[0] + b[0]) / 2;
    const my = Math.min(a[1], b[1]) - h * 0.08;
    // a gentle arc, drawn as far as the plane has flown
    for (let s = 0; s <= k; s += 0.05) {
      const x = (1 - s) * (1 - s) * a[0] + 2 * (1 - s) * s * mx + s * s * b[0];
      const y = (1 - s) * (1 - s) * a[1] + 2 * (1 - s) * s * my + s * s * b[1];
      if (i === 0 && s === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
      head = [x, y];
    }
  }
  c.stroke();
  c.setLineDash([]);
  for (const p of pts) {
    c.fillStyle = "rgba(255,255,255,.85)";
    c.beginPath();
    c.arc(p[0], p[1], Math.max(3, h / 160), 0, TAU);
    c.fill();
  }
  c.globalCompositeOperation = "lighter";
  glow(c, head[0], head[1], h * 0.05, SKY, 0.9);
  c.globalCompositeOperation = "source-over";
};

const runway: Scene = (c, w, h, t) => {
  bg(c, w, h, [6, 8, 20], [16, 14, 26]);
  const hy = h * 0.42;
  glow(c, w / 2, hy, w * 0.5, [255, 160, 90], 0.25);
  c.fillStyle = "#0b0b12";
  c.beginPath();
  c.moveTo(w / 2 - w * 0.01, hy);
  c.lineTo(w / 2 + w * 0.01, hy);
  c.lineTo(w / 2 + w * 0.45, h);
  c.lineTo(w / 2 - w * 0.45, h);
  c.closePath();
  c.fill();
  c.globalCompositeOperation = "lighter";
  for (let k = 0; k < 18; k++) {
    const z = ((k / 18 + t * 0.35) % 1) ** 2;
    const y = hy + z * (h - hy);
    const spread = 0.01 + z * 0.44;
    const r = 1 + z * h * 0.012;
    for (const side of [-1, 1]) glow(c, w / 2 + side * spread * w, y, r * 4, [255, 230, 170], 0.9 * (0.3 + z));
    if (k % 2 === 0) glow(c, w / 2, y, r * 3, [255, 255, 255], 0.5 * (0.3 + z));
  }
  c.globalCompositeOperation = "source-over";
};

/* ---------- make ---------- */
const AMBER: RGB = [255, 150, 70];
const BLUEPRINT: RGB = [120, 190, 255];

const blueprint: Scene = (c, w, h, t) => {
  bg(c, w, h, [8, 24, 54], [5, 16, 38]);
  const step = Math.max(24, w / 40);
  c.lineWidth = 1;
  for (let x = 0; x < w; x += step) {
    c.strokeStyle = `rgba(120,190,255,${Math.round(x / step) % 5 === 0 ? 0.18 : 0.07})`;
    c.beginPath();
    c.moveTo(x, 0);
    c.lineTo(x, h);
    c.stroke();
  }
  for (let y = 0; y < h; y += step) {
    c.strokeStyle = `rgba(120,190,255,${Math.round(y / step) % 5 === 0 ? 0.18 : 0.07})`;
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(w, y);
    c.stroke();
  }
  // a box drawn edge by edge, then its dimensions
  const s = Math.min(w, h) * 0.32;
  const x0 = w * 0.55;
  const y0 = h * 0.62;
  const d = s * 0.45;
  const edges: [number, number, number, number][] = [
    [x0, y0, x0 + s, y0],
    [x0 + s, y0, x0 + s, y0 - s],
    [x0 + s, y0 - s, x0, y0 - s],
    [x0, y0 - s, x0, y0],
    [x0, y0 - s, x0 + d, y0 - s - d * 0.6],
    [x0 + s, y0 - s, x0 + s + d, y0 - s - d * 0.6],
    [x0 + d, y0 - s - d * 0.6, x0 + s + d, y0 - s - d * 0.6],
    [x0 + s, y0, x0 + s + d, y0 - d * 0.6],
    [x0 + s + d, y0 - d * 0.6, x0 + s + d, y0 - s - d * 0.6],
  ];
  const prog = ((t * 0.16) % 1.3) * edges.length;
  c.strokeStyle = rgba(BLUEPRINT, 0.95);
  c.lineWidth = Math.max(1.5, h / 350);
  edges.forEach(([ax, ay, bx, by], i) => {
    const k = Math.max(0, Math.min(1, prog - i));
    if (!k) return;
    c.beginPath();
    c.moveTo(ax, ay);
    c.lineTo(ax + (bx - ax) * k, ay + (by - ay) * k);
    c.stroke();
    if (k < 1) glow(c, ax + (bx - ax) * k, ay + (by - ay) * k, h * 0.02, [200, 230, 255], 0.9);
  });
  if (prog > edges.length) {
    c.font = `${Math.round(h * 0.022)}px ui-monospace, monospace`;
    c.fillStyle = rgba(BLUEPRINT, 0.85);
    c.fillText("240", x0 + s / 2 - 14, y0 + h * 0.04);
    c.fillText("240", x0 - h * 0.06, y0 - s / 2);
  }
};

const code: Scene = (c, w, h, t) => {
  bg(c, w, h, [6, 6, 10], [12, 10, 16]);
  const size = Math.max(12, Math.round(h / 42));
  c.font = `${size}px ui-monospace, Menlo, monospace`;
  const lines = [
    "const things = await build();",
    "for (const thing of things) {",
    "  if (!thing.works) learn(thing);",
    "  else ship(thing);",
    "}",
    "",
    "function learn(thing) {",
    "  notes.push(thing.mistakes);",
    "  return tryAgain(thing);",
    "}",
    "",
    "export default things;",
  ];
  const chars = Math.floor(t * 22);
  let used = 0;
  const x0 = w * 0.42;
  const y0 = h * 0.22;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const visible = Math.max(0, Math.min(line.length, (chars % 420) - used));
    used += line.length + 4;
    const text = line.slice(0, visible);
    c.fillStyle = "rgba(255,255,255,.25)";
    c.fillText(String(i + 1).padStart(2, " "), x0 - size * 2.6, y0 + i * size * 1.6);
    c.fillStyle = text.trim().startsWith("//")
      ? "rgba(160,160,170,.8)"
      : rgba(mix([235, 225, 210], AMBER, (i % 4) / 6), 0.92);
    c.fillText(text, x0, y0 + i * size * 1.6);
    if (visible > 0 && visible < line.length) {
      const cw = c.measureText(text).width;
      if (Math.floor(t * 2) % 2 === 0) c.fillRect(x0 + cw + 2, y0 + i * size * 1.6 - size * 0.85, size * 0.55, size);
    }
  }
  glow(c, w * 0.6, h * 0.45, h * 0.6, AMBER, 0.08);
};

const blocks: Scene = (c, w, h, t) => {
  bg(c, w, h, [16, 6, 4], [40, 12, 6]);
  glow(c, w * 0.76, h, h * 0.8, AMBER, 0.35);
  const T = Math.min(w, h) * 0.07;
  const x0 = w * 0.78;
  const y0 = h * 0.88;
  const plan = 20;
  const prog = (t % 12) / 12;
  const placed = Math.min(plan, Math.floor(prog * (plan + 4)));
  for (let k = 0; k < placed; k++) {
    const col = (k % 4) - 2;
    const row = Math.floor(k / 4);
    const land = (prog * (plan + 4) - k) * 4;
    const drop = land < 1 ? (1 - land) * T * 4 : 0;
    const x = x0 + col * T;
    const y = y0 - (row + 1) * T - drop;
    const metal: RGB = k % 5 === 0 ? [210, 205, 196] : k % 2 ? [120, 64, 44] : [150, 82, 52];
    const g = c.createLinearGradient(x, y, x, y + T);
    g.addColorStop(0, rgba(mix(metal, [255, 210, 160], 0.35)));
    g.addColorStop(1, rgba(mix(metal, [0, 0, 0], 0.35)));
    c.fillStyle = g;
    c.beginPath();
    c.roundRect(x + 1, y + 1, T - 2, T - 2, T * 0.12);
    c.fill();
    if (land >= 1 && land < 1.5) {
      c.globalCompositeOperation = "lighter";
      glow(c, x + T / 2, y + T, T * 1.4, [255, 210, 120], (1.5 - land) * 1.4);
      c.globalCompositeOperation = "source-over";
    }
  }
  dust(c, w, h, t, AMBER, 50);
};

const circuit: Scene = (c, w, h, t) => {
  bg(c, w, h, [4, 10, 8], [8, 18, 14]);
  const step = Math.max(30, w / 26);
  const cols = Math.ceil(w / step);
  const traces: [number, number][][] = [];
  for (let i = 0; i < 18; i++) {
    let x = Math.floor(hash(i * 3.1) * cols) * step;
    let y = Math.floor(hash(i * 7.9) * (h / step)) * step;
    const path: [number, number][] = [[x, y]];
    for (let s = 0; s < 6; s++) {
      if (hash(i * 13 + s) > 0.5) x += step * (1 + Math.floor(hash(i + s * 5) * 3));
      else y += (hash(i * 17 + s) > 0.5 ? 1 : -1) * step * (1 + Math.floor(hash(i + s * 7) * 2));
      path.push([x, y]);
    }
    traces.push(path);
  }
  c.lineWidth = Math.max(1.5, h / 400);
  for (const [i, p] of traces.entries()) {
    c.strokeStyle = "rgba(120,255,190,.18)";
    c.beginPath();
    p.forEach(([x, y], k) => (k ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.stroke();
    for (const [x, y] of [p[0], p[p.length - 1]]) {
      c.fillStyle = "rgba(120,255,190,.5)";
      c.beginPath();
      c.arc(x, y, step * 0.1, 0, TAU);
      c.fill();
    }
    // a pulse travelling along it
    const life = (t * (0.2 + hash(i) * 0.25) + hash(i * 2)) % 1;
    const seg = life * (p.length - 1);
    const a = p[Math.floor(seg)];
    const b = p[Math.min(p.length - 1, Math.floor(seg) + 1)];
    const k = seg % 1;
    c.globalCompositeOperation = "lighter";
    glow(c, a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, step * 0.5, [140, 255, 200], 0.9);
    c.globalCompositeOperation = "source-over";
  }
};

export const SCENES = {
  waves,
  bars,
  staff,
  rings,
  horizon,
  clouds,
  route,
  runway,
  blueprint,
  code,
  blocks,
  circuit,
} as const;
export type SceneName = keyof typeof SCENES;
