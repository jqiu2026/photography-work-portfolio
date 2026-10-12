import "@placeholder/ui/styles.css";
import { ThemeProvider, ThemeScript } from "@placeholder/ui";
import { ScreenshotGuard } from "@placeholder/ui/media";
import { SmoothScroll } from "@placeholder/ui/motion";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getSite } from "@jerryqiu/sites";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Maintenance } from "@/components/site/Maintenance";
import { fontVars } from "@/lib/fonts";
import { siteSettings } from "@/lib/site-settings";

export const metadata: Metadata = {
  metadataBase: new URL(getSite("music").url),
  title: { default: "Music · Jerry Qiu", template: "%s · Music · Jerry Qiu" },
  description: "Music by Jerry Qiu: background, recordings and performances.",
  other: { "ai-crawlers": "noai, noimageai" },
};

export default async function MusicLayout({ children }: { children: ReactNode }) {
  const { general, protection } = await siteSettings("music");
  return (
    <html lang="en" suppressHydrationWarning className={fontVars}>
      <head>
        <ThemeScript preset="music" />
        <meta name="robots" content="noai, noimageai" />
      </head>
      <body className="ph-root">
        <ThemeProvider preset="music">
          <ScreenshotGuard level={protection.level}>
            <SmoothScroll>
              {general.maintenance ? <Maintenance message={general.maintenanceMessage} /> : children}
            </SmoothScroll>
          </ScreenshotGuard>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
