import type { ReactNode } from "react";

export const metadata = { title: "Photography (placeholder)" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, padding: "4rem 2rem" }}>{children}</body>
    </html>
  );
}
