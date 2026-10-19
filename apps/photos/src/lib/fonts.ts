import {
  Anybody,
  Bebas_Neue,
  Cabin,
  Caveat,
  Cormorant_Garamond,
  Dancing_Script,
  DM_Serif_Display,
  Figtree,
  Hanken_Grotesk,
  Inter,
  Jost,
  Lato,
  Lora,
  Martian_Mono,
  Merriweather,
  Montserrat,
  Newsreader,
  Oswald,
  Playfair_Display,
  Quicksand,
  Raleway,
  Roboto,
  Sora,
  Spectral,
  Urbanist,
} from "next/font/google";

// SIL Open Font License 1.1, self-hosted by next/font at build time (Q41: license files verified in R2, see
// THIRD_PARTY_LICENSES.md). Display: Anybody (variable width axis, driven by scroll velocity). Text: Hanken Grotesk.
// Voice and journal: Newsreader. Data: Martian Mono. A custom typeface can replace any role through the variables (Q44).
// `optional` for the two big-type faces: a late swap would re-measure the hero headline (LCP) and shift layout; with the
// preload they are used on nearly every view, and the metric-adjusted fallback covers the rest (Q50).
export const display = Anybody({ subsets: ["latin"], axes: ["wdth"], variable: "--font-display", display: "optional" });
export const sans = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
export const voice = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-voice",
  display: "optional",
});
export const mono = Martian_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });
// Gallery type options (a gallery chooses one in the studio). `preload: false`: only a gallery that uses one downloads it.
export const gxEditorial = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-gx-editorial",
  display: "swap",
  preload: false,
});
export const gxClassic = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-gx-classic",
  display: "swap",
  preload: false,
});
export const gxModern = Jost({ subsets: ["latin"], variable: "--font-gx-modern", display: "swap", preload: false });
export const gxDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-gx-display",
  display: "swap",
  preload: false,
});
export const fontVars = [display, sans, voice, mono, gxEditorial, gxClassic, gxModern, gxDisplay]
  .map((f) => f.variable)
  .join(" ");
