import "@halation/ui/styles.css";
import { ThemeScript } from "@jerryqiu/sites/theme-script";
import { ThemeProvider, ToastProvider, TooltipProvider } from "@halation/ui";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { fontVars } from "@/lib/fonts";
import "@/components/admin/admin.css";

// The CMS is private: never indexed, never cached by shared caches.
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={fontVars}>
      <head>
        <ThemeScript preset="hub" />
        <meta name="robots" content="noindex, nofollow, noarchive" />
      </head>
      <body className="hl-root">
        <ThemeProvider preset="hub">
          <TooltipProvider>
            <ToastProvider>{children}</ToastProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
