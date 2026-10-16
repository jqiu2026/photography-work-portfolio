import { staticAsset } from "@/lib/static-images";

/** Portfolio photographs shipped with the app (id is a stable UUID; there is no file URL, see static-images.ts). */
export function getImage(key: string) {
  return staticAsset("gallery", key);
}

/** Project case-study images shipped with the app. */
export function getProjectImage(key: string) {
  return staticAsset("projects", key);
}
