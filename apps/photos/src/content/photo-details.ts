import type { PhotoSpecs } from "@jerryqiu/db/specs";

/**
 * Captions and camera facts for the photographs that ship with the app, by file key (the keys in
 * `src/content/portfolio.ts`). Camera facts are normally read from the original file's metadata by
 * `scripts/optimize-images.mjs`; the shipped originals carry none, so anything written here fills the gap. Every
 * photograph still shows its pixel size and shape without this.
 * TODO(owner): add a caption and the real camera, lens and exposure for each photograph, for example:
 *   "jry0473": { caption: "Opening night, second act.", specs: { camera: "Canon EOS R6", lens: "RF 70-200mm f/2.8", focal: 135, aperture: 2.8, shutter: 1 / 320, iso: 3200, taken: "2026-02-14" } },
 */
export const photoDetails: Record<string, { caption?: string; specs?: PhotoSpecs }> = {};
