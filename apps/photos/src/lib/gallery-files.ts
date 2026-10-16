import "server-only";
import type * as gal from "@jerryqiu/db/galleries";
import { embedViewerCode, viewerCode } from "@jerryqiu/media";
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
