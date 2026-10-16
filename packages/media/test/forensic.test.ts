import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { codeHex, detectViewerCode, embedViewerCode, viewerCode } from "../src/forensic";

async function photoLike(w = 960, h = 640) {
  const raw = Buffer.alloc(w * h * 3);
  let s = 12345;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      s = (Math.imul(s, 1103515245) + 12345) >>> 0;
      const n = ((s >>> 16) & 15) - 8; // sensor-like noise
      const base = 90 + 80 * Math.sin(x / 90) * Math.cos(y / 70);
      for (let c = 0; c < 3; c++) raw[(y * w + x) * 3 + c] = Math.max(0, Math.min(255, base + n + c * 12));
    }
  return sharp(raw, { raw: { width: w, height: h, channels: 3 } })
    .webp({ quality: 85 })
    .toBuffer();
}

describe("forensic viewer watermark", () => {
  it("derives a stable code per viewer", () => {
    expect(viewerCode("a")).toBe(viewerCode("a"));
    expect(viewerCode("a")).not.toBe(viewerCode("b"));
    expect(codeHex(255)).toBe("000000ff");
  });

  it("is recovered after being served as WebP and re-encoded once more", async () => {
    const code = viewerCode("viewer-123");
    const marked = await embedViewerCode(await photoLike(), code, "webp");
    const leaked = await sharp(marked).webp({ quality: 80 }).toBuffer();
    const found = await detectViewerCode(leaked);
    expect(found.code).toBe(code);
    expect(found.confidence).toBeGreaterThan(0.3);
  });

  it("survives being delivered as a JPEG (web-size downloads) and a second JPEG save", async () => {
    const code = viewerCode("download-viewer");
    const jpeg = await embedViewerCode(await photoLike(), code, "jpeg");
    expect((await detectViewerCode(jpeg)).code).toBe(code);
    const resaved = await sharp(jpeg).jpeg({ quality: 85 }).toBuffer();
    expect((await detectViewerCode(resaved)).code).toBe(code);
  });

  it("does not claim a code on an unmarked image", async () => {
    const found = await detectViewerCode(await photoLike());
    expect(found.confidence).toBeLessThan(0.3);
  });

  it("changes the pixels only slightly", async () => {
    const plain = await photoLike(480, 320);
    const marked = await embedViewerCode(plain, 0xdeadbeef, "webp");
    const a = await sharp(plain).raw().toBuffer();
    const b = await sharp(marked).raw().toBuffer();
    let max = 0;
    for (let i = 0; i < a.length; i++) max = Math.max(max, Math.abs(a[i] - b[i]));
    expect(max).toBeLessThan(24);
  });
});
