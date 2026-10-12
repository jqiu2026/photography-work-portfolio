import { Anybody, Hanken_Grotesk, Martian_Mono, Newsreader } from "next/font/google";

// SIL Open Font License 1.1, self-hosted by next/font at build time (Q41: licence files verified in R2, see
// THIRD_PARTY_LICENSES.md). Display: Anybody (variable width axis, driven by scroll velocity). Text: Hanken Grotesk.
// Voice and journal: Newsreader. Data: Martian Mono. A custom typeface can replace any role through the variables (Q44).
export const display = Anybody({ subsets: ["latin"], axes: ["wdth"], variable: "--font-display", display: "swap" });
export const sans = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
export const voice = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-voice",
  display: "swap",
});
export const mono = Martian_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });
export const fontVars = [display, sans, voice, mono].map((f) => f.variable).join(" ");
