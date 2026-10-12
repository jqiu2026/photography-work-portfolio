import { describe, expect, it } from "vitest";
import { createStore, parseColor, updateScroll } from "../src/stage/store";

describe("stage store", () => {
  it("parses hex and rgb colours and falls back otherwise", () => {
    expect(parseColor("#ff0000", [0, 0, 0])).toEqual([1, 0, 0]);
    expect(parseColor("rgb(0, 255, 0)", [0, 0, 0])).toEqual([0, 1, 0]);
    expect(parseColor("hotpink", [1, 1, 1])).toEqual([1, 1, 1]);
  });
  it("tracks scroll progress and a smoothed signed velocity", () => {
    const s = createStore();
    updateScroll(s, 0, 500, 1000, 3000, 0.016);
    expect(s.progress).toBeCloseTo(0.25);
    expect(s.velocity).toBeGreaterThan(0);
    for (let i = 0; i < 120; i++) updateScroll(s, 500, 500, 1000, 3000, 0.016);
    expect(Math.abs(s.velocity)).toBeLessThan(0.01);
    updateScroll(s, 500, 100, 1000, 3000, 0.016);
    expect(s.velocity).toBeLessThan(0);
  });
  it("clamps progress on short pages", () => {
    const s = createStore();
    updateScroll(s, 0, 50, 1000, 900, 0.016);
    expect(s.progress).toBe(1);
  });
});
