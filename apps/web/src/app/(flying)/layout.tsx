import "@placeholder/ui/styles.css";
import { ThemeProvider, ThemeScript } from "@placeholder/ui";
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
  metadataBase: new URL(getSite("flying").url),
  title: { default: "Flying · Jerry Qiu", template: "%s · Flying · Jerry Qiu" },
  description: "Notes and photos about flying, by Jerry Qiu.",
  other: { "ai-crawlers": "noai, noimageai" },
};

export default async function FlyingLayout({ children }: { children: ReactNode }) {
  const { general } = await siteSettings("flying");
  return (
    <html lang="en" suppressHydrationWarning className={fontVars}>
      <head>
        <ThemeScript preset="flying" />
        <meta name="robots" content="noai, noimageai" />
      </head>
      <body className="ph-root">
        <ThemeProvider preset="flying">
          <SmoothScroll>
            {general.maintenance ? <Maintenance message={general.maintenanceMessage} /> : children}
          </SmoothScroll>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
