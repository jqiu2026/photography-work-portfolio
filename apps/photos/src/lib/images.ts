import fs from "node:fs";
import path from "node:path";
import type { GalleryImage } from "@placeholder/ui/media";

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
