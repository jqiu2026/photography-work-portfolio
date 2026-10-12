import { SiteShell as Shell } from "@jerryqiu/sites/shell";
import type { ReactNode } from "react";
import { nav } from "@/content/site";

/** Hub chrome: the shared shell with the hub's navigation. */
export function SiteShell({ children, transparentTop = true }: { children: ReactNode; transparentTop?: boolean }) {
  return (
    <Shell currentId="hub" links={nav} transparentTop={transparentTop}>
      {children}
    </Shell>
  );
}
