import "@halation/ui/styles.css";
import { ThemeScript } from "@jerryqiu/sites/theme-script";
import { ThemeProvider } from "@halation/ui";
import { ScreenshotGuard } from "@halation/ui/media";
import { SmoothScroll } from "@halation/ui/motion";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getSite } from "@jerryqiu/sites";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Maintenance } from "@/components/site/Maintenance";
import { fontVars } from "@/lib/fonts";
import { siteSettings } from "@/lib/site-settings";

export const metadata: Metadata = {
  metadataBase: new URL(getSite("flying").url),
  title: { default: "Flying · Jerry Qiu", template: "%s · Flying · Jerry Qiu" },
  description: "Notes and photos about flying, by Jerry Qiu.",
  other: { "ai-crawlers": "noai, noimageai" },
};

export default async function FlyingLayout({ children }: { children: ReactNode }) {
  const { general, protection } = await siteSettings("flying");
  return (
    <html lang="en" suppressHydrationWarning className={fontVars}>
      <head>
        <ThemeScript preset="flying" />
        <meta name="robots" content="noai, noimageai" />
      </head>
      <body className="hl-root">
        <ThemeProvider preset="flying">
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
