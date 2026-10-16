import "@halation/ui/styles.css";
import { ThemeProvider, ThemeScript } from "@halation/ui";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_MAKE_URL ?? "https://make.jerryqiu.com"),
  title: { default: "Make", template: "%s · Make" },
  description: "Projects I build, with the write-ups of how they work.",
};

// Placeholder app (docs/project/17-make-site.md). It borrows the hub theme until Make gets its own preset.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript preset="hub" />
      </head>
      <body className="hl-root">
        <ThemeProvider preset="hub">{children}</ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
