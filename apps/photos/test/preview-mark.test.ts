import { ruleSizeLabel, ruleTargetSize } from "@jerryqiu/db/download-presets";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { previewLayer } from "@/lib/preview-mark";

describe("download sizes", () => {
  const big = { w: 6000, h: 4000 };
  it("high is 80% and low is 50% of full size, both ways", () => {
    expect(ruleTargetSize({ preset: "high", maxPx: null }, big.w, big.h)).toEqual({ width: 4800, height: 3200 });
    expect(ruleTargetSize({ preset: "low", maxPx: null }, big.w, big.h)).toEqual({ width: 3000, height: 2000 });
    expect(ruleTargetSize({ preset: "high", maxPx: null }, 4000, 6000)).toEqual({ width: 3200, height: 4800 });
  });
  it("social fits inside 1920 on the longest side and is never enlarged", () => {
    expect(ruleTargetSize({ preset: "social", maxPx: null }, big.w, big.h)).toEqual({ width: 1920, height: 1280 });
    expect(ruleTargetSize({ preset: "social", maxPx: null }, 4000, 6000)).toEqual({ width: 1280, height: 1920 });
    expect(ruleTargetSize({ preset: "social", maxPx: null }, 1500, 1000)).toBeNull();
  });
  it("original and an empty custom size leave the file alone; custom fits", () => {
    expect(ruleTargetSize({ preset: "original", maxPx: null }, big.w, big.h)).toBeNull();
    expect(ruleTargetSize({ preset: "custom", maxPx: null }, big.w, big.h)).toBeNull();
    expect(ruleTargetSize({ preset: "custom", maxPx: 720 }, big.w, big.h)).toEqual({ width: 720, height: 480 });
  });
  it("preview is small", () => {
    expect(ruleTargetSize({ preset: "preview", maxPx: null }, big.w, big.h)).toEqual({ width: 1600, height: 1067 });
  });
  it("labels", () => {
    expect(ruleSizeLabel({ preset: "high", maxPx: null })).toBe("High resolution");
    expect(ruleSizeLabel({ preset: "custom", maxPx: 720 })).toBe("720 px");
    expect(ruleSizeLabel({ preset: "custom", maxPx: null })).toBe("Original");
  });
});

describe("the preview mark", () => {
  it("draws big words across the middle of a photograph and leaves the corners alone", async () => {
    const w = 800;
    const h = 600;
    const plain = await sharp({ create: { width: w, height: h, channels: 3, background: "#808080" } })
      .png()
      .toBuffer();
    const marked = await sharp(plain)
      .composite([await previewLayer("Proof only", w, h)])
      .png()
      .toBuffer();
    const px = async (buf: Buffer) => (await sharp(buf).raw().toBuffer({ resolveWithObject: true })).data;
    const a = await px(plain);
    const b = await px(marked);
    const at = (d: Buffer, x: number, y: number) => d[(y * w + x) * 3] as number;
    expect(at(b, 4, 4)).toBe(at(a, 4, 4));
    expect(at(b, w - 5, h - 5)).toBe(at(a, w - 5, h - 5));
    let changed = 0;
    for (let y = 200; y < 400; y++) for (let x = 100; x < 700; x++) if (at(b, x, y) !== at(a, x, y)) changed++;
    expect(changed).toBeGreaterThan(3000);
  });
  it("escapes the words", async () => {
    await expect(
      sharp({ create: { width: 200, height: 100, channels: 3, background: "#000" } })
        .png()
        .toBuffer()
        .then(async (b) =>
          sharp(b)
            .composite([await previewLayer("<b>&</b>", 200, 100)])
            .png()
            .toBuffer(),
        ),
    ).resolves.toBeTruthy();
  });
});
