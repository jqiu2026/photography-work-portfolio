import { describe, expect, it } from "vitest";
import { Governor, downgrade, selectTier, type Signals } from "../src/stage/tier";

const ok: Signals = { reducedMotion: false, saveData: false, webgl2: true, choice: "auto", touch: false };

describe("selectTier (first match wins)", () => {
  it("is full on a capable device", () => expect(selectTier(ok)).toBe("full"));
  it("reduced motion forces static, even with a full choice", () =>
    expect(selectTier({ ...ok, reducedMotion: true, choice: "full" })).toBe("static"));
  it("Save-Data and slow connections are static", () => {
    expect(selectTier({ ...ok, saveData: true })).toBe("static");
    for (const t of ["slow-2g", "2g", "3g"]) expect(selectTier({ ...ok, effectiveType: t })).toBe("static");
    expect(selectTier({ ...ok, effectiveType: "4g" })).toBe("full");
  });
  it("no WebGL2 is static", () => expect(selectTier({ ...ok, webgl2: false })).toBe("static"));
  it("the Calm choice is static", () => expect(selectTier({ ...ok, choice: "calm" })).toBe("static"));
  it("low battery that is not charging is reduced; charging is not", () => {
    expect(selectTier({ ...ok, battery: { level: 0.1, charging: false } })).toBe("reduced");
    expect(selectTier({ ...ok, battery: { level: 0.1, charging: true } })).toBe("full");
  });
  it("weak devices are reduced", () => {
    expect(selectTier({ ...ok, deviceMemory: 2 })).toBe("reduced");
    expect(selectTier({ ...ok, touch: true, hardwareConcurrency: 4 })).toBe("reduced");
    expect(selectTier({ ...ok, touch: false, hardwareConcurrency: 4 })).toBe("full");
  });
  it("the probe can only lower the tier", () => {
    expect(selectTier({ ...ok, probeP75: 16 })).toBe("full");
    expect(selectTier({ ...ok, probeP75: 30 })).toBe("reduced");
    expect(selectTier({ ...ok, probeP75: 55 })).toBe("static");
  });
});

describe("governor", () => {
  it("drops one step after sustained slow frames, never on a brief hitch", () => {
    const g = new Governor(28, 10, 500);
    for (let i = 0; i < 10; i++) expect(g.push(16)).toBe(false);
    expect(g.push(200)).toBe(false);
    for (let i = 0; i < 9; i++) g.push(16);
    const g2 = new Governor(28, 10, 500);
    let dropped = false;
    for (let i = 0; i < 40; i++) dropped = g2.push(40) || dropped;
    expect(dropped).toBe(true);
  });
  it("downgrade steps full to reduced to static", () => {
    expect(downgrade("full")).toBe("reduced");
    expect(downgrade("reduced")).toBe("static");
    expect(downgrade("static")).toBe("static");
  });
});
