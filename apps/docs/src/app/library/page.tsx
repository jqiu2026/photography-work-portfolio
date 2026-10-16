import { Anybody, Hanken_Grotesk, Martian_Mono, Newsreader } from "next/font/google";
import type { Metadata } from "next";
import { Library } from "@/components/library/Library";
import "@/components/library/library.css";

export const metadata: Metadata = { title: "Library", description: "Halation UI: every element, live." };

const display = Anybody({ subsets: ["latin"], axes: ["wdth"], variable: "--font-display", display: "swap" });
const sans = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const voice = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-voice", display: "swap" });
const mono = Martian_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export default function Page() {
  return (
    <div className={`lib ${[display, sans, voice, mono].map((f) => f.variable).join(" ")}`}>
      <Library />
    </div>
  );
}
