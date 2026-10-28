import { describe, expect, it } from "vitest";
import {
  approach,
  bloom,
  diveDoor,
  FLOOD_FROM,
  lookOf,
  nearness,
  toGl,
  tour,
  WORLDS,
} from "@/components/home/portals/worlds";
import { FRAG } from "@/components/home/portals/shader";

describe("the portals", () => {
  it("has four worlds, one per site, each with its light", () => {
    expect(WORLDS.map((w) => w.key)).toEqual(["exposure", "resonance", "altitude", "forge"]);
    for (const w of WORLDS) {
      expect(w.accent.every((c) => c >= 0 && c <= 1)).toBe(true);
      expect(lookOf(w.key)).toBe(w);
    }
  });

  it("hands the shader each door as centre and half sizes in canvas pixels, y up", () => {
    expect(toGl({ x: 100, y: 200, w: 80, h: 160 }, 900, 2)).toEqual([280, 1240, 80, 160]);
  });

  it("grows the chosen door from where it stands until it covers the screen", () => {
    const d = { x: 1100, y: 500, w: 150, h: 260 };
    expect(diveDoor(d, 1440, 900, 0)).toEqual(d);
    const end = diveDoor(d, 1440, 900, 1);
    expect(end.x + end.w / 2).toBeCloseTo(720);
    expect(end.y + end.h / 2).toBeCloseTo(450);
    expect(end.x).toBeLessThan(0);
    expect(end.x + end.w).toBeGreaterThan(1440);
    expect(end.y).toBeLessThan(0);
    expect(end.y + end.h).toBeGreaterThan(900);
    // never shrinks on the way
    let w = d.w;
    for (let t = 0; t <= 1; t += 0.05) {
      const step = diveDoor(d, 1440, 900, t);
      expect(step.w).toBeGreaterThanOrEqual(w - 1e-9);
      w = step.w;
    }
  });

  it("eases the same way at any frame rate", () => {
    let fast = 0;
    for (let i = 0; i < 12; i++) fast = approach(fast, 1, 5, 1 / 120);
    let slow = 0;
    for (let i = 0; i < 2; i++) slow = approach(slow, 1, 5, 1 / 20);
    expect(fast).toBeCloseTo(slow, 6);
  });

  it("opens the portals one after another, from closed to fully open", () => {
    expect(bloom(0, 0)).toBe(0);
    expect(bloom(1, 0)).toBeGreaterThan(bloom(1, 3));
    expect(bloom(1, 3)).toBe(0);
    for (let i = 0; i < 4; i++) expect(bloom(10, i)).toBe(1);
  });

  it("stirs a portal as the pointer nears it", () => {
    const r = { left: 100, top: 100, width: 100, height: 200 };
    expect(nearness([150, 200], r)).toBe(1);
    expect(nearness([300, 200], r)).toBeCloseTo(Math.exp(-1), 6);
    expect(nearness([-1e4, -1e4], r)).toBeCloseTo(0, 6);
  });

  it("drifts through the worlds one at a time, each overlapping only the next", () => {
    for (let t = 0; t < 56; t += 0.25) {
      const w = [0, 1, 2, 3].map((i) => tour(t, i));
      for (const x of w) expect(x).toBeGreaterThanOrEqual(0);
      for (const x of w) expect(x).toBeLessThanOrEqual(1);
      expect(w.filter((x) => x > 1e-9).length).toBeLessThanOrEqual(2);
    }
    expect(tour(3.5 + 28, 0)).toBeCloseTo(tour(3.5, 0), 9);
    for (const w of WORLDS) expect(FLOOD_FROM[w.key]).toHaveLength(2);
  });

  it("declares every uniform the component sets", () => {
    for (const u of [
      "uRes",
      "uTime",
      "uPointer",
      "uDoor[4]",
      "uHover[4]",
      "uAccent[4]",
      "uFloor",
      "uDive",
      "uDiveIdx",
      "uOpen[4]",
      "uCursor",
      "uFlood[4]",
      "uOrigin[4]",
      "uFloorA",
    ])
      expect(FRAG).toMatch(new RegExp(`uniform \\w+ ${u.replace(/[[\]]/g, "\\$&")};`));
  });
});
