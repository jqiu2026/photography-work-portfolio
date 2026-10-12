import fs from "node:fs";
import path from "node:path";
import type { GalleryImage } from "@halation/ui/media";

type Manifest = Record<string, Omit<GalleryImage, "alt">>;
let cache: Manifest | undefined;

function manifest(): Manifest {
  cache ??= JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "public", "opt", "gallery", "manifest.json"), "utf8"),
  ) as Manifest;
  return cache;
}

export function getImage(id: string) {
  const a = manifest()[id];
  if (!a) throw new Error(`Image not found: ${id}`);
  return a;
}

let projects: Manifest | undefined;
/** Project case-study images: public/opt/projects/manifest.json (made by scripts/optimize-images.mjs). */
export function getProjectImage(id: string) {
  projects ??= JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "public", "opt", "projects", "manifest.json"), "utf8"),
  ) as Manifest;
  const a = projects[id];
  if (!a) throw new Error(`Image not found: projects/${id}`);
  return a;
}
