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
  metadataBase: new URL(getSite("photos").url),
  title: { default: "Photography · Jerry Qiu", template: "%s · Jerry Qiu Photography" },
  description: "Photography by Jerry Qiu: theater, events, street and aviation.",
  other: { "ai-crawlers": "noai, noimageai" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={fontVars}>
      <head>
        <ThemeScript preset="photos" defaultTheme="dark" />
        <meta name="robots" content="noai, noimageai" />
      </head>
      <body className="ph-root">
        <ThemeProvider preset="photos" defaultTheme="dark">
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
