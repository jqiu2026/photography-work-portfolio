import {
  PAINTERS,
  type RGB,
  TAU,
  clamp,
  dot,
  ease,
  glow,
  hash,
  hex,
  meteors,
  mix,
  noise1,
  rgba,
  stars,
  vgrad,
} from "./paint";
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
  /** the Nexus's light, easing toward the front gate's colour */
  tint?: RGB;
  /** a gate named by the pointer over its button in the console (it lights up) */
  hover?: number;
  /** seconds since the ring last turned to a new gate (a ripple of light crosses the platform) */
  shift?: number;
  /** pointer, -1..1, eased: far layers drift against it */
  mx?: number;
  my?: number;
};

const VOID: RGB = hex("#05030c");
let dive: HTMLCanvasElement | null = null;
const GW = 6; // gate proportions: 6 wide, 8 tall
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

/** Where each gate stands this frame, back to front. */
export function gates(w: number, h: number, s: HubState): Gate[] {
  const { cx, cy, rx, ry, unit } = layout(w, h);
  return LOOKS.map((_, i) => {
    const a = ((i - s.rot) / LOOKS.length) * TAU + Math.PI / 2;
    const depth = (Math.sin(a) + 1) / 2;
    let T = unit * (0.45 + 0.85 * depth);
    let x = cx + Math.cos(a) * rx;
    // gates further back float higher, on stones of their own, so all four stay in view
    let y = cy + Math.sin(a) * ry - (1 - depth) * unit * 6.5;
    if (s.dive > 0 && i === s.sel) {
      const k = ease(s.dive);
      T = Math.max(T, T + k * (h / 4.5));
      x += (w / 2 - x) * k;
      y += (h / 2 + (T * GH) / 2 - y) * k;
    }
    return { i, x: Math.round(x - (T * GW) / 2), y: Math.round(y - T * GH), w: T * GW, h: T * GH, depth };
  }).sort((p, q) => p.depth - q.depth);
}

/** The arch of a portal: straight sides, a round top. */
function arch(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fresh = true) {
  const r = w / 2;
  if (fresh) c.beginPath();
  c.moveTo(x, y + h);
  c.lineTo(x, y + r);
  c.arc(x + r, y + r, r, Math.PI, 0);
  c.lineTo(x + w, y + h);
  c.closePath();
}

function drawGate(c: CanvasRenderingContext2D, g: Gate, s: HubState, t: number, front: boolean) {
  const look = LOOKS[g.i];
  const [face, deep, trim] = look.frame;
  const fw = g.w * 0.13; // frame thickness
  const fog = (1 - g.depth) * 0.5;
  const named = g.i === s.hover && !front;
  // the stone a floating gate stands on, and its thread of light down to the platform
  if (g.depth < 0.9 && s.dive === 0) {
    const sy = g.y + g.h;
    const sg = c.createLinearGradient(0, sy, 0, sy + g.w * 0.45);
    sg.addColorStop(0, rgba(mix(hex("#4a4562"), look.accent, 0.15)));
    sg.addColorStop(1, rgba(VOID, 0));
    c.fillStyle = sg;
    c.beginPath();
    c.moveTo(g.x - fw, sy);
    c.lineTo(g.x + g.w + fw, sy);
    c.quadraticCurveTo(g.x + g.w * 0.7, sy + g.w * 0.25, g.x + g.w / 2, sy + g.w * 0.45);
    c.quadraticCurveTo(g.x + g.w * 0.3, sy + g.w * 0.25, g.x - fw, sy);
    c.fill();
    const thread = (1 - g.depth) * g.w * 1.2;
    const tg = c.createLinearGradient(0, sy + g.w * 0.3, 0, sy + g.w * 0.3 + thread);
    tg.addColorStop(0, rgba(look.accent, 0.5));
    tg.addColorStop(1, rgba(look.accent, 0));
    c.fillStyle = tg;
    c.fillRect(g.x + g.w / 2 - 0.6, sy + g.w * 0.3, 1.2, thread);
  }
  // light around the front gate and onto the stone
  if (front || named) {
    c.globalCompositeOperation = "lighter";
    glow(c, g.x + g.w / 2, g.y + g.h * 0.55, g.h * 0.85, look.accent, front ? 0.28 : 0.18);
    c.globalCompositeOperation = "source-over";
  }
  // the world inside, swirling
  const ix = g.x + fw;
  const iy = g.y + fw;
  const iw = g.w - 2 * fw;
  const ih = g.h - fw;
  c.save();
  arch(c, ix, iy, iw, ih);
  c.clip();
  if (s.dive > 0 && g.i === s.sel) {
    // stepping through: the world at full detail, not the small preview blown up
    dive ??= document.createElement("canvas");
    const dw = Math.max(8, Math.min(Math.round(iw), 1600));
    const dh = Math.max(8, Math.min(Math.round(ih), 1600));
    if (dive.width !== dw || dive.height !== dh) {
      dive.width = dw;
      dive.height = dh;
    }
    const dc = dive.getContext("2d");
    if (dc) PAINTERS[look.key](dc, dw, dh, t);
    c.drawImage(dive, ix, iy, iw, ih);
  } else {
    const pv = s.previews[g.i];
    if (pv) c.drawImage(pv, ix, iy, iw, ih);
  }
  const k = 1 - s.dive;
  const sw = c.createRadialGradient(ix + iw / 2, iy + ih * 0.55, 0, ix + iw / 2, iy + ih * 0.55, ih * 0.7);
  sw.addColorStop(0, rgba(mix(look.accent, [255, 255, 255], 0.5), 0.05 * k));
  sw.addColorStop(0.6, rgba(mix(look.accent, [60, 10, 120], 0.4), (0.22 + 0.08 * Math.sin(t * 2 + g.i)) * k));
  sw.addColorStop(1, rgba(mix(look.accent, [20, 0, 40], 0.5), 0.55 * k));
  c.fillStyle = sw;
  c.fillRect(ix, iy, iw, ih);
  c.globalCompositeOperation = "lighter";
  c.lineWidth = Math.max(0.6, iw / 90);
  for (let arm = 0; arm < 3; arm++) {
    c.strokeStyle = rgba(mix(look.accent, [255, 255, 255], 0.5), 0.35 * k);
    c.beginPath();
    for (let q = 0; q <= 1; q += 0.04) {
      const r = q * ih * 0.55;
      const a = arm * (TAU / 3) + q * 4 + t * 1.6;
      const x = ix + iw / 2 + Math.cos(a) * r * (iw / ih);
      const y = iy + ih * 0.55 + Math.sin(a) * r;
      if (q === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();
  }
  c.globalCompositeOperation = "source-over";
  c.restore();
  // the frame: carved stone with a glowing seam along its inside edge
  const fg = c.createLinearGradient(g.x, g.y, g.x + g.w, g.y + g.h);
  fg.addColorStop(0, rgba(mix(face, [255, 255, 255], 0.15)));
  fg.addColorStop(0.55, rgba(face));
  fg.addColorStop(1, rgba(deep));
  c.fillStyle = fg;
  arch(c, g.x, g.y, g.w, g.h);
  arch(c, ix, iy, iw, ih + 0.5, false);
  c.fill("evenodd");
  c.strokeStyle = rgba(trim, 0.55 + 0.35 * Math.sin(t * 3 + g.i));
  c.lineWidth = Math.max(0.8, fw * 0.18);
  arch(c, ix, iy, iw, ih);
  c.stroke();
  c.strokeStyle = rgba(mix(face, [0, 0, 0], 0.4), 0.8);
  c.lineWidth = Math.max(0.6, fw * 0.08);
  arch(c, g.x, g.y, g.w, g.h);
  c.stroke();
  // keystone
  dot(c, g.x + g.w / 2, g.y + fw * 0.5, fw * 0.32, rgba(trim, 0.9));
  if (named) {
    c.strokeStyle = rgba(look.accent, 0.55 + 0.35 * Math.sin(t * 6));
    c.lineWidth = Math.max(1, fw * 0.2);
    arch(c, g.x - fw * 0.4, g.y - fw * 0.4, g.w + fw * 0.8, g.h + fw * 0.4);
    c.stroke();
  }
  if (fog > 0.02) {
    c.fillStyle = rgba(VOID, fog * (named ? 0.3 : 1));
    arch(c, g.x - 1, g.y - 1, g.w + 2, g.h + 1);
    c.fill();
  }
}

/** The Nexus: a floating stone in a void under aurora, the core's beam, and four portals on a ring. */
export function paintNexus(c: CanvasRenderingContext2D, w: number, h: number, t: number, s: HubState) {
  const look = LOOKS[s.sel];
  const acc = s.tint ?? look.accent;
  const next = LOOKS[(s.sel + 1) % LOOKS.length];
  const par = (k: number) => [-(s.mx ?? 0) * k * (w / 360), -(s.my ?? 0) * k * 0.6 * (w / 360)] as const;
  const r = s.reveal;
  const { cx, cy, rx: grx, ry: gry, unit } = layout(w, h);
  vgrad(c, 0, 0, w, h, [hex("#020108"), mix(hex("#070418"), acc, 0.08), hex("#0b0716"), hex("#030207")]);
  c.globalCompositeOperation = "lighter";
  glow(c, cx, cy - h * 0.25, h * 0.7, acc, 0.1 * r);
  c.globalCompositeOperation = "source-over";

  c.save();
  c.translate(...par(2));
  stars(c, w, h, t, Math.round((w * h) / (h * h * 0.004)), acc, 0.003);
  meteors(c, w, h, t, acc, 7);
  c.restore();

  // aurora: soft curtains of light in the front gate's colour
  c.save();
  c.translate(...par(4));
  c.globalCompositeOperation = "lighter";
  const aur = clamp(r * 1.6 - 0.2);
  const step = Math.max(2, w / 260);
  for (let x = 0; x < w; x += step) {
    const y0 = h * (0.04 + 0.16 * noise1(x * 0.004 + t * 0.05));
    const len = h * (0.18 + 0.22 * noise1(x * 0.008 - t * 0.04 + 9));
    const glowK = (0.4 + 0.6 * noise1(x * 0.02 + t * 0.25)) * (0.4 + 0.6 * noise1(x * 0.1 + t * 0.4));
    const col = mix(
      mix(acc, next.accent, noise1(x * 0.003 - t * 0.03 + 4) * 0.7),
      [150, 255, 230],
      noise1(x * 0.006 + 7) * 0.25,
    );
    const g = c.createLinearGradient(0, y0, 0, y0 + len);
    g.addColorStop(0, rgba(col, 0));
    g.addColorStop(0.25, rgba(col, 0.12 * aur * glowK));
    g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g;
    c.fillRect(x, y0, step + 0.5, len);
  }
  c.globalCompositeOperation = "source-over";
  c.restore();

  // rocks drifting on far orbits
  c.save();
  c.translate(...par(7));
  for (let i = 0; i < 7; i++) {
    const a = t * (0.02 + hash(i) * 0.02) + i;
    const x = w / 2 + Math.cos(a) * w * (0.38 + hash(i * 3) * 0.12);
    const y = h * (0.3 + hash(i * 5) * 0.25) + Math.sin(a) * h * 0.05;
    const s2 = unit * (0.8 + hash(i * 7) * 1.4);
    c.fillStyle = rgba(mix(hex("#2a2638"), VOID, 0.3), r);
    c.beginPath();
    c.moveTo(x - s2, y);
    c.lineTo(x + s2, y - s2 * 0.15);
    c.lineTo(x + s2 * 0.4, y + s2 * 0.8);
    c.lineTo(x - s2 * 0.3, y + s2 * 0.6);
    c.closePath();
    c.fill();
    c.strokeStyle = rgba(acc, 0.4 * r);
    c.lineWidth = Math.max(0.6, unit * 0.06);
    c.beginPath();
    c.moveTo(x - s2, y);
    c.lineTo(x + s2, y - s2 * 0.15);
    c.stroke();
  }
  c.restore();

  // the platform: a floating stone disc with a lit rim and a rock face that tapers into the void
  const rx = grx * 1.28;
  const ry = gry * 1.45;
  const rise = (1 - ease(clamp(r * 1.4))) * h * 0.25;
  const py = cy + rise;
  const under = c.createLinearGradient(0, py, 0, py + h * 0.28);
  under.addColorStop(0, rgba(hex("#2a2538"), r));
  under.addColorStop(1, rgba(VOID, 0));
  c.fillStyle = under;
  c.beginPath();
  c.moveTo(cx - rx, py);
  for (let k = 0; k <= 24; k++) {
    const q = k / 24;
    const x = cx - rx + q * rx * 2;
    const depth = Math.sin(q * Math.PI) ** 0.7 * h * (0.16 + 0.1 * noise1(k * 1.7));
    c.lineTo(x, py + ry * 0.6 + depth);
  }
  c.lineTo(cx + rx, py);
  c.closePath();
  c.fill();
  // the side face
  const side = c.createLinearGradient(0, py, 0, py + ry * 0.9);
  side.addColorStop(0, rgba(hex("#3a3550")));
  side.addColorStop(1, rgba(hex("#1c1928")));
  c.fillStyle = side;
  c.beginPath();
  c.ellipse(cx, py + ry * 0.35, rx, ry, 0, 0, Math.PI);
  c.lineTo(cx - rx, py);
  c.ellipse(cx, py, rx, ry, 0, Math.PI, 0, true);
  c.fill();
  // the top
  const topG = c.createRadialGradient(cx, py - ry * 0.3, 0, cx, py, rx);
  topG.addColorStop(0, rgba(mix(hex("#56506e"), acc, 0.08)));
  topG.addColorStop(1, rgba(hex("#2b2739")));
  c.fillStyle = topG;
  c.beginPath();
  c.ellipse(cx, py, rx, ry, 0, 0, TAU);
  c.fill();
  c.strokeStyle = rgba(acc, 0.45 * r);
  c.lineWidth = Math.max(1, unit * 0.08);
  c.beginPath();
  c.ellipse(cx, py, rx, ry, 0, 0, TAU);
  c.stroke();
  // the rune ring, flowing
  c.save();
  c.globalCompositeOperation = "lighter";
  c.setLineDash([unit * 0.9, unit * 0.5]);
  c.lineDashOffset = -t * unit * 2;
  c.strokeStyle = rgba(acc, 0.55 * r);
  c.lineWidth = Math.max(1, unit * 0.1);
  c.beginPath();
  c.ellipse(cx, py, rx * 0.62, ry * 0.62, 0, 0, TAU);
  c.stroke();
  c.setLineDash([]);
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU + t * 0.1;
    glow(
      c,
      cx + Math.cos(a) * rx * 0.62,
      py + Math.sin(a) * ry * 0.62,
      unit * 0.6,
      mix(acc, [255, 255, 255], 0.5),
      0.8 * r,
    );
  }
  // the ripple when a new gate comes to the front
  if (s.shift !== undefined && s.shift < 1.4) {
    const k = s.shift / 1.4;
    c.strokeStyle = rgba(mix(acc, [255, 255, 255], 0.4), (1 - k) * 0.8);
    c.lineWidth = Math.max(1, unit * 0.15 * (1 - k) + 0.5);
    c.beginPath();
    c.ellipse(cx, py, rx * (0.2 + k * 0.85), ry * (0.2 + k * 0.85), 0, 0, TAU);
    c.stroke();
  }
  c.restore();

  const ring = gates(w, h, s).map((g) => ({ ...g, y: g.y + rise }));
  const sel = (g: Gate) => g.i === s.sel && s.dive === 0;
  for (const g of ring) if (g.depth < 0.5) drawGate(c, g, s, t, false);

  // the core: a column of light, a turning crystal, and a helix of motes
  const beat = 0.6 + 0.4 * Math.sin(t * 1.7);
  const coreY = Math.max(unit * 2.5, cy - unit * 19) + Math.sin(t * 1.1) * unit * 0.4 + rise * 0.3;
  c.globalCompositeOperation = "lighter";
  const beam = c.createLinearGradient(cx - unit * 1.5, 0, cx + unit * 1.5, 0);
  beam.addColorStop(0, rgba(acc, 0));
  beam.addColorStop(0.5, rgba(mix(acc, [255, 255, 255], 0.5), 0.35 * beat * r));
  beam.addColorStop(1, rgba(acc, 0));
  c.fillStyle = beam;
  c.fillRect(cx - unit * 1.5, 0, unit * 3, py);
  glow(c, cx, coreY, unit * 6, acc, 0.45 * beat * r);
  const cs = unit * 1.3;
  const turn = Math.sin(t * 1.4);
  c.fillStyle = rgba(mix(acc, [255, 255, 255], 0.35), r);
  c.beginPath();
  c.moveTo(cx, coreY - cs * 1.6);
  c.lineTo(cx + cs * Math.abs(turn) * 0.9 + cs * 0.1, coreY);
  c.lineTo(cx, coreY + cs * 1.6);
  c.lineTo(cx - cs * Math.abs(turn) * 0.9 - cs * 0.1, coreY);
  c.closePath();
  c.fill();
  c.fillStyle = rgba([255, 255, 255], 0.8 * r);
  c.beginPath();
  c.moveTo(cx, coreY - cs * 1.6);
  c.lineTo(cx + cs * turn * 0.5, coreY);
  c.lineTo(cx, coreY + cs * 1.6);
  c.closePath();
  c.fill();
  for (let k = 0; k < 46; k++) {
    const y = py * (1 - ((k / 46 + t * 0.06) % 1));
    const a = y * 0.02 + t * 2 + (k % 2) * Math.PI;
    glow(
      c,
      cx + Math.cos(a) * unit * 2.4,
      y,
      unit * 0.35,
      mix(acc, [255, 255, 255], 0.4),
      0.8 * r * (Math.sin(a) > 0 ? 1 : 0.4),
    );
  }
  c.globalCompositeOperation = "source-over";

  for (const g of ring) if (g.depth >= 0.5) drawGate(c, g, s, t, sel(g));

  // motes rising from the front gate
  const f = ring.find((g) => g.i === s.sel);
  if (f && s.dive === 0) {
    c.globalCompositeOperation = "lighter";
    for (let k = 0; k < 24; k++) {
      const life = (t * 0.25 + hash(k)) % 1;
      glow(
        c,
        f.x + hash(k * 3) * f.w + Math.sin(t * 2 + k) * unit * 0.3,
        f.y + f.h - life * f.h * 1.6,
        unit * 0.35,
        look.accent,
        (1 - life) * 0.9,
      );
    }
    c.globalCompositeOperation = "source-over";
  }

  // mist at the foot of the view
  vgrad(c, 0, h * 0.8, w, h * 0.2, [VOID, mix(VOID, acc, 0.14)], 0.6);
  if (r < 1) {
    c.fillStyle = rgba([0, 0, 0], 1 - clamp(r * 1.3));
    c.fillRect(0, 0, w, h);
  }
  return ring;
}
