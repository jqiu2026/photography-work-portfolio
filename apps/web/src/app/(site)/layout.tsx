import "@placeholder/ui/styles.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider, ThemeScript } from "@placeholder/ui";
import { SmoothScroll } from "@placeholder/ui/motion";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { fontVars } from "@/lib/fonts";
import { Maintenance } from "@/components/site/Maintenance";
import { person } from "@/content/site";
import { siteSettings } from "@/lib/site-settings";

const base =
  process.env.NEXT_PUBLIC_HUB_URL ??
  (process.env.NODE_ENV === "production" ? "https://jerryqiu.com" : "http://localhost:3000");

export async function generateMetadata(): Promise<Metadata> {
  const { seo, general } = await siteSettings("hub");
  const name = general.siteName || person.name;
  return {
    metadataBase: new URL(base),
    title: { default: seo.title || name, template: `%s · ${name}` },
    description: seo.description || "Jerry Qiu: photographs, projects and writing.",
    openGraph: {
      type: "website",
      siteName: name,
      ...(seo.ogImageMediaId ? { images: [`/api/img/${seo.ogImageMediaId}?w=1600`] } : {}),
    },
    other: { "ai-crawlers": "noai, noimageai" },
    robots: { index: true, follow: true },
  };
}

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const { general } = await siteSettings("hub");
  return (
    <html lang="en" suppressHydrationWarning className={fontVars}>
      <head>
        <ThemeScript preset="hub" />
        <meta name="robots" content="noai, noimageai" />
      </head>
      <body className="ph-root">
        <ThemeProvider preset="hub">
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
