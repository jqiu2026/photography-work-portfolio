import "@halation/ui/styles.css";
import { ThemeScript } from "@jerryqiu/sites/theme-script";
import Script from "next/script";
import { ThemeProvider } from "@halation/ui";
import { ScreenshotGuard } from "@halation/ui/media";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getSite } from "@jerryqiu/sites";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Maintenance } from "@/components/Maintenance";
import { fontVars } from "@/lib/fonts";
import { photosSettings } from "@/lib/site-settings";

export async function generateMetadata(): Promise<Metadata> {
  const { seo, general } = await photosSettings();
  return {
    metadataBase: new URL(getSite("photos").url),
    title: {
      default: seo.title || "Photography · Jerry Qiu",
      template: `%s · ${general.siteName || "Jerry Qiu Photography"}`,
    },
    description: seo.description || "Photography by Jerry Qiu: theater, events, street and aviation.",
    other: { "ai-crawlers": "noai, noimageai" },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { general } = await photosSettings();
  return (
    <html lang="en" suppressHydrationWarning className={fontVars}>
      <head>
        <ThemeScript preset="photos" defaultTheme="dark" />
        <meta name="robots" content="noai, noimageai" />
      </head>
      <body className="hl-root">
        <ThemeProvider preset="photos" defaultTheme="dark">
          <ScreenshotGuard level="off">
            {general.maintenance ? <Maintenance message={general.maintenanceMessage} /> : children}
          </ScreenshotGuard>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
