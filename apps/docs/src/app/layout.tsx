import "@holominimal/ui/styles.css";
import { AppShell, Atmosphere, Theme, ToastProvider } from "@holominimal/ui";
import type { ReactNode } from "react";
import { Sidebar } from "@/lib/Sidebar";
import "./docs.css";

export const metadata = {
  title: { default: "Holominimal", template: "%s · Holominimal" },
  description: "Holominimal: the design system behind these sites. Black, editorial, holographic light, motion that explains.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Theme theme={{ accent: "violet" }}>
          <ToastProvider>
            <AppShell backdrop={<Atmosphere />} sidebar={<Sidebar />}>
              <main className="docs-main">{children}</main>
            </AppShell>
          </ToastProvider>
        </Theme>
      </body>
    </html>
  );
}
