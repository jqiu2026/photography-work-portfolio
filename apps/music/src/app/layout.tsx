import "@holominimal/ui/styles.css";
import "./holominimal.css";
import { Theme } from "@holominimal/ui";
import { getSite } from "@jerryqiu/sites";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Maintenance } from "@/components/Maintenance";
import { fontVars } from "@/lib/fonts";
import { siteSettings } from "@/lib/site-settings";
import { IntroCover } from "@jerryqiu/sites/intro";

export const metadata: Metadata = {
  metadataBase: new URL(getSite("music").url),
  title: { default: "Music · Jerry Qiu", template: "%s · Music · Jerry Qiu" },
  description: "Music by Jerry Qiu: compositions, recordings, performances, and scores to play.",
  other: { "ai-crawlers": "noai, noimageai" },
};

export default async function MusicLayout({ children }: { children: ReactNode }) {
  const { general } = await siteSettings("music");
  return (
    <html lang="en" suppressHydrationWarning className={fontVars}>
      <head>
        <IntroCover />
        <meta name="robots" content="noai, noimageai" />
      </head>
      <body>
        <Theme theme={{ accent: "amber" }}>
          {general.maintenance ? <Maintenance message={general.maintenanceMessage} /> : children}
        </Theme>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
