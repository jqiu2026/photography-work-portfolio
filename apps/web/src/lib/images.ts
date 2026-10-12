import fs from "node:fs";
import path from "node:path";
import type { ImageAsset } from "@placeholder/ui/media";

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

export function getImage(group: "gallery" | "projects" | "blogs" | "site", id: string): ImageAsset {
  const a = manifest(group)[id];
  if (!a) throw new Error(`Image not found: ${group}/${id}`);
  return a;
}

export function allImages(group: "gallery" | "projects" | "blogs" | "site") {
  return Object.entries(manifest(group)).map(([id, a]) => ({ id, ...a }));
}
