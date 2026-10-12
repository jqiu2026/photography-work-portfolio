// Placeholder image sequence from stills (no ffmpeg needed): slow zoom + crossfade.
// usage: node scripts/make-sequence.mjs <outDir> <frames=96> <width=1280> <height=720> <quality=62> <img1> <img2> ...
// For real footage use ffmpeg instead (see apps/web/public/sequence/README.md).
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const [outDir, framesArg, wArg, hArg, qArg, ...imgs] = process.argv.slice(2);
const N = +framesArg || 96, W = +wArg || 1280, H = +hArg || 720, Q = +qArg || 62;
if (!outDir || imgs.length < 2) throw new Error("usage: make-sequence.mjs <outDir> <frames> <w> <h> <quality> <img...>");
await mkdir(outDir, { recursive: true });

const ZOOM = 0.14; // total zoom over each still's life
const per = N / imgs.length;
const fade = Math.max(4, Math.round(per * 0.3));
const bases = await Promise.all(imgs.map((f) => sharp(f).rotate().resize(Math.round(W * 1.3), Math.round(H * 1.3), { fit: "cover" }).raw().toBuffer({ resolveWithObject: true })));

const crop = async (b, z) => {
  const { data, info } = b;
  const cw = Math.round(info.width / z), ch = Math.round(info.height / z);
  return sharp(data, { raw: info }).extract({ left: Math.round((info.width - cw) / 2), top: Math.round((info.height - ch) / 2), width: cw, height: ch }).resize(W, H).raw().toBuffer();
};

let bytes = 0;
for (let f = 0; f < N; f++) {
  const idx = Math.min(imgs.length - 1, Math.floor(f / per));
  const t = (f - idx * per) / per; // 0..1 within the still
  const a = await crop(bases[idx], 1 + ZOOM * t);
  let frame = a;
  const next = idx + 1;
  if (next < imgs.length && f - idx * per > per - fade) {
    const k = (f - (idx * per + per - fade)) / fade; // 0..1 crossfade
    const b = await crop(bases[next], 1 + ZOOM * 0);
    frame = Buffer.alloc(a.length);
    for (let i = 0; i < a.length; i++) frame[i] = a[i] * (1 - k) + b[i] * k;
  }
  const name = `frame-${String(f).padStart(3, "0")}.webp`;
  const buf = await sharp(frame, { raw: { width: W, height: H, channels: 3 } }).webp({ quality: Q, effort: 4 }).toBuffer();
  bytes += buf.length;
  await writeFile(path.join(outDir, name), buf);
}
await writeFile(path.join(outDir, "manifest.json"), JSON.stringify({ count: N, width: W, height: H, pattern: "frame-%03d.webp" }, null, 1));
console.log(`${N} frames, ${(bytes / 1e6).toFixed(2)} MB total`);
