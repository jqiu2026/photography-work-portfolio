import { Hanken_Grotesk, Martian_Mono, Newsreader, Silkscreen } from "next/font/google";

// SIL Open Font License 1.1, self-hosted by next/font at build time (licence texts: THIRD_PARTY_LICENSES.md).
// Text: Hanken Grotesk. Voice (names, ledes): Newsreader. Data (dates): Martian Mono. Pixel (the Nexus): Silkscreen. The admin keeps its own set in fonts.ts.
export const sans = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
export const voice = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-voice",
  display: "swap",
});
export const mono = Martian_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });
export const pixel = Silkscreen({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
});
export const siteFontVars = [sans, voice, mono, pixel].map((f) => f.variable).join(" ");
