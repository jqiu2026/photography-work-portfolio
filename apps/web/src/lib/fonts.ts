import { Geist, Geist_Mono, Instrument_Serif, Inter_Tight, Newsreader } from "next/font/google";

// All SIL Open Font License, self-hosted by next/font at build time.
export const instrument = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  display: "swap",
});
export const interTight = Inter_Tight({ subsets: ["latin"], variable: "--font-inter-tight", display: "swap" });
export const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
export const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
export const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-newsreader",
  display: "swap",
});
export const fontVars = [instrument, interTight, geistMono, geist, newsreader].map((f) => f.variable).join(" ");
