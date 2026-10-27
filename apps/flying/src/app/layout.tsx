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

export const metadata: Metadata = {
  metadataBase: new URL(getSite("flying").url),
  title: { default: "Flying · Jerry Qiu", template: "%s · Flying · Jerry Qiu" },
  description: "Notes, a log and learning tools about flying.",
  other: { "ai-crawlers": "noai, noimageai" },
};

export default async function FlyingLayout({ children }: { children: ReactNode }) {
  const { general } = await siteSettings("flying");
  return (
    <html lang="en" suppressHydrationWarning className={fontVars}>
      <head>
        <meta name="robots" content="noai, noimageai" />
      </head>
      <body>
        <Theme theme={{ accent: "cyan" }}>
          {general.maintenance ? <Maintenance message={general.maintenanceMessage} /> : children}
        </Theme>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
