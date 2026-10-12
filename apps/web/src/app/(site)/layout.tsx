import "@placeholder/ui/styles.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider, ThemeScript, TooltipProvider } from "@placeholder/ui";
import { SmoothScroll } from "@placeholder/ui/motion";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { fontVars } from "@/lib/fonts";
import { person } from "@/content/site";

const base =
  process.env.NEXT_PUBLIC_HUB_URL ??
  (process.env.NODE_ENV === "production" ? "https://jerryqiu.com" : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(base),
  title: { default: person.name, template: `%s · ${person.name}` },
  description: "Jerry Qiu: photographs, projects and writing.",
  openGraph: { type: "website", siteName: person.name },
  other: { "ai-crawlers": "noai, noimageai" },
  robots: { index: true, follow: true },
};

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={fontVars}>
      <head>
        <ThemeScript preset="hub" />
        <meta name="robots" content="noai, noimageai" />
      </head>
      <body className="ph-root">
        <ThemeProvider preset="hub">
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
