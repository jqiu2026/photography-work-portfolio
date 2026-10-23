// Pure (no Node or database imports) so client components can use it too.
/**
 * The sizes a free download can offer, in the words visitors and the owner see. `high` is 80% of the photograph's
 * width and height, `low` 50%, `social` fits inside 1920 px on its longest side, `preview` is small with a big centered
 * "preview only" mark so it cannot stand in for the real photograph, `original` is the file as delivered, and `custom`
 * is a longest side the owner types.
 */
export const DOWNLOAD_PRESETS = [
  { id: "original", label: "Full size (original)", short: "Original" },
  { id: "high", label: "High resolution (80% of full size)", short: "High resolution" },
  { id: "low", label: "Low resolution (50% of full size)", short: "Low resolution" },
  { id: "social", label: "Social media (longest side 1920 px)", short: "Social media" },
  { id: "preview", label: "Preview (watermarked, preview only)", short: "Preview" },
  { id: "custom", label: "Custom size (pixels)", short: "Custom size" },
] as const;
export type DownloadPreset = (typeof DOWNLOAD_PRESETS)[number]["id"];
export const SOCIAL_MAX_PX = 1920;
export const PREVIEW_MAX_PX = 1600;
export const DEFAULT_PREVIEW_TEXT = "PREVIEW ONLY";

/** What a rule hands out, as a short phrase ("High resolution", "1600 px", "Original"). */
export function ruleSizeLabel(r: { preset: string; maxPx: number | null }): string {
  if (r.preset === "custom") return r.maxPx ? `${r.maxPx} px` : "Original";
  return DOWNLOAD_PRESETS.find((p) => p.id === r.preset)?.short ?? "Original";
}

/** The pixel size a rule makes from a photograph of this size, or null for the untouched original. */
export function ruleTargetSize(
  r: { preset: string; maxPx: number | null },
  width: number,
  height: number,
): { width: number; height: number } | null {
  const scale = (k: number) => ({
    width: Math.max(1, Math.round(width * k)),
    height: Math.max(1, Math.round(height * k)),
  });
  const fit = (px: number) => {
    const k = Math.min(1, px / Math.max(width, height));
    return k >= 1 ? null : scale(k);
  };
  switch (r.preset) {
    case "high":
      return scale(0.8);
    case "low":
      return scale(0.5);
    case "social":
      return fit(SOCIAL_MAX_PX);
    case "preview":
      return fit(PREVIEW_MAX_PX);
    case "original":
      return null;
    default:
      return r.maxPx ? fit(r.maxPx) : null;
  }
}
