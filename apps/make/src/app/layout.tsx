import "@holominimal/ui/styles.css";
import "./holominimal.css";
import { Theme } from "@holominimal/ui";
import { getMakeUrl } from "@jerryqiu/sites";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Maintenance } from "@/components/Maintenance";
import { fontVars } from "@/lib/fonts";
import { siteSettings } from "@/lib/site-settings";

export const metadata: Metadata = {
  metadataBase: new URL(getMakeUrl()),
  title: { default: "Make · Jerry Qiu", template: "%s · Make · Jerry Qiu" },
  description: "Projects I build, with write-ups of how they work and what I learned.",
  other: { "ai-crawlers": "noai, noimageai" },
};

export default async function MakeLayout({ children }: { children: ReactNode }) {
  const { general } = await siteSettings("hub");
  return (
    <html lang="en" suppressHydrationWarning className={fontVars}>
      <head>
        <meta name="robots" content="noai, noimageai" />
      </head>
      <body>
        <Theme theme={{ accent: "green" }}>
          {general.maintenance ? <Maintenance message={general.maintenanceMessage} /> : children}
        </Theme>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
