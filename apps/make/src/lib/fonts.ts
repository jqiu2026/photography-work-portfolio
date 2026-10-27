import { Hanken_Grotesk, Martian_Mono, Newsreader } from "next/font/google";

// SIL Open Font License 1.1, self-hosted by next/font at build time (licence texts: THIRD_PARTY_LICENSES.md).
// Text: Hanken Grotesk. Voice (titles of pieces, program notes): Newsreader. Data (durations, license numbers): Martian Mono.
export const sans = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
export const voice = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-voice",
  display: "swap",
});
export const mono = Martian_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });
export const fontVars = [sans, voice, mono].map((f) => f.variable).join(" ");
