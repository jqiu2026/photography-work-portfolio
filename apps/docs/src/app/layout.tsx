import "@placeholder/ui/styles.css";
import { Geist_Mono, Instrument_Serif, Inter_Tight } from "next/font/google";
import { ThemeProvider, ThemeScript, SkipLink, ThemeToggle } from "@placeholder/ui";
import type { ReactNode } from "react";
import { Sidebar } from "@/lib/Sidebar";
import "./docs.css";

const serif = Instrument_Serif({ weight: "400", subsets: ["latin"], variable: "--font-instrument-serif" });
const sans = Inter_Tight({ subsets: ["latin"], variable: "--font-inter-tight" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata = { title: { default: "PlaceholderUI docs", template: "%s · PlaceholderUI" }, description: "A small, calm UI kit with an Apple-style motion layer." };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <head><ThemeScript preset="hub" /></head>
      <body className="ph-root">
        <ThemeProvider preset="hub">
          <SkipLink />
          <div className="docs-shell">
            <Sidebar toggle={<ThemeToggle />} />
            <main id="main" className="docs-main">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
