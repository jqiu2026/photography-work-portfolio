import { PAINTERS, type RGB, TAU, bands, block, clamp, ease, fill, hash, hex, mix, noise1, rgba, stars } from "./paint";
import { LOOKS } from "./realms";

export type Gate = { i: number; x: number; y: number; w: number; h: number; depth: number };

export type HubState = {
  /** ring rotation in gate steps (animated toward -selected) */
  rot: number;
  sel: number;
  /** 0 at load, 1 once the Nexus has assembled */
  reveal: number;
  /** 0..1 while stepping into the selected gate (it grows to fill the view) */
  dive: number;
  /** each world rendered small, for the gate interiors */
  previews: HTMLCanvasElement[];
};

const VOID: RGB = hex("#05030c");
let dive: HTMLCanvasElement | null = null;
const GW = 6; // gate size in tiles, frame included
const GH = 8;

/** Where the platform sits: right of the text on wide screens, centred and lower on tall ones. */
export function layout(w: number, h: number) {
  const wide = w / h > 1.15;
  return {
    cx: wide ? w * 0.68 : w / 2,
    cy: wide ? h * 0.6 : h * 0.64,
    rx: wide ? Math.min(w * 0.235, h * 0.7) : w * 0.34,
    ry: wide ? h * 0.075 : h * 0.04,
    unit: wide ? h / 40 : Math.min(h / 56, w / 30),
  };
}

/** Where each gate stands this frame (buffer pixels), back to front. */
export function gates(w: number, h: number, s: HubState): Gate[] {
  const { cx, cy, rx, ry, unit } = layout(w, h);
  return LOOKS.map((_, i) => {
    const a = ((i - s.rot) / LOOKS.length) * TAU + Math.PI / 2;
    const depth = (Math.sin(a) + 1) / 2;
    let T = Math.max(1, Math.round(unit * (0.45 + 0.85 * depth)));
    let x = cx + Math.cos(a) * rx;
    // gates further back float higher, on slabs, so all four stay in view
    let y = cy + Math.sin(a) * ry - (1 - depth) * unit * 6.5;
    if (s.dive > 0 && i === s.sel) {
      const k = ease(s.dive);
      T = Math.max(T, Math.round(T + k * (h / 4.5)));
      x += (w / 2 - x) * k;
      y += (h / 2 + (T * GH) / 2 - y) * k;
    }
    return { i, x: Math.round(x - (T * GW) / 2), y: Math.round(y - T * GH), w: T * GW, h: T * GH, depth };
  }).sort((p, q) => p.depth - q.depth);
}

function drawGate(c: CanvasRenderingContext2D, g: Gate, s: HubState, t: number, front: boolean) {
  const look = LOOKS[g.i];
  const T = g.w / GW;
  const [face, deep, trim] = look.frame;
  const fog = (1 - g.depth) * 0.55;
  // the slab a floating gate stands on, and its thread of light down to the platform
  if (g.depth < 0.9 && s.dive === 0) {
    fill(c, g.x - T * 0.5, g.y + g.h, g.w + T, T, rgba(mix(hex("#3a3550"), VOID, 0.2)));
    fill(c, g.x - T * 0.5, g.y + g.h, g.w + T, 1, rgba(look.accent, 0.6));
    fill(c, g.x + T, g.y + g.h + T, g.w - 2 * T, Math.max(1, T / 2), rgba(hex("#1d1a28")));
    const thread = (1 - g.depth) * T * 7;
    for (let y = 0; y < thread; y += 2)
      fill(c, g.x + g.w / 2, g.y + g.h + T * 1.5 + y, 1, 1, rgba(look.accent, 0.5 * (1 - y / thread)));
  }
  // light spilling from the gate onto the stone
  if (front) {
    for (let k = 3; k > 0; k--)
      fill(c, g.x - T * k, g.y + g.h - T * 0.5, g.w + T * k * 2, T * (0.6 + k * 0.3), rgba(look.accent, 0.07 * k));
    for (let k = 3; k > 0; k--)
      fill(c, g.x - T * k * 0.7, g.y - T * k * 0.7, g.w + T * k * 1.4, g.h + T * k * 0.7, rgba(look.accent, 0.035 * k));
  }
  // the world inside, swirling
  const ix = g.x + T;
  const iy = g.y + T;
  const iw = g.w - 2 * T;
  const ih = g.h - 2 * T;
  const pv = s.previews[g.i];
  if (s.dive > 0 && g.i === s.sel) {
    // stepping through: the world at full detail, not the little preview blown up
    dive ??= document.createElement("canvas");
    const dw = Math.max(8, Math.min(Math.round(iw), 1200));
    const dh = Math.max(8, Math.min(Math.round(ih), 1200));
    if (dive.width !== dw || dive.height !== dh) {
      dive.width = dw;
      dive.height = dh;
    }
    const dc = dive.getContext("2d");
    if (dc) PAINTERS[look.key](dc, dw, dh, t);
    c.drawImage(dive, ix, iy, iw, ih);
  } else if (pv) c.drawImage(pv, ix, iy, iw, ih);
  const swirl = 0.28 + 0.12 * Math.sin(t * 2 + g.i);
  fill(c, ix, iy, iw, ih, rgba(mix(look.accent, [60, 10, 120], 0.45), swirl * (1 - s.dive)));
  const n = Math.round((iw * ih) / 18);
  for (let k = 0; k < n; k++) {
    const r = (k / n + t * 0.2 + hash(k + g.i * 99) * 0.4) % 1;
    const a = k * 2.39996 + t * (1.2 + (k % 3) * 0.4);
    const px = ix + iw / 2 + Math.cos(a) * r * iw * 0.5;
    const py = iy + ih / 2 + Math.sin(a) * r * ih * 0.5;
    fill(c, px, py, 1, 1, rgba(mix(look.accent, [255, 255, 255], 0.5), 0.55 * (1 - r) * (1 - s.dive * 0.7)));
  }
  // frame: blocks with a glowing seam
  for (let tx = 0; tx < GW; tx++)
    for (let ty = 0; ty < GH; ty++) {
      if (tx > 0 && tx < GW - 1 && ty > 0 && ty < GH - 1) continue;
      const base = hash(tx * 3.3 + ty * 7.1 + g.i * 13) > 0.7 ? deep : face;
      block(c, g.x + tx * T, g.y + ty * T, T, base, 0.22, 0.35);
      if (T >= 3 && hash(tx * 5.7 + ty * 2.1 + g.i) > 0.55)
        fill(
          c,
          g.x + tx * T + T / 3,
          g.y + ty * T + T / 3,
          Math.max(1, T / 3),
          1,
          rgba(trim, 0.5 + 0.4 * Math.sin(t * 3 + tx + ty)),
        );
    }
  if (front) {
    const pulse = 0.5 + 0.5 * Math.sin(t * 3);
    fill(c, g.x, g.y - 1, g.w, 1, rgba(trim, 0.4 + pulse * 0.4));
  }
  if (fog > 0.02) fill(c, g.x, g.y, g.w, g.h, rgba(VOID, fog));
}

/** The Nexus: a stone platform in a void under moving aurora, the core's beam, and four gates on a ring. */
export function paintNexus(c: CanvasRenderingContext2D, w: number, h: number, t: number, s: HubState) {
  c.imageSmoothingEnabled = false;
  const look = LOOKS[s.sel];
  const next = LOOKS[(s.sel + 1) % LOOKS.length];
  const T = Math.max(2, Math.round(h / 60));
  const r = s.reveal;
  bands(c, 0, 0, w, h, [hex("#020108"), mix(hex("#070418"), look.accent, 0.07), hex("#0b0716"), hex("#030207")], 2);
  stars(c, w, h, t, Math.round((w * h) / 240), look.accent, 0.003);

  // aurora curtains in the front gate's colour
  const aur = clamp(r * 1.6 - 0.2);
  for (let x = 0; x < w; x += 2) {
    const y0 = h * (0.06 + 0.16 * noise1(x * 0.012 + t * 0.05));
    const len = h * (0.16 + 0.2 * noise1(x * 0.025 - t * 0.04 + 9));
    const glow = 0.45 + 0.55 * noise1(x * 0.06 + t * 0.25);
    const col = mix(
      mix(look.accent, next.accent, noise1(x * 0.008 - t * 0.03 + 4) * 0.7),
      [150, 255, 230],
      noise1(x * 0.02 + 7) * 0.25,
    );
    for (let yy = 0; yy < len; yy += 2)
      fill(
        c,
        x,
        y0 + yy,
        2,
        2,
        rgba(col, 0.42 * aur * glow * (0.4 + 0.6 * noise1(x * 0.3 + t * 0.4)) * (1 - yy / len) ** 1.3),
      );
  }

  // debris islands drifting on far orbits
  for (let i = 0; i < 7; i++) {
    const a = t * (0.02 + hash(i) * 0.02) + i;
    const x = w / 2 + Math.cos(a) * w * (0.38 + hash(i * 3) * 0.12);
    const y = h * (0.3 + hash(i * 5) * 0.25) + Math.sin(a) * h * 0.05;
    const s2 = Math.max(1, Math.round(T * (0.5 + hash(i * 7))));
    const n = 2 + Math.floor(hash(i * 11) * 3);
    for (let k = 0; k < n; k++) fill(c, x + k * s2, y, s2, s2, rgba(mix(hex("#3a3550"), VOID, 0.4), r));
    fill(c, x, y, n * s2, 1, rgba(look.accent, 0.35 * r));
    fill(c, x + s2, y + s2, Math.max(1, (n - 2) * s2), s2, rgba(hex("#1a1626"), r));
  }

  // the platform: a stone disc with a lit rim, a rock face, and roots of rock hanging into the void
  const { cx, cy, rx: grx, ry: gry, unit } = layout(w, h);
  const rx = grx * 1.28;
  const ry = gry * 1.45;
  const rise = (1 - ease(clamp(r * 1.4))) * h * 0.25;
  const disc = (dy: number) => Math.round((rx * Math.sqrt(Math.max(0, 1 - (dy / ry) ** 2))) / T) * T;
  const roots = Math.round((h * 0.16) / T);
  for (let k = roots; k >= 1; k--) {
    const half = Math.round((rx * (1 - k / (roots + 2)) ** 1.6) / T) * T;
    const y = cy + ry + T * 2 + k * T + rise;
    for (let x = cx - half; x < cx + half; x += T) {
      if (hash(Math.round(x / T) * 0.37 + k * 9.1) > 1.05 - k * 0.07) continue;
      fill(c, x, y, T, T, rgba(mix(hex("#221d30"), VOID, k / (roots + 1))));
    }
  }
  for (let k = 3; k >= 1; k--)
    for (let dy = -ry; dy <= ry; dy += T) {
      if (dy < ry - T * 2) continue;
      const half = disc(dy);
      for (let x = cx - half; x < cx + half; x += T) {
        const v = hash(Math.round(x / T) * 5.3 + k * 3.1);
        fill(c, x, cy + dy + k * T + rise, T, T, rgba(mix(hex("#1f1b2b"), hex("#2c2740"), v * 0.6 + (3 - k) * 0.1)));
      }
    }
  for (let dy = -ry; dy <= ry; dy += T) {
    const half = disc(dy);
    for (let x = cx - half; x < cx + half; x += T) {
      const gx = Math.round(x / T);
      const gy = Math.round(dy / T);
      const v = hash(gx * 3.1 + gy * 7.3);
      const light = 0.5 + (0.5 * -dy) / ry;
      const base = mix(mix(hex("#2e2a3e"), hex("#4a4562"), v * 0.5 + light * 0.3), look.accent, 0.04);
      fill(c, x, cy + dy + rise, T, T, rgba(base));
      if ((gx + gy) % 2 === 0) fill(c, x, cy + dy + rise, T, 1, rgba(mix(base, [255, 255, 255], 0.08)));
      if (Math.abs(x - cx) > half - T * 1.2 || dy > ry - T * 1.2)
        fill(c, x, cy + dy + rise, T, 1, rgba(look.accent, 0.35 * r));
    }
  }
  // the rune ring: an even line with eight lit nodes
  for (let a = 0; a < TAU; a += 0.012) {
    const node = Math.abs((((a / TAU) * 8) % 1) - 0.5) > 0.47;
    const flow = 0.5 + 0.5 * Math.sin(a * 6 - t * 2.4);
    const x = cx + Math.cos(a) * rx * 0.62;
    const y = cy + Math.sin(a) * ry * 0.62 + rise;
    fill(
      c,
      x,
      y,
      node ? 2 : 1,
      node ? 2 : 1,
      rgba(mix(look.accent, [255, 255, 255], node ? 0.5 : 0), (0.25 + 0.6 * flow) * r),
    );
  }

  const ring = gates(w, h, s).map((g) => ({ ...g, y: g.y + rise }));
  const sel = (g: Gate) => g.i === s.sel && s.dive === 0;
  for (const g of ring) if (g.depth < 0.5) drawGate(c, g, s, t, false);

  // the core: a column of light, a turning crystal, and a helix of motes
  const beat = 0.6 + 0.4 * Math.sin(t * 1.7);
  const coreY = Math.max(unit * 2.5, cy - unit * 19) + Math.sin(t * 1.1) * unit * 0.4 + rise * 0.3;
  bands(c, cx - T * 3, 0, T * 6, coreY, [hex("#000000"), look.accent], 2, 0.12 * beat * r);
  bands(c, cx - T, 0, T * 2, coreY, [hex("#000000"), mix(look.accent, [255, 255, 255], 0.5)], 2, 0.3 * beat * r);
  fill(c, cx, 0, 1, coreY, rgba([255, 255, 255], 0.6 * beat * r));
  const cs = Math.max(1, Math.round(unit * 0.6));
  const turn = Math.floor(t * 4) % 4;
  for (let k = 3; k > 0; k--)
    fill(
      c,
      cx - cs * (3 + k * 1.5),
      coreY - cs * (3 + k * 1.5),
      cs * (6 + k * 3),
      cs * (6 + k * 3),
      rgba(look.accent, 0.05 * beat * r),
    );
  for (let row = -3; row <= 3; row++) {
    const wdt = 4 - Math.abs(row);
    for (let col = -wdt + 1; col < wdt; col++) {
      const lit = col === turn - 2 || col === turn - 1;
      const k = 0.35 + 0.65 * (1 - Math.abs(row) / 4);
      fill(
        c,
        cx + col * cs - cs / 2,
        coreY + row * cs,
        cs,
        cs,
        rgba(mix(look.accent, [255, 255, 255], lit ? 0.75 : k * 0.4), r),
      );
    }
  }
  bands(
    c,
    cx - T * 2,
    coreY + cs * 4,
    T * 4,
    cy - coreY - cs * 4 + rise,
    [mix(look.accent, [255, 255, 255], 0.3), look.accent],
    2,
    0.22 * beat * r,
  );
  fill(c, cx, coreY + cs * 4, 1, cy - coreY - cs * 4 + rise, rgba([255, 255, 255], 0.7 * beat * r));
  for (let k = 0; k < 46; k++) {
    const y = (cy + rise) * (1 - ((k / 46 + t * 0.06) % 1));
    const a = y * 0.08 + t * 2 + (k % 2) * Math.PI;
    fill(
      c,
      cx + Math.cos(a) * T * 3,
      y,
      1,
      1,
      rgba(mix(look.accent, [255, 255, 255], 0.4), 0.8 * r * (Math.sin(a) > 0 ? 1 : 0.4)),
    );
  }

  for (const g of ring) if (g.depth >= 0.5) drawGate(c, g, s, t, sel(g));

  // motes rising from the front gate
  const f = ring.find((g) => g.i === s.sel);
  if (f && s.dive === 0)
    for (let k = 0; k < 24; k++) {
      const life = (t * 0.25 + hash(k)) % 1;
      fill(
        c,
        f.x + hash(k * 3) * f.w + Math.sin(t * 2 + k) * 2,
        f.y + f.h - life * f.h * 1.6,
        1,
        1,
        rgba(look.accent, (1 - life) * 0.8),
      );
    }

  // fog at the foot of the view
  bands(c, 0, h * 0.82, w, h * 0.18, [VOID, mix(VOID, look.accent, 0.12)], 2, 0.6);
  if (r < 1) fill(c, 0, 0, w, h, rgba([0, 0, 0], 1 - clamp(r * 1.3)));
  return ring;
}
