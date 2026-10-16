import { describe, expect, it } from "vitest";
import { meanFrameMs, parallaxOffset, selectMotionTier, type MotionSignals } from "../src/v3/tier";

const ok: MotionSignals = { reducedMotion: false, saveData: false, choice: "auto", touch: false };

describe("selectMotionTier", () => {
  it("is full on a capable device", () => expect(selectMotionTier(ok)).toBe("full"));
  it("hard stops cannot be overridden by the Full choice", () => {
    expect(selectMotionTier({ ...ok, reducedMotion: true, choice: "full" })).toBe("static");
    expect(selectMotionTier({ ...ok, saveData: true, choice: "full" })).toBe("static");
    expect(selectMotionTier({ ...ok, effectiveType: "3g", choice: "full" })).toBe("static");
  });
  it("Calm is static", () => expect(selectMotionTier({ ...ok, choice: "calm" })).toBe("static"));
  it("Full skips capability guesses", () =>
    expect(selectMotionTier({ ...ok, choice: "full", deviceMemory: 1, probeMs: 80 })).toBe("full"));
  it("low battery that is not charging is reduced", () => {
    expect(selectMotionTier({ ...ok, battery: { level: 0.1, charging: false } })).toBe("reduced");
    expect(selectMotionTier({ ...ok, battery: { level: 0.1, charging: true } })).toBe("full");
  });
  it("weak devices and a slow frame probe are reduced", () => {
    expect(selectMotionTier({ ...ok, deviceMemory: 2 })).toBe("reduced");
    expect(selectMotionTier({ ...ok, touch: true, hardwareConcurrency: 4 })).toBe("reduced");
    expect(selectMotionTier({ ...ok, hardwareConcurrency: 4 })).toBe("full");
    expect(selectMotionTier({ ...ok, probeMs: 30 })).toBe("reduced");
    expect(selectMotionTier({ ...ok, probeMs: 16 })).toBe("full");
  });
});

describe("meanFrameMs", () => {
  it("needs enough frames and ignores the first", () => {
    expect(meanFrameMs([16, 16])).toBeUndefined();
    expect(meanFrameMs([500, ...Array(20).fill(20)])).toBe(20);
  });
});

describe("parallaxOffset", () => {
  it("is zero mid-scroll and never exceeds 18vh", () => {
    expect(parallaxOffset(0.5, 0.2, 800)).toBe(0);
    expect(Math.abs(parallaxOffset(0, 0.25, 800))).toBeLessThanOrEqual(800 * 0.18);
    expect(parallaxOffset(1, 5, 800)).toBe(800 * 0.18);
    expect(parallaxOffset(0, -0.12, 800)).toBeGreaterThan(0);
  });
});
