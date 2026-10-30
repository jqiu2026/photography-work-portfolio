import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Protect } from "@/components/Protect";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Photos · Jerry Qiu", template: "%s · Jerry Qiu" },
  description: "Photography by Jerry Qiu: events, creative work, sports, portraits, theater, music, dance and weddings.",
  robots: { index: true, follow: true, noimageindex: true },
};
export const viewport: Viewport = { colorScheme: "dark", themeColor: "#000000" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
        <footer className="foot">
          <span>&copy; {new Date().getFullYear()} Jerry Qiu. All photographs are protected; please do not copy or reuse them.</span>
          <span>
            Inquiries: <a className="mail" href="mailto:info@jerryqiu.com">info@jerryqiu.com</a>
          </span>
        </footer>
        <Protect />
      </body>
    </html>
  );
}
