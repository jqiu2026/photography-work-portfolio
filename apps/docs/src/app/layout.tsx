import "@halation/ui/styles.css";
import { DM_Mono, Instrument_Sans } from "next/font/google";
import { ThemeProvider, ThemeScript, SkipLink, ThemeToggle, TooltipProvider, ToastProvider } from "@halation/ui";
import type { ReactNode } from "react";
import { Sidebar } from "@/lib/Sidebar";
import "./docs.css";

const sans = Instrument_Sans({ subsets: ["latin"], variable: "--font-sans" });
const mono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

export const metadata = { title: { default: "Halation docs", template: "%s · Halation" }, description: "A small, calm UI kit with an Apple-style motion layer." };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
      <head><ThemeScript preset="hub" /></head>
      <body className="hl-root">
        <ThemeProvider preset="hub">
          <TooltipProvider><ToastProvider>
          <SkipLink />
          <div className="docs-shell">
            <Sidebar toggle={<ThemeToggle />} />
            <main id="main" className="docs-main">{children}</main>
          </div>
          </ToastProvider></TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
