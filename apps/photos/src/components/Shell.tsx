import { SiteShell } from "@jerryqiu/sites/shell";
import type { ReactNode } from "react";
import { nav } from "@/content/nav";

export function Shell({ children, cinema = false }: { children: ReactNode; cinema?: boolean }) {
  return (
    <SiteShell currentId="photos" links={[{ label: "Home", href: "/" }, ...nav]} cinema={cinema}>
      {children}
    </SiteShell>
  );
}
