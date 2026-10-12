import "@placeholder/ui/styles.css";
import { ThemeProvider, ThemeScript, TooltipProvider } from "@placeholder/ui";
import { SmoothScroll } from "@placeholder/ui/motion";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getSite } from "@jerryqiu/sites";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { fontVars } from "@/lib/fonts";

export const metadata: Metadata = {
  metadataBase: new URL(getSite("music").url),
  title: { default: "Music · Jerry Qiu", template: "%s · Music · Jerry Qiu" },
  description: "Music by Jerry Qiu: background, recordings and performances.",
  other: { "ai-crawlers": "noai, noimageai" },
};

export default function MusicLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={fontVars}>
      <head>
        <ThemeScript preset="music" />
        <meta name="robots" content="noai, noimageai" />
      </head>
      <body className="ph-root">
        <ThemeProvider preset="music">
          <TooltipProvider>
            <SmoothScroll>{children}</SmoothScroll>
          </TooltipProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
