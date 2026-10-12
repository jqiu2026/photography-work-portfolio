/** JS mirror of the motion tokens in styles/tokens.css. One source of truth for JS animations. */
export const motion = {
  ease: [0.16, 1, 0.3, 1] as const,
  easeInOut: [0.65, 0, 0.35, 1] as const,
  spring: { type: "spring", stiffness: 140, damping: 22, mass: 0.9 } as const,
  duration: { fast: 0.16, base: 0.28, slow: 0.64 },
  distance: 24,
  stagger: 0.06,
} as const;

export const presets = ["hub", "photos", "music", "flying"] as const;
export type Preset = (typeof presets)[number];
export type Theme = "light" | "dark";
