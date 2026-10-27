import fs from "node:fs";
import path from "node:path";

export type ImageAsset = {
  width: number;
  height: number;
  color: string;
  blur: string;
  files: { width: number; src: string }[];
};
type Manifest = Record<string, ImageAsset>;
const cache = new Map<string, Manifest>();

/** Reads public/opt/<group>/manifest.json written by scripts/optimize-images.mjs. */
function manifest(group: string): Manifest {
  let m = cache.get(group);
  if (!m) {
    m = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "public", "opt", group, "manifest.json"), "utf8"),
    ) as Manifest;
    cache.set(group, m);
  }
  return m;
}

export function getImage(group: "gallery", id: string): ImageAsset {
  const a = manifest(group)[id];
  if (!a) throw new Error(`Image not found: ${group}/${id}`);
  return a;
}

export const srcSet = (a: ImageAsset) => a.files.map((f) => `${f.src} ${f.width}w`).join(", ");
