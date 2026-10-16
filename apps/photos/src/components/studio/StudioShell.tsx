import type { ReactNode } from "react";

/** The studio's page frame. The sidebar and background come from app/studio/layout.tsx, so there is no site header here. */
export function StudioShell({ children }: { children: ReactNode }) {
  return <main id="main">{children}</main>;
}
