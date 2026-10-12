import { crc32 } from "node:zlib";
import exifr from "exifr";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  ImageError,
  MAX_PIXELS,
  dHash,
  hamming,
  processImage,
  safeName,
  validateImage,
} from "../src/lib/media/process";

const jpeg = (w: number, h: number, color = "#3366cc") =>
  sharp({ create: { width: w, height: h, channels: 3, background: color } })
    .jpeg()
    .toBuffer();
const gradient = async (w = 400, h = 300, flip = false) => {
  const px = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const v = Math.round(((flip ? w - x : x) / w) * 255);
      px.set([v, (y / h) * 255, 255 - v], (y * w + x) * 3);
    }
  return sharp(px, { raw: { width: w, height: h, channels: 3 } })
    .jpeg()
    .toBuffer();
};

/** Raw EXIF block of an encoded image (sharp prefixes it with "Exif\0\0"). */
const exifOf = async (buf: Buffer) => (await sharp(buf).metadata()).exif?.subarray(6);

describe("validateImage", () => {
  it("accepts a normal JPEG and reports its size", async () => {
    expect(await validateImage(await jpeg(800, 600))).toEqual({ format: "jpeg", width: 800, height: 600 });
  });
  it("refuses SVG (it can carry script), PDF, HTML and garbage, whatever the extension claims", async () => {
    for (const bad of [
      Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),
      Buffer.from("%PDF-1.7\n%âãÏÓ"),
      Buffer.from("<html><script>alert(1)</script></html>"),
      Buffer.from("not an image at all"),
      Buffer.alloc(0),
    ])
      await expect(validateImage(bad)).rejects.toBeInstanceOf(ImageError);
  });
  it("refuses images that are too small", async () => {
    await expect(validateImage(await jpeg(8, 8))).rejects.toThrow(/too small/);
  });
  it("refuses a decompression bomb from its header alone, without decoding it", async () => {
    // A PNG header that claims a 20000 x 20000 canvas (400 megapixels) and carries no pixel data at all.
    const chunk = (type: string, data: Buffer) => {
      const len = Buffer.alloc(4);
      len.writeUInt32BE(data.length);
      const body = Buffer.concat([Buffer.from(type), data]);
      const crc = Buffer.alloc(4);
      crc.writeUInt32BE(crc32(body));
      return Buffer.concat([len, body, crc]);
    };
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(20_000, 0);
    ihdr.writeUInt32BE(20_000, 4);
    ihdr.set([8, 2, 0, 0, 0], 8);
    const bomb = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk("IHDR", ihdr),
      chunk("IEND", Buffer.alloc(0)),
    ]);
    expect(20_000 * 20_000).toBeGreaterThan(MAX_PIXELS);
    await expect(validateImage(bomb)).rejects.toBeInstanceOf(ImageError);
  });
  it("applies EXIF orientation when reporting dimensions", async () => {
    const rotated = await sharp({ create: { width: 600, height: 400, channels: 3, background: "#fff" } })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();
    expect(await validateImage(rotated)).toMatchObject({ width: 400, height: 600 });
  });
});

describe("processImage", () => {
  it("makes AVIF and WebP derivatives, never upscales, and returns blur, colour and hash", async () => {
    const p = await processImage(await jpeg(1200, 800));
    expect(p.width).toBe(1200);
    const widths = [...new Set(p.derivatives.map((d) => d.width))].sort((a, b) => a - b);
    expect(widths).toEqual([480, 960]);
    expect(widths.every((w) => w <= 1200)).toBe(true);
    expect(p.derivatives.map((d) => d.format).sort()).toEqual(["avif", "avif", "webp", "webp"]);
    expect(p.blur).toMatch(/^data:image\/webp;base64,/);
    expect(p.color).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
    expect(p.phash).toMatch(/^[0-9a-f]{16}$/);
  }, 60_000);
  it("a small image still gets a derivative at its own width", async () => {
    const p = await processImage(await jpeg(300, 200));
    expect(p.derivatives.length).toBeGreaterThan(0);
    expect(Math.max(...p.derivatives.map((d) => d.width))).toBeLessThanOrEqual(300);
  }, 60_000);
  it("strips GPS and personal EXIF from derivatives but keeps attribution", async () => {
    const withGps = await sharp({ create: { width: 900, height: 600, channels: 3, background: "#789" } })
      .jpeg()
      .withExif({
        IFD0: { Make: "TestCam", Artist: "Someone Else", Software: "private-tool" },
        IFD3: {
          GPSLatitudeRef: "N",
          GPSLatitude: "40/1 44/1 55/1",
          GPSLongitudeRef: "W",
          GPSLongitude: "73/1 59/1 11/1",
        },
      })
      .toBuffer();
    expect((await exifr.gps(withGps))?.latitude).toBeGreaterThan(40);
    const p = await processImage(withGps, { owner: "Jerry Qiu" });
    expect(p.exif).not.toHaveProperty("latitude");
    const webps = p.derivatives.filter((x) => x.format === "webp");
    expect(webps.length).toBeGreaterThan(0);
    for (const d of webps) {
      const raw = await exifOf(d.buffer);
      expect(raw).toBeDefined();
      expect(await exifr.gps(raw as Buffer).catch(() => undefined)).toBeUndefined();
      const t = (await exifr.parse(raw as Buffer, { pick: ["Artist", "Copyright", "Make", "Software"] })) ?? {};
      expect(t.Artist).toBe("Jerry Qiu");
      expect(t.Copyright).toContain("Jerry Qiu");
      expect(t.Make).toBeUndefined();
      expect(t.Software).toBeUndefined();
    }
  }, 60_000);
});

describe("perceptual hash", () => {
  it("is stable for the same picture, close for a resized copy, far for a different picture", async () => {
    const a = await gradient();
    const resized = await sharp(a).resize(200).jpeg({ quality: 60 }).toBuffer();
    const other = await gradient(400, 300, true);
    expect(hamming(await dHash(a), await dHash(a))).toBe(0);
    expect(hamming(await dHash(a), await dHash(resized))).toBeLessThanOrEqual(4);
    expect(hamming(await dHash(a), await dHash(other))).toBeGreaterThan(12);
  });
});

describe("safeName", () => {
  it("never keeps path separators or odd characters", () => {
    expect(safeName("../../etc/passwd")).not.toContain("/");
    expect(safeName("My Photo (1) é.JPG")).toMatch(/^[\w.\-]+$/);
    expect(safeName("")).toBe("image");
  });
});
