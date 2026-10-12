import { DM_Mono, Instrument_Sans } from "next/font/google";

// SIL Open Font License, self-hosted by next/font at build time. One sans family, plus a mono for small details.
export const sans = Instrument_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
export const mono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });
export const fontVars = [sans, mono].map((f) => f.variable).join(" ");
