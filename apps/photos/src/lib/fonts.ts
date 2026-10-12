import { Geist, Geist_Mono, Inter_Tight } from "next/font/google";

// SIL Open Font License, self-hosted by next/font at build time.
export const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
export const interTight = Inter_Tight({ subsets: ["latin"], variable: "--font-inter-tight", display: "swap" });
export const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
export const fontVars = [geist, interTight, geistMono].map((f) => f.variable).join(" ");
