import { describe, expect, it } from "vitest";
import { gates, layout } from "@/components/home/nexus/hub";
import { clamp, ease, fbm1, hash, hex, mix, noise1, noise2, rgba } from "@/components/home/nexus/paint";
import { LOOKS, lookOf } from "@/components/home/nexus/realms";

const state = (rot: number, sel: number, dive = 0) => ({ rot, sel, reveal: 1, dive, previews: [] });

describe("the Nexus ring", () => {
  it("puts the selected gate in front, largest and drawn last", () => {
    for (let sel = 0; sel < 4; sel++) {
      const ring = gates(360, 225, state(sel, sel));
      const front = ring[ring.length - 1];
      expect(front.i).toBe(sel);
      expect(front.depth).toBeCloseTo(1, 5);
      expect(Math.max(...ring.map((g) => g.w))).toBe(front.w);
      // back to front
      expect(ring.map((g) => g.depth)).toEqual([...ring.map((g) => g.depth)].sort((a, b) => a - b));
    }
  });

  it("keeps every gate on screen at rest, wide or tall", () => {
    for (const [w, h] of [
      [360, 225],
      [130, 281],
    ])
      for (let sel = 0; sel < 4; sel++)
        for (const g of gates(w, h, state(sel, sel))) {
          expect(g.x).toBeGreaterThanOrEqual(0);
          expect(g.x + g.w).toBeLessThanOrEqual(w);
          expect(g.y).toBeGreaterThanOrEqual(0);
        }
  });

  it("brings the selected gate to the middle and grows it while diving", () => {
    const w = 360;
    const h = 225;
    const rest = gates(w, h, state(2, 2)).find((g) => g.i === 2);
    const deep = gates(w, h, state(2, 2, 1)).find((g) => g.i === 2);
    expect(rest && deep).toBeTruthy();
    if (!rest || !deep) return;
    expect(deep.w).toBeGreaterThan(rest.w * 4);
    expect(Math.abs(deep.x + deep.w / 2 - w / 2)).toBeLessThanOrEqual(deep.w / 12 + 1);
  });

  it("sits right of the text on wide screens and centred on tall ones", () => {
    expect(layout(360, 225).cx).toBeGreaterThan(360 / 2);
    expect(layout(130, 281).cx).toBe(130 / 2);
  });
});

describe("the worlds", () => {
  it("are four, in ring order, with their own keys, names and colours", () => {
    expect(LOOKS.map((l) => l.key)).toEqual(["exposure", "resonance", "altitude", "forge"]);
    expect(new Set(LOOKS.map((l) => l.name)).size).toBe(4);
    expect(new Set(LOOKS.map((l) => l.accent.join())).size).toBe(4);
    expect(LOOKS.map((l) => l.dimension)).toEqual([1, 2, 3, 4]);
    expect(lookOf("forge").name).toBe("Forge");
  });
});

describe("pixel helpers", () => {
  it("parse and mix colours", () => {
    expect(hex("#ff8000")).toEqual([255, 128, 0]);
    expect(mix([0, 0, 0], [200, 100, 50], 0.5)).toEqual([100, 50, 25]);
    expect(rgba([10.7, 20.2, 30.9], 0.5)).toBe("rgba(10,20,30,0.5)");
  });
  it("keep noise in 0..1 and deterministic", () => {
    for (let i = 0; i < 500; i++) {
      const x = i * 0.37 - 50;
      for (const v of [hash(x), noise1(x), noise2(x, i * 0.11), fbm1(x)]) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
      expect(noise1(x)).toBe(noise1(x));
    }
  });
  it("ease and clamp stay in range", () => {
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    expect(ease(0.5)).toBeCloseTo(0.5, 5);
    expect(clamp(2)).toBe(1);
    expect(clamp(-1)).toBe(0);
  });
});
