import { SiteShell } from "@jerryqiu/sites/shell";
import type { ReactNode } from "react";
import { nav } from "@/content/nav";

export function Shell({ children, transparentTop = false }: { children: ReactNode; transparentTop?: boolean }) {
  return (
    <SiteShell currentId="photos" links={nav} transparentTop={transparentTop}>
      {children}
    </SiteShell>
  );
}
