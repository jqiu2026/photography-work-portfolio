import "server-only";
import { DEFAULT_PREVIEW_TEXT, ruleTargetSize } from "@jerryqiu/db/download-presets";
import { previewLayer } from "@/lib/preview-mark";
import type * as gal from "@jerryqiu/db/galleries";
import type * as schema from "@jerryqiu/db/schema";
import { embedViewerCode, viewerCode } from "@jerryqiu/media";
import sharp, { type OverlayOptions } from "sharp";
import { derivativesStore, originalsStore } from "@/lib/storage";

type Contents = Awaited<ReturnType<typeof gal.galleryContents>>;

/** A web-size JPEG of one photograph with the invisible per-viewer watermark (null when the photograph is missing). */
export async function webFile(contents: Contents, mediaId: string, viewer: string) {
  const c = contents.find((x) => x.media.id === mediaId);
  if (!c) return null;
  const d =
    [...c.media.derivatives].filter((x) => x.format === "webp").sort((x, y) => y.width - x.width)[0] ??
    [...c.media.derivatives].sort((x, y) => y.width - x.width)[0];
  const obj = d ? await derivativesStore().get(d.key) : null;
  if (!obj) return null;
  const base = c.media.filename.replace(/\.[^.]+$/, "");
  return { name: `${base}-web.jpg`, bytes: await embedViewerCode(obj.body, viewerCode(viewer), "jpeg") };
}

/** The original file of one photograph. */
export async function fullFile(contents: Contents, mediaId: string) {
  const c = contents.find((x) => x.media.id === mediaId);
  const obj = c ? await originalsStore().get(c.media.originalKey) : null;
  return c && obj ? { name: c.media.filename, bytes: Buffer.from(obj.body), type: c.media.mime } : null;
}

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** A visible mark laid over a picture: the watermark's words or its PNG, placed and sized as the studio set it. */
async function watermarkLayer(w: schema.StudioWatermark, width: number, height: number): Promise<OverlayOptions[]> {
  const markW = Math.max(40, Math.round((width * w.sizePct) / 100));
  let mark: Buffer;
  if (w.kind === "image" && w.imageKey) {
    const obj = await originalsStore().get(w.imageKey);
    if (!obj) return [];
    mark = await sharp(Buffer.from(obj.body)).resize({ width: markW }).ensureAlpha().toBuffer();
  } else {
    const text = esc(w.text ?? "");
    const fontSize = Math.max(14, Math.round(markW / Math.max(4, text.length * 0.62)));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${markW}" height="${Math.round(fontSize * 1.6)}"><text x="50%" y="70%" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="${fontSize}" font-weight="700" fill="#fff" stroke="#000" stroke-opacity="0.35" stroke-width="${Math.max(1, fontSize / 18)}">${text}</text></svg>`;
    mark = Buffer.from(svg);
  }
  const alpha = w.opacity / 100;
  const faded = await sharp(mark).ensureAlpha().linear([1, 1, 1, alpha], [0, 0, 0, 0]).png().toBuffer();
  const meta = await sharp(faded).metadata();
  const mw = meta.width ?? markW;
  const mh = meta.height ?? 40;
  const pad = Math.round(width * 0.025);
  if (w.position === "tile") {
    const out: OverlayOptions[] = [];
    for (let y = Math.round(mh); y < height; y += mh * 4)
      for (let x = Math.round(mw / 3); x < width; x += mw * 1.8)
        out.push({ input: faded, left: Math.round(x), top: Math.round(y) });
    return out.slice(0, 120);
  }
  const left = w.position.includes("left")
    ? pad
    : w.position.includes("right")
      ? Math.max(0, width - mw - pad)
      : Math.max(0, Math.round((width - mw) / 2));
  const top = w.position.startsWith("top")
    ? pad
    : w.position.startsWith("bottom")
      ? Math.max(0, height - mh - pad)
      : Math.max(0, Math.round((height - mh) / 2));
  return [{ input: faded, left, top }];
}

/**
 * One photograph delivered under a download rule: the original resized so its longest side is at most the rule's pixels (never
 * enlarged), the studio's visible watermark if the rule has one, and the invisible per-viewer mark.
 */
export async function ruleFile(
  contents: Contents,
  mediaId: string,
  rule: Pick<schema.StudioDownloadRule, "maxPx" | "preset" | "previewText">,
  watermark: schema.StudioWatermark | null,
  viewer: string,
) {
  const c = contents.find((x) => x.media.id === mediaId);
  const obj = c ? await originalsStore().get(c.media.originalKey) : null;
  if (!c || !obj) return null;
  let img = sharp(Buffer.from(obj.body), { failOn: "none" }).rotate();
  const meta0 = await sharp(await img.clone().toBuffer()).metadata();
  const target = ruleTargetSize(rule, meta0.width ?? 1, meta0.height ?? 1);
  if (target) img = img.resize({ width: target.width, height: target.height, fit: "fill" });
  const flat = await img.jpeg({ quality: 90 }).toBuffer();
  let out = flat;
  const layers: OverlayOptions[] = [];
  const meta = await sharp(flat).metadata();
  if (rule.preset === "preview")
    layers.push(await previewLayer(rule.previewText || DEFAULT_PREVIEW_TEXT, meta.width ?? 1000, meta.height ?? 700));
  if (watermark) layers.push(...(await watermarkLayer(watermark, meta.width ?? 1000, meta.height ?? 700)));
  if (layers.length) out = await sharp(flat).composite(layers).jpeg({ quality: 90 }).toBuffer();
  const base = c.media.filename.replace(/\.[^.]+$/, "");
  const tag =
    rule.preset === "custom" ? (rule.maxPx ? `${rule.maxPx}px` : "original") : (sizeTag[rule.preset] ?? "original");
  return { name: `${base}-${tag}.jpg`, bytes: await embedViewerCode(new Uint8Array(out), viewerCode(viewer), "jpeg") };
}

/** File-name tags for the presets ("photo-high-res.jpg"). */
export const sizeTag: Record<string, string> = {
  original: "original",
  high: "high-res",
  low: "low-res",
  social: "social-1920",
  preview: "preview",
};
